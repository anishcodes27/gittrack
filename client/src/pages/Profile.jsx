import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useUserData from '../hooks/useUserData';
import TopBar from '../components/layout/TopBar';
import ProfileHeader from '../components/dashboard/ProfileHeader';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import LanguageRadar from '../components/dashboard/LanguageRadar';
import GrowthSparkline from '../components/dashboard/GrowthSparkline';
import SkeletonLoader from '../components/dashboard/SkeletonLoader';
import client from '../api/client';
import { formatNumber, formatDate } from '../utils/formatters';
import './Profile.css';

// ─── PR Filter Tabs ───────────────────────────────────────────────────────────
const FILTERS = ['All', 'External', 'Personal'];

// ─── Single PR Row ────────────────────────────────────────────────────────────
const PRRow = ({ pr }) => (
  <a
    href={pr.url || '#'}
    target="_blank"
    rel="noopener noreferrer"
    className="pr-row"
  >
    <div className="pr-row-left">
      <span className={`pr-type-badge ${pr.isExternal ? 'pr-type-badge--ext' : 'pr-type-badge--own'}`}>
        {pr.isExternal ? 'External' : 'Personal'}
      </span>
      <div>
        <p className="pr-row-title">{pr.title}</p>
        <p className="pr-row-repo">
          {pr.repoOwner}/{pr.repoName}
          {pr.repoStars > 100 && (
            <span className="pr-row-stars">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--accent-warning)" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {formatNumber(pr.repoStars)}
            </span>
          )}
        </p>
      </div>
    </div>
    <div className="pr-row-right">
      {pr.additions !== undefined && (
        <span className="pr-diff">
          <span className="pr-diff-add">+{pr.additions}</span>
          <span className="pr-diff-del">-{pr.deletions}</span>
        </span>
      )}
      <span className="pr-row-date">{pr.mergedAt ? formatDate(pr.mergedAt) : '—'}</span>
      <svg className="pr-row-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 17L17 7M17 7H7M17 7v10" />
      </svg>
    </div>
  </a>
);

