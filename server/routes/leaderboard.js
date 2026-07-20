const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ success: false, message: 'Authentication required' });
};

/**
 * GET /api/leaderboard
 * Returns a list of all public leaderboards (institutions).
 */
router.get('/', async (req, res) => {
  try {
    const boards = await Leaderboard.find({ isPublic: true })
      .sort({ avgImpactScore: -1 })
      .select('institutionName institutionSlug description logoUrl type memberCount avgImpactScore topContributor lastUpdated');

    return res.json({ success: true, data: boards });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/leaderboard/:slug
 * Returns ranked members for a specific institution leaderboard.
 */
router.get('/:slug', async (req, res) => {
  try {
    const board = await Leaderboard.findOne({ institutionSlug: req.params.slug });

    if (!board) {
      return res.status(404).json({ success: false, message: `Leaderboard "${req.params.slug}" not found` });
    }

    // Sort members by score descending
    const sortedMembers = [...board.members].sort((a, b) => b.impactScore - a.impactScore);

    return res.json({
      success: true,
      data: {
        institutionName: board.institutionName,
        institutionSlug: board.institutionSlug,
        description: board.description,
        logoUrl: board.logoUrl,
        type: board.type,
        memberCount: board.memberCount,
        avgImpactScore: board.avgImpactScore,
        topContributor: board.topContributor,
        lastUpdated: board.lastUpdated,
        members: sortedMembers,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/leaderboard
 * Creates a new institution leaderboard. Requires authentication.
 */
router.post('/', requireAuth, async (req, res) => {
  const { institutionName, institutionSlug, description, type, website, country } = req.body;

  if (!institutionName || !institutionSlug) {
    return res.status(400).json({ success: false, message: 'institutionName and institutionSlug are required' });
  }

  try {
    const existing = await Leaderboard.findOne({ institutionSlug: institutionSlug.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A leaderboard with this slug already exists' });
    }

    const board = await Leaderboard.create({
      institutionName,
      institutionSlug: institutionSlug.toLowerCase(),
      description: description || '',
      type: type || 'university',
      website: website || '',
      country: country || '',
      adminUserId: req.user._id,
    });

    return res.status(201).json({ success: true, data: board });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/leaderboard/join
 * Authenticated user joins an institution leaderboard.
 */
router.post('/join', requireAuth, async (req, res) => {
  const { institutionSlug, inviteCode } = req.body;

  if (!institutionSlug) {
    return res.status(400).json({ success: false, message: 'institutionSlug is required' });
  }

  try {
    const board = await Leaderboard.findOne({ institutionSlug: institutionSlug.toLowerCase() });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Leaderboard not found' });
    }

    // Check invite code if required
    if (board.requiresApproval && board.inviteCode && board.inviteCode !== inviteCode) {
      return res.status(403).json({ success: false, message: 'Invalid invite code' });
    }

    // Check if already a member
    const isMember = board.members.some((m) => m.userId.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(409).json({ success: false, message: 'Already a member of this leaderboard' });
    }

    // Add member snapshot
    board.members.push({
      userId: req.user._id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      impactScore: req.user.impactScore,
      specialtyTag: req.user.specialtyTag,
      currentStreak: req.user.currentStreak,
      mergedPRCount: req.user.mergedPRCount,
    });

    board.refreshMemberRanks();
    await board.save();

    // Update the User's institution field
    await User.findByIdAndUpdate(req.user._id, { institution: board.institutionName });

    return res.json({ success: true, message: `Joined ${board.institutionName} leaderboard`, data: board });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/leaderboard/leave
 * Authenticated user leaves their current institution leaderboard.
 */
router.delete('/leave', requireAuth, async (req, res) => {
  const { institutionSlug } = req.body;

  try {
    const board = await Leaderboard.findOne({ institutionSlug });
    if (!board) return res.status(404).json({ success: false, message: 'Leaderboard not found' });

    board.members = board.members.filter((m) => m.userId.toString() !== req.user._id.toString());
    board.refreshMemberRanks();
    await board.save();

    await User.findByIdAndUpdate(req.user._id, { institution: null });

    return res.json({ success: true, message: 'Left the leaderboard' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
