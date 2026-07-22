const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * GET /api/auth/github
 * Initiates the GitHub OAuth flow — redirects to GitHub login page.
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email', 'read:org', 'repo'],
  })
);

/**
 * GET /api/auth/github/callback
 * GitHub redirects here after the user authorizes the app.
 * Handles success redirect to dashboard or failure redirect to login.
 */
router.get(
  '/github/callback',
  (req, res, next) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    passport.authenticate('github', {
      failureRedirect: `${clientUrl}/?error=auth_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
    // Force session write to database store before redirecting client
    req.session.save((err) => {
      if (err) {
        console.error('[Auth] Session save error on OAuth callback:', err);
        return res.redirect(`${clientUrl}/?error=session_save_failed`);
      }
      res.redirect(`${clientUrl}/dashboard`);
    });
  }
);

/**
 * GET /api/auth/me
 * Returns the currently authenticated user from the session.
 * Used by the React frontend to restore auth state on page load.
 */
router.get('/me', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
        profileUrl: req.user.profileUrl,
        bio: req.user.bio,
        institution: req.user.institution,
        impactScore: req.user.impactScore,
        specialtyTag: req.user.specialtyTag,
        currentStreak: req.user.currentStreak,
        lastCacheUpdate: req.user.lastCacheUpdate,
      },
    });
  }

  return res.status(401).json({ success: false, message: 'Not authenticated' });
});

/**
 * POST /api/auth/logout
 * Destroys the session and logs the user out.
 */
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
