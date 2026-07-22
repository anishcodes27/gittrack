const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.SESSION_SECRET || 'gittrack_dev_secret_change_in_prod';

/**
 * GET /api/auth/github
 * Initiates the GitHub OAuth flow — redirects to GitHub login page.
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email', 'read:org', 'repo'],
    prompt: 'consent',
  })
);

/**
 * GET /api/auth/github/callback
 * GitHub redirects here after the user authorizes the app.
 */
router.get(
  '/github/callback',
  (req, res, next) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    passport.authenticate('github', {
      session: false,
      failureRedirect: `${clientUrl}/?error=auth_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, username: req.user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${clientUrl}/?token=${token}`);
  }
);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the JWT.
 */
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-accessToken');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        profileUrl: user.profileUrl,
        bio: user.bio,
        institution: user.institution,
        impactScore: user.impactScore,
        specialtyTag: user.specialtyTag,
        currentStreak: user.currentStreak,
        lastCacheUpdate: user.lastCacheUpdate,
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

/**
 * POST /api/auth/logout
 * Destroys the session and logs the user out.
 */
router.post('/logout', (req, res) => {
  // For JWT, logout is handled by the client dropping the token.
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
