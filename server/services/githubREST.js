const { Octokit } = require('@octokit/rest');

/**
 * GitHub REST API fallback service.
 * Used when GraphQL hits secondary rate limits or for specific endpoints
 * not available via GraphQL.
 */

const createRestClient = (token) => {
  const authToken = token || process.env.GITHUB_PAT;
  return new Octokit({
    auth: authToken,
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        console.warn(`[REST] Rate limit hit for ${options.method} ${options.url}. Retrying after ${retryAfter}s...`);
        if (options.request.retryCount < 2) return true;
      },
      onSecondaryRateLimit: (retryAfter, options, octokit) => {
        console.warn(`[REST] Secondary rate limit for ${options.method} ${options.url}`);
      },
    },
  });
};

/**
 * Fallback: Fetch basic user profile from REST API
 */
const fetchUserProfile = async (username, token) => {
  const octokit = createRestClient(token);
  try {
    const { data } = await octokit.users.getByUsername({ username });
    return {
      username: data.login,
      displayName: data.name || data.login,
      bio: data.bio || '',
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
      publicRepos: data.public_repos,
      followers: data.followers,
      following: data.following,
    };
  } catch (err) {
    console.error(`[REST] Failed to fetch profile for ${username}:`, err.message);
    throw err;
  }
};

/**
 * Fallback: Fetch user repositories with language data
 */
const fetchUserRepos = async (username, token) => {
  const octokit = createRestClient(token);
  try {
    const { data: repos } = await octokit.repos.listForUser({
      username,
      sort: 'pushed',
      per_page: 30,
      type: 'owner',
    });
    return repos;
  } catch (err) {
    console.error(`[REST] Failed to fetch repos for ${username}:`, err.message);
    throw err;
  }
};

/**
 * Fallback: Fetch contribution events (less detailed than GraphQL)
 */
const fetchContributionEvents = async (username, token) => {
  const octokit = createRestClient(token);
  try {
    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });

    return events.filter((e) =>
      ['PushEvent', 'PullRequestEvent', 'CreateEvent'].includes(e.type)
    );
  } catch (err) {
    console.error(`[REST] Failed to fetch events for ${username}:`, err.message);
    throw err;
  }
};

module.exports = {
  fetchUserProfile,
  fetchUserRepos,
  fetchContributionEvents,
};
