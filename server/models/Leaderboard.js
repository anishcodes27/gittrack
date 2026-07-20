const mongoose = require('mongoose');

// ─── Member Snapshot Sub-Schema ────────────────────────────────────────────────
// Stores a lightweight snapshot of user data for fast leaderboard rendering
// without needing to join the full User collection
const MemberSnapshotSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    displayName: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    impactScore: { type: Number, default: 0 },
    specialtyTag: { type: String, default: '' },
    currentStreak: { type: Number, default: 0 },
    mergedPRCount: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    rankDelta: { type: Number, default: 0 }, // +/- vs previous snapshot
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Leaderboard Schema ────────────────────────────────────────────────────────
const LeaderboardSchema = new mongoose.Schema(
  {
    // --- Institutional Identity ---
    institutionName: { type: String, required: true, trim: true },
    institutionSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[a-z0-9-]+$/,
    },
    description: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    website: { type: String, default: '' },
    country: { type: String, default: '' },
    type: {
      type: String,
      enum: ['university', 'company', 'bootcamp', 'community', 'other'],
      default: 'university',
    },

    // --- Membership ---
    members: [MemberSnapshotSchema],
    memberCount: { type: Number, default: 0 },
    maxMembers: { type: Number, default: 500 },

    // --- Aggregate Stats ---
    totalImpactScore: { type: Number, default: 0 },
    avgImpactScore: { type: Number, default: 0 },
    topContributor: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String },
      impactScore: { type: Number },
    },

    // --- Admin ---
    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
    requiresApproval: { type: Boolean, default: false },
    inviteCode: { type: String, default: null },

    // --- Cache ---
    lastUpdated: { type: Date, default: Date.now },
    snapshotHistory: [
      {
        capturedAt: Date,
        avgScore: Number,
        topUsername: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: 'leaderboards',
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
LeaderboardSchema.index({ institutionSlug: 1 }, { unique: true });
LeaderboardSchema.index({ avgImpactScore: -1 });
LeaderboardSchema.index({ isPublic: 1 });

// ─── Pre-save: Recompute aggregate stats ───────────────────────────────────────
LeaderboardSchema.pre('save', function (next) {
  if (this.members && this.members.length > 0) {
    this.memberCount = this.members.length;
    this.totalImpactScore = this.members.reduce((sum, m) => sum + m.impactScore, 0);
    this.avgImpactScore = Math.round(this.totalImpactScore / this.memberCount);

    // Find top contributor
    const top = [...this.members].sort((a, b) => b.impactScore - a.impactScore)[0];
    if (top) {
      this.topContributor = {
        userId: top.userId,
        username: top.username,
        impactScore: top.impactScore,
      };
    }
  }
  next();
});

// ─── Method: refreshMemberRanks ────────────────────────────────────────────────
LeaderboardSchema.methods.refreshMemberRanks = function () {
  this.members.sort((a, b) => b.impactScore - a.impactScore);
  this.members.forEach((member, index) => {
    const previousRank = member.rank;
    member.rank = index + 1;
    member.rankDelta = previousRank ? previousRank - member.rank : 0;
  });
};

const Leaderboard = mongoose.model('Leaderboard', LeaderboardSchema);
module.exports = Leaderboard;
