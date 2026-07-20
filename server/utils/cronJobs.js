const cron = require('node-cron');
const User = require('../models/User');
const Leaderboard = require('../models/Leaderboard');
const { refreshUserCache } = require('./cacheManager');

const CRON_DELAY_MS = parseInt(process.env.CRON_DELAY_MS) || 500;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 2 * * *';

/**
 * Sleeps for a given number of milliseconds.
 * Used to pace GitHub API calls and avoid rate limiting.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * ─── Daily User Refresh Job ───────────────────────────────────────────────────
 *
 * Iterates through ALL tracked users in MongoDB and refreshes each one's
 * GitHub data via the GraphQL API.
 *
 * Pacing strategy:
 * - CRON_DELAY_MS (default: 500ms) between each user = 2 users/sec max
 * - At 2 req/sec, ~7,200 users can be refreshed per hour
 * - Well within GitHub's 5,000 authenticated requests/hour (we use 1 req/user)
 */
const runDailyRefresh = async () => {
  const startTime = Date.now();
  console.log(`\n[CRON] ═══ Daily Refresh Job Started at ${new Date().toISOString()} ═══`);

  try {
    // Fetch all user IDs (minimal projection for memory efficiency)
    const users = await User.find({}, '_id username lastCacheUpdate').lean();
    console.log(`[CRON] Found ${users.length} users to refresh`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        await refreshUserCache(user._id);
        successCount++;
      } catch (err) {
        console.error(`[CRON] Failed to refresh ${user.username}: ${err.message}`);
        failCount++;
      }

      // Log progress every 10 users
      if ((i + 1) % 10 === 0) {
        console.log(`[CRON] Progress: ${i + 1}/${users.length} (${successCount} ok, ${failCount} failed)`);
      }

      // Pace the requests to avoid hitting rate limits
      if (i < users.length - 1) {
        await sleep(CRON_DELAY_MS);
      }
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.log(
      `[CRON] ═══ Daily Refresh Complete: ${successCount}/${users.length} succeeded in ${durationSec}s ═══\n`
    );
  } catch (err) {
    console.error('[CRON] Fatal error in daily refresh job:', err);
  }
};

/**
 * ─── Leaderboard Snapshot Job ────────────────────────────────────────────────
 *
 * After user data is refreshed, rebuilds all leaderboard snapshots
 * to reflect the latest scores. Runs 30 minutes after the daily refresh.
 */
const runLeaderboardSnapshot = async () => {
  console.log(`[CRON] ═══ Leaderboard Snapshot Started at ${new Date().toISOString()} ═══`);

  try {
    const leaderboards = await Leaderboard.find({});
    console.log(`[CRON] Updating ${leaderboards.length} leaderboards`);

    for (const board of leaderboards) {
      // Fetch current scores for all members
      const memberUsernames = board.members.map((m) => m.username);
      const users = await User.find(
        { username: { $in: memberUsernames } },
        'username displayName avatarUrl impactScore specialtyTag currentStreak mergedPRCount'
      );

      // Update member snapshots
      for (const member of board.members) {
        const freshUser = users.find((u) => u.username === member.username);
        if (freshUser) {
          member.impactScore = freshUser.impactScore;
          member.specialtyTag = freshUser.specialtyTag;
          member.currentStreak = freshUser.currentStreak;
          member.mergedPRCount = freshUser.mergedPRCount;
        }
      }

      board.refreshMemberRanks();

      // Add to snapshot history (keep last 30)
      board.snapshotHistory.push({
        capturedAt: new Date(),
        avgScore: board.avgImpactScore,
        topUsername: board.topContributor?.username || '',
      });
      if (board.snapshotHistory.length > 30) {
        board.snapshotHistory.shift();
      }

      board.lastUpdated = new Date();
      await board.save();
      console.log(`[CRON] Updated leaderboard: ${board.institutionName}`);
    }

    console.log('[CRON] ═══ Leaderboard Snapshot Complete ═══\n');
  } catch (err) {
    console.error('[CRON] Error in leaderboard snapshot:', err);
  }
};

/**
 * ─── Start All CRON Jobs ──────────────────────────────────────────────────────
 *
 * Called once on server startup from server/index.js
 */
const startCronJobs = () => {
  // Daily user refresh at 2:00 AM
  cron.schedule(CRON_SCHEDULE, async () => {
    await runDailyRefresh();
  });

  // Leaderboard snapshot at 2:30 AM
  cron.schedule('30 2 * * *', async () => {
    await runLeaderboardSnapshot();
  });

  console.log(`[CRON] Scheduled daily refresh: "${CRON_SCHEDULE}" | Leaderboard: "30 2 * * *"`);
};

module.exports = { startCronJobs, runDailyRefresh, runLeaderboardSnapshot };
