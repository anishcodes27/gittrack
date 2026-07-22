import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Your contribution analytics at a glance' },
  '/leaderboard': { title: 'Leaderboard', subtitle: 'Institution rankings by Impact Score' },
  '/profile': { title: 'My Profile', subtitle: 'Detailed contribution history' },
  '/settings': { title: 'Settings', subtitle: 'Account & preferences' },
};

const TopBar = ({ lastUpdated, onRefresh, isRefreshing, onToggleSidebar }) => {
  const location  = useLocation();
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();
  const page = PAGE_TITLES[location.pathname] || { title: 'GitTrack', subtitle: '' };

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?user=${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="topbar">
      {/* Left: Hamburger & Page Title */}
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onToggleSidebar} aria-label="Toggle navigation menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="topbar-title">{page.title}</h1>
        <p className="topbar-subtitle">{page.subtitle}</p>
      </div>

      {/* Center: Recruiter Search - always visible */}
      <form onSubmit={handleSearch} className={`topbar-search ${isFocused ? 'topbar-search--focused' : ''}`}>
        <div className="topbar-search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search any GitHub username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <button type="submit" className="topbar-search-btn" disabled={!searchQuery.trim()}>
          Analyze
        </button>
      </form>

      {/* Right: Actions */}
      <div className="topbar-right">
        {isDemoMode && (
          <div className="topbar-demo-badge">
            <span className="demo-dot" />
            Demo Mode
          </div>
        )}

        {lastUpdated && (
          <span className="topbar-last-updated">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}

        <button
          className={`btn btn-ghost topbar-refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh data from GitHub"
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            className={isRefreshing ? 'animate-spin-slow' : ''}
          >
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
};

export default TopBar;

