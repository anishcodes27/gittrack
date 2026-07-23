const User = require('../models/User');
const { fetchFullProfile } = require('../services/githubGraphQL');
const { fetchUserProfile } = require('../services/githubREST');
const { calculateImpactScore, calculateGrowthIndex } = require('./scoreEngine');
const { assignSpecialtyTag } = require('./tagEngine');

/**
 * ═══════════════════════════════════════════════════════════════════
 * GitTrack Smart Cache Manager
 * ═══════════════════════════════════════════════════════════════════
 *
 * Implements a 6-hour TTL cache in MongoDB to stay well under
 * GitHub's 5,000 requests/hour rate limit.
 *
 * Flow:
 *   1. Client requests user data
 *   2. cacheManager checks lastCacheUpdate timestamp
 *   3a. If FRESH (< 6 hours old): return cached MongoDB document
 *   3b. If STALE (> 6 hours old): fetch from GitHub GraphQL → recalculate
 *       → update MongoDB → return fresh data
 * ═══════════════════════════════════════════════════════════════════
 */

const TTL_HOURS = parseInt(process.env.CACHE_TTL_HOURS) || 6;
const TTL_MS = TTL_HOURS * 60 * 60 * 1000;

/**
 * Checks if a user's cached data is stale.
 * @param {Object} user - Mongoose User document
 * @returns {boolean} true if data should be refreshed
 */
const isCacheStale = (user) => {
  if (!user.lastCacheUpdate) return true;
  return Date.now() - new Date(user.lastCacheUpdate).getTime() > TTL_MS;
};

/**
 * Fetches fresh data from GitHub, runs the score engine,
 * and persists the result back to MongoDB.
 *
 * @param {string} userId - MongoDB User _id
 * @param {string} [overrideToken] - Optional OAuth token (uses stored token if not provided)
 * @returns {Promise<Object>} Updated user document
 */
const refreshUserCache = async (userId, overrideToken = null) => {
  // Fetch user WITH accessToken (normally excluded from queries)
  const user = await User.findById(userId).select('+accessToken');
  if (!user) throw new Error(`User not found: ${userId}`);

  const token = overrideToken || user.accessToken;
  const username = user.username;

  console.log(`[Cache] Refreshing cache for ${username}...`);

  let profileData;
  try {
    // Primary: GitHub GraphQL (single batched request)
    profileData = await fetchFullProfile(username, token);
  } catch (graphqlError) {
    console.warn(`[Cache] GraphQL failed for ${username}, falling back to REST: ${graphqlError.message}`);
    try {
      // Fallback: GitHub REST API (less data, but reliable)
      profileData = await fetchUserProfile(username, token);
    } catch (restError) {
      console.error(`[Cache] Both GraphQL and REST failed for ${username}:`, restError.message);
      throw restError;
    }
  }

  // Run the Impact Score Engine
  const { impactScore, scoreBreakdown } = calculateImpactScore(profileData);

  // Calculate growth index
  const growthIndex = calculateGrowthIndex(profileData.monthlyGrowth);

  // Assign specialty tag from language data
  const { tag: specialtyTag, detail: specialtyTagDetail } = assignSpecialtyTag(profileData.languages);

  // Compute PR merge rate
  const prMergeRate = profileData.mergedPRCount > 0
    ? Math.round(profileData.mergedPRCount / (profileData.mergedPRCount + profileData.openPRCount) * 100)
    : 0;

  // Build the update payload
  const updatePayload = {
    // Profile data
    displayName: profileData.displayName,
    bio: profileData.bio,
    avatarUrl: profileData.avatarUrl,
    profileUrl: profileData.profileUrl,
    publicRepos: profileData.publicRepos,
    followers: profileData.followers,
    following: profileData.following,

    // Metrics
    totalCommits: profileData.totalCommits,
    mergedPRCount: profileData.mergedPRCount,
    externalPRCount: profileData.externalPRCount,
    personalPRCount: profileData.personalPRCount,
    openPRCount: profileData.openPRCount,
    prMergeRate,
    reviewsGiven: profileData.reviewsGiven,
    issuesOpened: profileData.issuesOpened,

    // Scores
    impactScore,
    scoreBreakdown,
    growthIndex,

    // Streaks
    currentStreak: profileData.currentStreak,
    longestStreak: profileData.longestStreak,

    // Specialization
    languages: profileData.languages,
    specialtyTag,
    specialtyTagDetail,

    // Visualizations
    monthlyGrowth: profileData.monthlyGrowth,
    contributionHeatmap: profileData.contributionHeatmap,
    recentMergedPRs: profileData.recentMergedPRs,
    repositories: profileData.repositories || [],

    // Cache timestamp
    lastCacheUpdate: new Date(),
  };

  // Persist to MongoDB
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true, runValidators: true }
  );

  console.log(`[Cache] ✓ Refreshed ${username} — Score: ${impactScore}/100`);
  return updatedUser;
};

/**
 * Main entry point: get user data, respecting cache TTL.
 * This is called by API routes — NOT directly by the CRON job.
 *
 * @param {string} username - GitHub username
 * @returns {Promise<Object>} User document (cached or freshly fetched)
 */
const getUserData = async (username) => {
  const user = await User.findOne({ username });
  if (!user) return null;

  if (isCacheStale(user)) {
    console.log(`[Cache] Data stale for ${username} — initiating refresh`);
    return await refreshUserCache(user._id);
  }

  const ageMinutes = Math.round((Date.now() - user.lastCacheUpdate) / 60000);
  console.log(`[Cache] Serving fresh cache for ${username} (${ageMinutes}min old)`);
  return user;
};

module.exports = { getUserData, refreshUserCache, isCacheStale };
