const { graphql } = require('@octokit/graphql');

/**
 * Creates an authenticated GraphQL client for a given access token.
 * Falls back to GITHUB_PAT env var for server-side CRON calls.
 */
const createClient = (token) => {
  const authToken = token || process.env.GITHUB_PAT;
  if (!authToken) throw new Error('No GitHub token provided for GraphQL client.');

  return graphql.defaults({
    headers: {
      authorization: `token ${authToken}`,
    },
  });
};

// ─── Primary Query ─────────────────────────────────────────────────────────────
// Fetches ALL required data in a single round-trip to minimize rate limit usage.
// Covers: profile, contributions, merged PRs (with repo stars), languages, heatmap.
const FULL_PROFILE_QUERY = `
  query FetchFullProfile($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      name
      login
      bio
      avatarUrl
      url
      publicRepos: repositories(privacy: PUBLIC) {
        totalCount
      }
      followers {
        totalCount
      }
      following {
        totalCount
      }

      # Contribution stats for the past year
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }

      # Merged PRs — up to 100, sorted by newest
      pullRequests(
        states: MERGED
        first: 100
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          title
          url
          mergedAt
          additions
          deletions
          baseRepository {
            name
            owner {
              login
            }
            stargazerCount
            primaryLanguage {
              name
            }
          }
        }
      }

      # Open PRs count
      openPullRequests: pullRequests(states: OPEN) {
        totalCount
      }

      # Top repositories for language analysis
      repositories(
        first: 30
        ownerAffiliations: OWNER
        orderBy: { field: PUSHED_AT, direction: DESC }
        privacy: PUBLIC
      ) {
        nodes {
          name
          stargazerCount
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

// ─── Streak Calculation Helper ─────────────────────────────────────────────────
const calculateStreak = (weeks) => {
  const days = weeks.flatMap((w) => w.contributionDays).reverse();
  let current = 0;
  let longest = 0;
  let temp = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      temp++;
      if (temp > longest) longest = temp;
    } else {
      if (current === 0 && temp > 0) current = temp;
      temp = 0;
    }
  }

  if (current === 0 && temp > 0) current = temp;
  return { currentStreak: current, longestStreak: longest };
};

// ─── Language Aggregation Helper ───────────────────────────────────────────────
const aggregateLanguages = (repositories) => {
  const langMap = {};

  for (const repo of repositories) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const color = edge.node.color;
      const size = edge.size;

      if (!langMap[name]) {
        langMap[name] = { name, color, linesOfCode: 0 };
      }
      langMap[name].linesOfCode += size;
    }
  }

  const sorted = Object.values(langMap).sort((a, b) => b.linesOfCode - a.linesOfCode);
  const total = sorted.reduce((sum, l) => sum + l.linesOfCode, 0);

  return sorted.map((lang) => ({
    ...lang,
    percentage: total > 0 ? Math.round((lang.linesOfCode / total) * 1000) / 10 : 0,
  }));
};

// ─── PR Analysis Helper ────────────────────────────────────────────────────────
const analyzePRs = (prNodes, username) => {
  const analyzed = prNodes.map((pr) => {
    const repoOwner = pr.baseRepository?.owner?.login || '';
    const isExternal = repoOwner.toLowerCase() !== username.toLowerCase();
    const repoStars = pr.baseRepository?.stargazerCount || 0;

    return {
      title: pr.title,
      url: pr.url,
      repoName: pr.baseRepository?.name || '',
      repoOwner,
      repoStars,
      isExternal,
      mergedAt: pr.mergedAt,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
    };
  });

  return {
    all: analyzed,
    external: analyzed.filter((p) => p.isExternal),
    personal: analyzed.filter((p) => !p.isExternal),
  };
};

// ─── Heatmap Formatter ─────────────────────────────────────────────────────────
const formatHeatmap = (weeks) => {
  return weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({
      date: day.date,
      count: day.contributionCount,
      level: day.contributionLevel === 'NONE' ? 0
        : day.contributionLevel === 'FIRST_QUARTILE' ? 1
        : day.contributionLevel === 'SECOND_QUARTILE' ? 2
        : day.contributionLevel === 'THIRD_QUARTILE' ? 3
        : 4,
    }))
  );
};

// ─── Monthly Growth Builder ────────────────────────────────────────────────────
const buildMonthlyGrowth = (prNodes) => {
  const monthMap = {};

  // Initialize last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { month: key, score: 0, commits: 0, prs: 0 };
  }

  // Add PR contributions
  for (const pr of prNodes) {
    if (!pr.mergedAt) continue;
    const d = new Date(pr.mergedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthMap[key]) {
      monthMap[key].prs++;
      monthMap[key].score += 5; // base score per merged PR per month
    }
  }

  return Object.values(monthMap);
};

// ─── Main Export: fetchFullProfile ─────────────────────────────────────────────
/**
 * Fetches and normalizes all GitHub data for a user in a single GraphQL call.
 * Returns a structured object ready for scoreEngine and MongoDB.
 *
 * @param {string} username - GitHub username
 * @param {string} token - User's OAuth access token
 * @returns {Promise<Object>} Normalized profile data
 */
const fetchFullProfile = async (username, token) => {
  const client = createClient(token);

  // Fetch the past 12 months of data
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  console.log(`[GraphQL] Fetching full profile for: ${username}`);

  try {
    const { user } = await client(FULL_PROFILE_QUERY, {
      username,
      from: oneYearAgo.toISOString(),
      to: now.toISOString(),
    });

    if (!user) throw new Error(`GitHub user not found: ${username}`);

    const contrib = user.contributionsCollection;
    const prNodes = user.pullRequests.nodes;
    const { all: allPRs, external: externalPRs, personal: personalPRs } = analyzePRs(prNodes, username);
    const languages = aggregateLanguages(user.repositories.nodes);
    const { currentStreak, longestStreak } = calculateStreak(
      contrib.contributionCalendar.weeks
    );
    const heatmap = formatHeatmap(contrib.contributionCalendar.weeks);
    const monthlyGrowth = buildMonthlyGrowth(prNodes);
    const totalMergedPRs = user.pullRequests.totalCount;
    const totalOpenPRs = user.openPullRequests.totalCount;
    const mergeRate = totalMergedPRs + totalOpenPRs > 0
      ? Math.round((totalMergedPRs / (totalMergedPRs + totalOpenPRs)) * 100)
      : 0;

    return {
      // Profile
      username: user.login,
      displayName: user.name || user.login,
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      profileUrl: user.url,
      publicRepos: user.publicRepos.totalCount,
      followers: user.followers.totalCount,
      following: user.following.totalCount,

      // Metrics
      totalCommits: contrib.totalCommitContributions,
      mergedPRCount: totalMergedPRs,
      externalPRCount: externalPRs.length,
      personalPRCount: personalPRs.length,
      openPRCount: totalOpenPRs,
      prMergeRate: mergeRate,
      reviewsGiven: contrib.totalPullRequestReviewContributions,
      issuesOpened: contrib.totalIssueContributions,

      // Streaks
      currentStreak,
      longestStreak,

      // PR data
      recentMergedPRs: allPRs.slice(0, 20),
      externalPRs,

      // Visualizations
      languages: languages.slice(0, 10),
      contributionHeatmap: heatmap,
      monthlyGrowth,
    };
  } catch (error) {
    console.error(`[GraphQL] Failed to fetch profile for ${username}:`, error.message);
    throw error;
  }
};

module.exports = { fetchFullProfile };
