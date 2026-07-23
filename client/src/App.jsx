import { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import ParticlesBackground from './components/layout/ParticlesBackground';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Compare from './pages/Compare';
import Repositories from './pages/Repositories';

// ─── ProtectedRoute — redirects to / if not authenticated ─────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

// ─── GitHub icon SVG (inline, matches existing style) ─────────────────────────
const GitHubIcon = ({ size = 16, color = '#94A3B8' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

// ─── Landing / Login page ─────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?user=${searchQuery.trim()}`);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-background" />

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <img src="/logo.png" alt="GitTrack" />
          <span className="landing-nav-wordmark">GitTrack</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-hero-primary"
            style={{ padding: '10px 24px', fontSize: '0.875rem' }}
            onClick={login}
          >
            <GitHubIcon size={18} color="#fff" />
            Login with GitHub
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="dot" />
          Open Source Contribution Intelligence
        </div>

        <h1 className="landing-big-title">
          Your GitHub,<br />
          <span className="gradient-word">Scored &amp; Proven.</span>
        </h1>

        <p className="landing-subtitle">
          GitTrack goes beyond green squares. We analyze your merged pull requests,
          collaboration patterns, and coding consistency to generate a real Impact Score
          that recruiters can actually trust.
        </p>

        {/* Hero Search Bar */}
        <form className="landing-hero-search" onSubmit={handleHeroSearch}>
          <div className="landing-search-inner">
            <GitHubIcon size={17} color="#94A3B8" />
            <svg
              className="landing-search-divider-icon"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="#64748B" strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="landing-search-input"
              placeholder="Search any GitHub username…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <button
              type="submit"
              className="landing-search-btn"
              disabled={!searchQuery.trim()}
            >
              Analyze
            </button>
          </div>
        </form>

        <div className="landing-hero-actions">
          <button className="btn-hero-primary" onClick={login}>
            <GitHubIcon size={22} color="#fff" />
            Get Your Score Free
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="landing-stats">
        <div className="landing-stat">
          <div className="landing-stat-value">10×</div>
          <div className="landing-stat-label">Weight for External PRs</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">100</div>
          <div className="landing-stat-label">Point Impact Score</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">6h</div>
          <div className="landing-stat-label">Auto-refresh cycle</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-value">AI</div>
          <div className="landing-stat-label">Specialty Tag Engine</div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="landing-features">
        <div className="feature-card">
          <div className="feature-icon feature-icon--green">🏆</div>
          <div className="feature-title">Impact Score</div>
          <p className="feature-desc">
            A weighted 0–100 score that prioritises merged External PRs (×10 multiplier)
            over personal repositories, solving the &quot;green square problem&quot; once and for all.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon--blue">🔍</div>
          <div className="feature-title">Recruiter Search</div>
          <p className="feature-desc">
            Recruiters can look up any candidate by GitHub username and instantly view their
            full analytics dashboard. No login required from the candidate.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon--purple">🎯</div>
          <div className="feature-title">AI Specialty Tags</div>
          <p className="feature-desc">
            Our tag engine analyses thousands of lines of code across your repos to label you
            precisely: &quot;Strong Frontend Dev&quot;, &quot;Rust Systems Engineer&quot;, and more.
          </p>
        </div>
      </div>

      <footer className="landing-footer">
        Built with ❤️ for open source developers · GitTrack &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

// ─── Shell layout — always wraps non-landing routes ──────────────────────────
// Sidebar is shown unconditionally so unauthenticated visitors still get nav.
const AppShell = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const childrenWithProps = typeof children === 'function'
    ? children(() => setIsMobileSidebarOpen((p) => !p))
    : children;

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      {childrenWithProps}
    </div>
  );
};

// ─── App routing ──────────────────────────────────────────────────────────────
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLoading) return null;

  // Landing page has its own nav — no shell
  if (isLanding) {
    return (
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
      </Routes>
    );
  }

  // Every other route always gets the shell (sidebar + topbar)
  return (
    <AppShell>
      {(onToggleSidebar) => (
        <Routes>
          {/* Public routes */}
          <Route path="/dashboard"    element={<Dashboard    onToggleSidebar={onToggleSidebar} />} />
          <Route path="/leaderboard"  element={<Leaderboard  onToggleSidebar={onToggleSidebar} />} />
          <Route path="/compare"      element={<Compare      onToggleSidebar={onToggleSidebar} />} />
          <Route path="/repositories" element={<Repositories onToggleSidebar={onToggleSidebar} />} />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile onToggleSidebar={onToggleSidebar} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings onToggleSidebar={onToggleSidebar} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AppShell>
  );
};

const App = () => (
  <Router>
    <ParticlesBackground />
    <AppContent />
  </Router>
);

export default App;
