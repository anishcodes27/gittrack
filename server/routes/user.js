const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getUserData, refreshUserCache } = require('../utils/cacheManager');
const { getCommitCalendar } = require('../services/githubGraphQL');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.SESSION_SECRET || 'gittrack_dev_secret_change_in_prod';

/**
 * Middleware: Ensure the requesting user is authenticated via JWT.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { _id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * GET /api/user/:username
 * Returns full analytics data for a GitHub user.
 * Respects 6-hour cache TTL — serves MongoDB data if fresh,
 * fetches from GitHub GraphQL if stale.
 */
router.get('/:username', async (req, res) => {
  const { username } = req.params;

  try {
    let user = await getUserData(username);

    if (!user) {
      if (!process.env.GITHUB_PAT) {
        return res.status(404).json({
          success: false,
          message: `User "${username}" not found in database, and GITHUB_PAT is not set to fetch on-the-fly.`,
        });
      }
      try {
        console.log(`[API] On-the-fly fetch for ${username} using PAT: ${process.env.GITHUB_PAT ? 'SET (len=' + process.env.GITHUB_PAT.length + ')' : 'NOT SET'}`);
        // Avoid duplicate shell users
        let existingShell = await User.findOne({ username });
        let targetUser = existingShell;
        if (!existingShell) {
          targetUser = new User({
            githubId: 'temp_' + username + '_' + Date.now(),
            username: username,
            isPublic: true,
          });
          await targetUser.save();
        }

        // Fetch and score data on the fly using the server PAT
        user = await refreshUserCache(targetUser._id, process.env.GITHUB_PAT);
      } catch (fetchErr) {
        console.error(`[API] On-the-fly fetch failed for ${username}:`, fetchErr.message || fetchErr);
        // Cleanup if fetching failed
        await User.deleteOne({ username }).catch(() => {});
        return res.status(404).json({
          success: false,
          message: `Could not fetch GitHub data for "${username}": ${fetchErr.message || 'Unknown error'}`,
        });
      }
    }

    // Strip sensitive fields before sending to client
    const safeUser = user.toObject ? user.toObject() : user;
    delete safeUser.accessToken;

    return res.json({ success: true, data: safeUser });
  } catch (err) {
    console.error(`[API] GET /user/${username} error:`, err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch user data', error: err.message });
  }
});

/**
 * GET /api/user/:username/score
 * Returns just the impact score and breakdown for a user.
 * Lightweight endpoint for leaderboard rendering.
 */
router.get('/:username/score', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username }).select(
      'username displayName avatarUrl impactScore scoreBreakdown specialtyTag currentStreak mergedPRCount externalPRCount growthIndex'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: `User "${username}" not found` });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/user/:username/commit-calendar
 * Returns commit-based heatmap data for a GitHub user (for Profile page).
 * Public route — uses server PAT.
 */
router.get('/:username/commit-calendar', async (req, res) => {
  const { username } = req.params;
  try {
    if (!process.env.GITHUB_PAT) {
      return res.status(503).json({ success: false, message: 'Server PAT not configured.' });
    }
    const result = await getCommitCalendar(username, process.env.GITHUB_PAT);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error(`[API] GET /user/${username}/commit-calendar error:`, err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/user/:username/refresh
 * Forces a public cache refresh for any GitHub username.
 * No auth required — uses the server PAT just like the on-the-fly fetch in GET /:username.
 */
router.post('/:username/refresh', async (req, res) => {
  const { username } = req.params;
  try {
    if (!process.env.GITHUB_PAT) {
      return res.status(503).json({ success: false, message: 'Server PAT not configured; cannot refresh.' });
    }

    // Find or create a shell user (same pattern as GET /:username)
    let targetUser = await User.findOne({ username });
    if (!targetUser) {
      targetUser = new User({
        githubId: 'temp_' + username + '_' + Date.now(),
        username,
        isPublic: true,
      });
      await targetUser.save();
    }

    const updatedUser = await refreshUserCache(targetUser._id, process.env.GITHUB_PAT);
    return res.json({
      success: true,
      message: 'Profile refreshed successfully',
      data: {
        impactScore: updatedUser.impactScore,
        specialtyTag: updatedUser.specialtyTag,
        lastCacheUpdate: updatedUser.lastCacheUpdate,
      },
    });
  } catch (err) {
    console.error(`[API] POST /user/${username}/refresh error:`, err.message);
    return res.status(500).json({ success: false, message: 'Refresh failed', error: err.message });
  }
});

/**
 * POST /api/user/refresh
 * Forces a cache refresh for the currently authenticated user.
 * Rate limited implicitly — each refresh = 1 GitHub GraphQL request.
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const updatedUser = await refreshUserCache(req.user._id);
    return res.json({
      success: true,
      message: 'Profile refreshed successfully',
      data: {
        impactScore: updatedUser.impactScore,
        specialtyTag: updatedUser.specialtyTag,
        lastCacheUpdate: updatedUser.lastCacheUpdate,
      },
    });
  } catch (err) {
    console.error('[API] POST /user/refresh error:', err.message);
    return res.status(500).json({ success: false, message: 'Refresh failed', error: err.message });
  }
});

/**
 * GET /api/user
 * Returns a paginated list of all public users sorted by impact score.
 * Powers the global leaderboard view.
 */
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      User.find({ isPublic: true, 'settings.showInLeaderboard': true })
        .sort({ impactScore: -1 })
        .skip(skip)
        .limit(limit)
        .select('username displayName avatarUrl impactScore specialtyTag currentStreak mergedPRCount institution'),
      User.countDocuments({ isPublic: true }),
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/user/settings
 * Updates the authenticated user's preferences.
 */
router.put('/settings', requireAuth, async (req, res) => {
  const { showInLeaderboard, emailNotifications } = req.body;
  
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'settings.showInLeaderboard': showInLeaderboard,
          'settings.emailNotifications': emailNotifications,
        }
      },
      { new: true }
    );
    
    return res.json({ success: true, data: updatedUser.settings });
  } catch (err) {
    console.error('[API] PUT /user/settings error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

module.exports = router;
