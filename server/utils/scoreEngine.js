/**
 * ═══════════════════════════════════════════════════════════════════
 * GitTrack Impact Score Engine
 * ═══════════════════════════════════════════════════════════════════
 *
 * Solves the "Green Square Problem" by weighting contributions on
 * QUALITY and IMPACT rather than raw commit volume.
 *
 * Scoring Formula:
 *   • Merged PR → External Repo (stars ≤ 1,000):  weight = 10
 *   • Merged PR → External Repo (stars > 1,000):  weight = 15 (×1.5 multiplier)
 *   • Merged PR → External Repo (stars > 10,000): weight = 20 (×2.0 multiplier)
 *   • Merged PR → Personal Repo:                  weight = 3
 *   • Standard Commit:                            weight = 1
 *   • PR Review Given:                            weight = 2
 *
 * Final score is log-normalized to a 0–100 scale to prevent outliers
 * from pushing everyone else to near-zero.
 * ═══════════════════════════════════════════════════════════════════
 */

// Calibration constant: a "perfect" developer who merges 20 external PRs
// to repos with 10k+ stars plus 500 commits = raw score ~520.
// We use this to define what "100" looks like.
const MAX_CALIBRATION_SCORE = 600;

/**
 * Determines the weight multiplier based on target repository star count.
 * @param {number} stars
 * @returns {number} multiplier
 */
const getStarMultiplier = (stars) => {
  if (stars >= 10000) return 2.0;
  if (stars >= 1000) return 1.5;
  if (stars >= 100) return 1.2;
  return 1.0;
};

/**
 * Calculates the weighted score contribution from a single merged PR.
 * @param {Object} pr - PR detail object from githubGraphQL
 * @returns {number} weighted score for this PR
 */
const scorePR = (pr) => {
  const BASE_EXTERNAL = 10;
  const BASE_PERSONAL = 3;

  if (pr.isExternal) {
    const multiplier = getStarMultiplier(pr.repoStars);
    return BASE_EXTERNAL * multiplier;
  }
  return BASE_PERSONAL;
};

/**
 * Normalizes a raw accumulated score to a 0–100 scale using
 * logarithmic dampening. This prevents "whale" contributors from
 * compressing everyone else near zero on a linear scale.
 *
 * @param {number} rawScore
 * @returns {number} normalized score 0–100
 */
const normalizeScore = (rawScore) => {
  if (rawScore <= 0) return 0;
  const logScore = Math.log(rawScore + 1);
  const logMax = Math.log(MAX_CALIBRATION_SCORE + 1);
  return Math.min(100, Math.round((logScore / logMax) * 100));
};

/**
 * ─── Main Export: calculateImpactScore ───────────────────────────────────────
 *
 * Computes the full Impact Score for a user given their normalized GitHub data.
 *
 * @param {Object} profileData - Returned from githubGraphQL.fetchFullProfile
 * @returns {Object} { impactScore, scoreBreakdown }
 */
const calculateImpactScore = (profileData) => {
  const {
    externalPRs = [],
    recentMergedPRs = [],
    totalCommits = 0,
    reviewsGiven = 0,
    personalPRCount = 0,
  } = profileData;

  let externalPRScore = 0;
  let starMultiplierBonus = 0;
  let externalPRDetails = [];

  // Score each external PR individually
  for (const pr of externalPRs) {
    const baseScore = 10;
    const multiplier = getStarMultiplier(pr.repoStars);
    const prScore = baseScore * multiplier;
    externalPRScore += prScore;

    if (multiplier > 1.0) {
      starMultiplierBonus += prScore - baseScore;
    }

    externalPRDetails.push({
      ...pr,
      weight: prScore,
      multiplier,
    });
  }

  // Score personal merged PRs
  const personalPRScore = personalPRCount * 3;

  // Score raw commits (capped to avoid gaming)
  const cappedCommits = Math.min(totalCommits, 500);
  const commitScore = cappedCommits * 1;

  // Score review contributions
  const reviewScore = Math.min(reviewsGiven, 100) * 2;

  // Sum raw total
  const rawTotal = externalPRScore + personalPRScore + commitScore + reviewScore;

  // Normalize to 0-100
  const impactScore = normalizeScore(rawTotal);

  const scoreBreakdown = {
    externalPRScore: Math.round(externalPRScore),
    personalPRScore: Math.round(personalPRScore),
    commitScore: Math.round(commitScore),
    reviewScore: Math.round(reviewScore),
    starMultiplierBonus: Math.round(starMultiplierBonus),
    rawTotal: Math.round(rawTotal),
  };

  console.log(
    `[ScoreEngine] ${profileData.username}: raw=${rawTotal.toFixed(1)}, ` +
    `normalized=${impactScore}/100 | ` +
    `extPR=${externalPRScore.toFixed(1)}, commits=${commitScore}`
  );

  return {
    impactScore,
    scoreBreakdown,
    scoredPRs: externalPRDetails,
  };
};

/**
 * Calculates month-over-month growth index as a percentage change.
 * @param {Array} monthlyGrowth - 12-element array from githubGraphQL
 * @returns {number} growth percentage (positive = growing)
 */
const calculateGrowthIndex = (monthlyGrowth) => {
  if (!monthlyGrowth || monthlyGrowth.length < 2) return 0;
  const recent = monthlyGrowth.slice(-3).reduce((sum, m) => sum + m.score, 0) / 3;
  const previous = monthlyGrowth.slice(-6, -3).reduce((sum, m) => sum + m.score, 0) / 3;
  if (previous === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - previous) / previous) * 100);
};

module.exports = {
  calculateImpactScore,
  calculateGrowthIndex,
  scorePR,
  normalizeScore,
  getStarMultiplier,
};
