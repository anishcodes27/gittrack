const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-accessToken');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email', 'read:org', 'repo'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Upsert user — find by GitHub ID or create new
        let user = await User.findOne({ githubId: profile.id });

        const githubData = {
          githubId: profile.id,
          username: profile.username,
          displayName: profile.displayName || profile.username,
          avatarUrl: profile.photos?.[0]?.value || '',
          profileUrl: profile.profileUrl,
          bio: profile._json?.bio || '',
          publicRepos: profile._json?.public_repos || 0,
          followers: profile._json?.followers || 0,
          following: profile._json?.following || 0,
          accessToken: accessToken,
          lastLogin: new Date(),
        };

        if (user) {
          // Update existing user with fresh OAuth data
          Object.assign(user, githubData);
          await user.save();
          console.log(`[Auth] Returning user logged in: ${user.username}`);
        } else {
          // Create new user — score will be calculated on first data fetch
          user = await User.create({
            ...githubData,
            impactScore: 0,
            lastCacheUpdate: null,
          });
          console.log(`[Auth] New user registered: ${user.username}`);
        }

        return done(null, user);
      } catch (err) {
        console.error('[Auth] Passport strategy error:', err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