// ─── Score Breakdown ──────────────────────────────────────────────────────────
const ScoreBreakdownPanel = ({ breakdown, impactScore }) => {
  if (!breakdown) return null;
  const items = [
    { label: 'External PR Score', value: breakdown.externalPRScore, color: 'var(--accent-success)', icon: '🔀' },
    { label: 'Personal PR Score', value: breakdown.personalPRScore, color: 'var(--accent-primary)', icon: '📦' },
    { label: 'Commit Score',      value: breakdown.commitScore,     color: 'var(--accent-purple)',  icon: '💾' },
    { label: 'Star Bonus',        value: breakdown.starMultiplierBonus, color: 'var(--accent-warning)', icon: '⭐' },
  ];
  const total = breakdown.rawTotal || 1;

  return (
    <div className="card profile-score-panel">
      <div className="card-header">
        <span className="card-title">Score Breakdown</span>
        <div className="score-display" style={{ gap: 2 }}>
          <span className="score-number" style={{ fontSize: '2rem' }}>{impactScore}</span>
          <span className="score-max">/100</span>
        </div>
      </div>
      <div className="breakdown-list">
        {items.map((item) => (
          <div key={item.label} className="breakdown-row">
            <span className="breakdown-icon">{item.icon}</span>
            <div className="breakdown-details">
              <div className="breakdown-header-row">
                <span className="breakdown-label">{item.label}</span>
                <span className="breakdown-pts" style={{ color: item.color }}>{item.value} pts</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (item.value / total) * 100)}%`,
                    background: item.color,
                    boxShadow: `0 0 6px ${item.color}50`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="breakdown-total-row">
          <span>Raw total</span>
          <span className="breakdown-total-val">{total}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Stats Grid ───────────────────────────────────────────────────────────────
const StatBox = ({ label, value, sub, color = 'var(--text-primary)' }) => (
  <div className="stat-box card">
    <div className="stat-box-value" style={{ color }}>{value}</div>
    <div className="stat-box-label">{label}</div>
    {sub && <div className="stat-box-sub">{sub}</div>}
  </div>
);

// ─── Main Profile Page ────────────────────────────────────────────────────────
const Profile = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const username = user?.username;
  const { data, isLoading, error } = useUserData(username, false);

  const [prFilter, setPrFilter] = useState('All');
  const [prSearch, setPrSearch]  = useState('');

  // Fetch commit-based calendar for the heatmap (separate from PR-derived contributionHeatmap)
  const [commitHeatmap, setCommitHeatmap] = useState(null);
  useEffect(() => {
    if (!username) return;
    client.get(`/user/${username}/commit-calendar`)
      .then((res) => { if (res?.heatmap) setCommitHeatmap(res.heatmap); })
      .catch(() => { /* silently fall back to PR heatmap */ });
  }, [username]);

  // Build a data object that swaps the heatmap source
  const profileData = commitHeatmap
    ? { ...data, contributionHeatmap: commitHeatmap }
    : data;

  if (isLoading) return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content"><SkeletonLoader /></main>
    </div>
  );

  if (error || !data) return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--accent-danger)' }}>⚠️ {error || 'No data found.'}</p>
        </div>
      </main>
    </div>
  );

  // Filter PRs
  const allPRs = profileData?.recentMergedPRs || [];
  const filteredPRs = allPRs
    .filter(pr => {
      if (prFilter === 'External') return pr.isExternal;
      if (prFilter === 'Personal') return !pr.isExternal;
      return true;
    })
    .filter(pr =>
      prSearch === '' ||
      pr.title?.toLowerCase().includes(prSearch.toLowerCase()) ||
      pr.repoName?.toLowerCase().includes(prSearch.toLowerCase())
    );

  return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content profile-page">

        {/* Profile Header */}
        <ProfileHeader data={profileData} />

        {/* Stats Row */}
        <div className="profile-stats-grid">
          <StatBox label="Impact Score" value={`${profileData?.impactScore}/100`} color="var(--accent-success)" sub="Normalized 0–100" />
          <StatBox label="Total Commits" value={formatNumber(profileData?.totalCommits || 0)} color="var(--accent-primary)" sub="Past 12 months" />
          <StatBox label="Merged PRs" value={profileData?.mergedPRCount || 0} color="var(--accent-success)" sub={`${profileData?.externalPRCount || 0} external`} />
          <StatBox label="Current Streak" value={`${profileData?.currentStreak || 0}d`} color="var(--graph-high)" sub={`Best: ${profileData?.longestStreak || 0}d`} />
          <StatBox label="PR Merge Rate" value={`${profileData?.prMergeRate || 0}%`} color="var(--accent-warning)" sub={`${profileData?.openPRCount || 0} still open`} />
          <StatBox label="Code Reviews" value={formatNumber(profileData?.reviewsGiven || 0)} sub="PRs reviewed" />
        </div>

        {/* Charts Row */}
        <div className="profile-charts-row">
          <GrowthSparkline data={profileData} />
          <LanguageRadar data={profileData} />
        </div>

        {/* Activity Heatmap — commit-based data from GitHub */}
        <ActivityHeatmap data={profileData} source="commits" />

        {/* Score + PR List Row */}
        <div className="profile-bottom-row">
          {/* Score Breakdown */}
          <ScoreBreakdownPanel breakdown={data.scoreBreakdown} impactScore={data.impactScore} />

          {/* PR History List */}
          <div className="card profile-pr-list">
            <div className="card-header">
              <span className="card-title">Merged PR History</span>
              <span className="badge badge-success">{allPRs.length} PRs</span>
            </div>

            {/* Filter + Search */}
            <div className="pr-list-controls">
              <div className="pr-filter-tabs">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    className={`pr-filter-tab ${prFilter === f ? 'pr-filter-tab--active' : ''}`}
                    onClick={() => setPrFilter(f)}
                  >
                    {f}
                    <span className="pr-filter-count">
                      {f === 'All' ? allPRs.length
                        : f === 'External' ? allPRs.filter(p => p.isExternal).length
                        : allPRs.filter(p => !p.isExternal).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="pr-search-box">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search PRs…"
                  value={prSearch}
                  onChange={(e) => setPrSearch(e.target.value)}
                />
              </div>
            </div>

            {/* PR rows */}
            <div className="pr-list-rows">
              {filteredPRs.length > 0 ? (
                filteredPRs.map((pr, i) => <PRRow key={i} pr={pr} />)
              ) : (
                <div className="pr-empty">
                  <p>No pull requests match your filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Profile;
