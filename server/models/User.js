const mongoose = require('mongoose');

// ─── Language Sub-Schema ───────────────────────────────────────────────────────
const LanguageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    percentage: { type: Number, default: 0 },
    linesOfCode: { type: Number, default: 0 },
    color: { type: String, default: '#8b949e' },
  },
  { _id: false }
);

// ─── Monthly Growth Sub-Schema ─────────────────────────────────────────────────
const MonthlyGrowthSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // e.g. "2024-01"
    score: { type: Number, default: 0 },
    commits: { type: Number, default: 0 },
    prs: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─── Heatmap Cell Sub-Schema ───────────────────────────────────────────────────
const HeatmapDaySchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // "YYYY-MM-DD"
    count: { type: Number, default: 0 },
    level: { type: Number, default: 0 }, // 0-4 for color intensity
  },
  { _id: false }
);

// ─── PR Detail Sub-Schema ──────────────────────────────────────────────────────
const PRDetailSchema = new mongoose.Schema(
  {
    title: { type: String },
    url: { type: String },
    repoName: { type: String },
    repoOwner: { type: String },
    repoStars: { type: Number, default: 0 },
    isExternal: { type: Boolean, default: false },
    mergedAt: { type: Date },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    weight: { type: Number, default: 1 },
  },
  { _id: false }
);

// ─── Main User Schema ──────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    // --- GitHub Identity ---
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    profileUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    publicRepos: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },

    // --- OAuth Token (sensitive) ---
    accessToken: { type: String, select: false }, // excluded from default queries

    // --- Institutional Affiliation ---
    institution: { type: String, default: null, index: true },
    institutionVerified: { type: Boolean, default: false },

    // --- Impact Score (Core Feature) ---
    impactScore: { type: Number, default: 0, min: 0, max: 100 },
    scoreBreakdown: {
      externalPRScore: { type: Number, default: 0 },
      personalPRScore: { type: Number, default: 0 },
      commitScore: { type: Number, default: 0 },
      starMultiplierBonus: { type: Number, default: 0 },
      rawTotal: { type: Number, default: 0 },
    },

    // --- Contribution Metrics ---
    totalCommits: { type: Number, default: 0 },
    mergedPRCount: { type: Number, default: 0 },
    externalPRCount: { type: Number, default: 0 },
    personalPRCount: { type: Number, default: 0 },
    openPRCount: { type: Number, default: 0 },
    prMergeRate: { type: Number, default: 0 }, // percentage 0-100
    reviewsGiven: { type: Number, default: 0 },
    issuesOpened: { type: Number, default: 0 },

    // --- Streak Data ---
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastContributionDate: { type: Date, default: null },

    // --- Language Distribution ---
    languages: [LanguageSchema],
    specialtyTag: { type: String, default: 'Polyglot Developer' },
    specialtyTagDetail: { type: String, default: '' },

    // --- Growth Data (12 months) ---
    monthlyGrowth: [MonthlyGrowthSchema],
    growthIndex: { type: Number, default: 0 }, // % change vs previous month

    // --- Heatmap Data (365 days) ---
    contributionHeatmap: [HeatmapDaySchema],

    // --- PR Details (for leaderboard & profile deep-dives) ---
    recentMergedPRs: [PRDetailSchema],

    // --- Cache Management ---
    lastCacheUpdate: { type: Date, default: null },
    cacheVersion: { type: Number, default: 1 },

    // --- App Metadata ---
    lastLogin: { type: Date, default: null },
    isPublic: { type: Boolean, default: true },
    settings: {
      emailNotifications: { type: Boolean, default: false },
      showInLeaderboard: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ['public', 'institution', 'private'], default: 'public' },
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
    collection: 'users',
  }
);

// ─── Compound Indexes ──────────────────────────────────────────────────────────
UserSchema.index({ institution: 1, impactScore: -1 }); // leaderboard queries
UserSchema.index({ impactScore: -1 }); // global ranking
UserSchema.index({ lastCacheUpdate: 1 }); // CRON stale check

// ─── Virtual: isProfileComplete ────────────────────────────────────────────────
UserSchema.virtual('isProfileComplete').get(function () {
  return !!(this.username && this.githubId && this.lastCacheUpdate);
});

// ─── Method: isCacheStale ──────────────────────────────────────────────────────
UserSchema.methods.isCacheStale = function () {
  if (!this.lastCacheUpdate) return true;
  const ttlHours = parseInt(process.env.CACHE_TTL_HOURS) || 6;
  const ttlMs = ttlHours * 60 * 60 * 1000;
  return Date.now() - this.lastCacheUpdate.getTime() > ttlMs;
};

// ─── Static: getLeaderboard ────────────────────────────────────────────────────
UserSchema.statics.getLeaderboard = function (institution, limit = 50) {
  const query = institution ? { institution, 'settings.showInLeaderboard': true } : { 'settings.showInLeaderboard': true };
  return this.find(query)
    .sort({ impactScore: -1 })
    .limit(limit)
    .select('username displayName avatarUrl impactScore specialtyTag currentStreak mergedPRCount institution');
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
