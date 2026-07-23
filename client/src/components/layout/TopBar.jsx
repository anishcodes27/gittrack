import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

const PAGE_TITLES = {
  '/dashboard':    { title: 'Dashboard',     subtitle: 'Your contribution analytics at a glance' },
  '/leaderboard':  { title: 'Leaderboard',   subtitle: 'Institution rankings by Impact Score' },
  '/repositories': { title: 'Repositories',  subtitle: 'Browse and explore public repositories' },
  '/compare':      { title: 'Compare',       subtitle: 'Side-by-side developer comparison' },
  '/profile':      { title: 'My Profile',    subtitle: 'Detailed contribution history' },
  '/settings':     { title: 'Settings',      subtitle: 'Account & preferences' },
};

const TopBar = ({ lastUpdated, onRefresh, isRefreshing, onToggleSidebar }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { isAuthenticated } = useAuth();
  const page = PAGE_TITLES[location.pathname] || { title: 'GitTrack', subtitle: '' };

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused]     = useState(false);

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
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="topbar-title">{page.title}</h1>
        <p className="topbar-subtitle">{page.subtitle}</p>
      </div>

      {/* Center: Search — GitHub icon + magnifying glass + input */}
      <form
        onSubmit={handleSearch}
        className={`topbar-search ${isFocused ? 'topbar-search--focused' : ''}`}
      >
        {/* GitHub icon — muted, left-most */}
        <span className="topbar-search-gh-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#94A3B8">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </span>

        <div className="topbar-search-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
        {lastUpdated && (
          <span className="topbar-last-updated">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}

        {onRefresh && isAuthenticated && (
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
        )}
      </div>
    </header>
  );
};

export default TopBar;
