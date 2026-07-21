import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useUserData from '../hooks/useUserData';
import ProfileHeader from '../components/dashboard/ProfileHeader';
import StreakCard from '../components/dashboard/StreakCard';
import PRCard from '../components/dashboard/PRCard';
import GrowthSparkline from '../components/dashboard/GrowthSparkline';
import LanguageRadar from '../components/dashboard/LanguageRadar';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import MetricCard from '../components/dashboard/MetricCard';
import TagBadge from '../components/dashboard/TagBadge';
import SkeletonLoader from '../components/dashboard/SkeletonLoader';
import TopBar from '../components/layout/TopBar';
import { formatNumber } from '../utils/formatters';
import './Dashboard.css';

// ─── Recent PRs mini-list ─────────────────────────────────────────────────────
const RecentPRs = ({ prs = [] }) => (
  <div className="card recent-prs-card animate-fade-in delay-400">
    <div className="card-header">
      <span className="card-title">Recent Merged PRs</span>
      <span className="badge badge-success">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        Merged
      </span>
    </div>
    <div className="recent-prs-list">
      {prs.slice(0, 5).map((pr, i) => (
        <a
          key={i}
          href={pr.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="recent-pr-item"
        >
          <div className="recent-pr-info">
            <span className={`recent-pr-dot ${pr.isExternal ? 'external' : 'personal'}`} />
            <span className="recent-pr-title">{pr.title}</span>
          </div>
          <div className="recent-pr-meta">
            <span className="recent-pr-repo">{pr.repoOwner}/{pr.repoName}</span>
            {pr.repoStars > 1000 && (
              <span className="recent-pr-stars">⭐ {formatNumber(pr.repoStars)}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  </div>
);

// ─── Score Breakdown card ─────────────────────────────────────────────────────
const ScoreBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;
  const items = [
    { label: 'External PR Score', value: breakdown.externalPRScore, color: 'var(--accent-success)' },
    { label: 'Personal PR Score', value: breakdown.personalPRScore, color: 'var(--accent-primary)' },
    { label: 'Commit Score',      value: breakdown.commitScore,     color: 'var(--accent-purple)' },
    { label: 'Review Score',      value: breakdown.reviewScore,     color: 'var(--accent-warning)' },
  ];
  const total = breakdown.rawTotal || 1;

  return (
    <div className="card score-breakdown-card animate-fade-in delay-300">
      <div className="card-header">
        <span className="card-title">Score Breakdown</span>
        <span className="badge badge-primary">Raw: {breakdown.rawTotal}</span>
      </div>
      <div className="breakdown-items">
        {items.map((item) => (
          <div key={item.label} className="breakdown-item">
            <div className="breakdown-item-header">
              <span className="breakdown-label">{item.label}</span>
              <span className="breakdown-value" style={{ color: item.color }}>{item.value}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(item.value / total) * 100}%`,
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}40`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};



// ─── Main Dashboard Page ──────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, isAuthenticated, isDemoMode } = useAuth();
  const [isRefreshing, setIsRefreshing]       = useState(false);
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const searchedUser = queryParams.get('user');

  // Priority: 1. Searched user, 2. Logged in user / demo user
  const username = searchedUser || (isDemoMode ? 'anishde12020' : user?.username);
  
  const { data, isLoading, error, lastFetched, refresh } = useUserData(username, isDemoMode && !searchedUser);

  const handleRefresh = async () => {
    if (isDemoMode) return;
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  if (isLoading) return (
    <div className="main-area">
      <TopBar lastUpdated={null} onRefresh={handleRefresh} isRefreshing={false} />
      <main className="page-content"><SkeletonLoader /></main>
    </div>
  );

  if (error) return (
    <div className="main-area">
      <TopBar />
      <main className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: 'var(--accent-danger)', fontSize: '1rem' }}>⚠️ {error}</p>
          <p className="text-secondary" style={{ marginTop: 8 }}>Check your connection or try refreshing.</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="main-area">
      <TopBar
        lastUpdated={data?.lastCacheUpdate || lastFetched}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="page-content dashboard-content">
        {/* Profile Header - full width */}
        <ProfileHeader data={data} />

        {/* Row 1: Metric Cards */}
        <div className="grid-metric-cards dashboard-metric-row">
          <StreakCard data={data} />
          <PRCard data={data} />

          <MetricCard
            title="Growth Index"
            value={`${data?.growthIndex >= 0 ? '+' : ''}${data?.growthIndex || 0}%`}
            accent={data?.growthIndex >= 0 ? 'success' : 'warning'}
            delay={200}
            icon="📈"
            subtitle="vs. previous quarter"
          />

          <MetricCard
            title="AI Dev Tag"
            accent="primary"
            delay={300}
            icon="🎯"
          >
            <div style={{ marginTop: 8 }}>
              <TagBadge tag={data?.specialtyTag} detail={data?.specialtyTagDetail} size="md" />
              <p className="metric-card-subtitle" style={{ marginTop: 8 }}>{data?.specialtyTagDetail}</p>
            </div>
          </MetricCard>
        </div>

        {/* Row 2: Charts */}
        <div className="dashboard-charts-row">
          <GrowthSparkline data={data} />
          <LanguageRadar data={data} />
        </div>

        {/* Row 3: Heatmap (full width) */}
        <ActivityHeatmap data={data} />

        {/* Row 4: Score breakdown + Recent PRs */}
        <div className="dashboard-bottom-row">
          <ScoreBreakdown breakdown={data?.scoreBreakdown} />
          <RecentPRs prs={data?.recentMergedPRs} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
