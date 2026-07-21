import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import ParticlesBackground from './components/layout/ParticlesBackground';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();
  
  if (isLoading) return null; // Or a full-page loading spinner
  
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const Login = () => {
  const { login, enterDemoMode } = useAuth();

  return (
    <div className="landing-page">
      {/* Animated gradient background */}
      <div className="landing-background" />

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <img src="/logo.png" alt="GitTrack" />
          <span className="landing-nav-wordmark">GitTrack</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-hero-ghost" style={{ padding: '8px 20px', fontSize: '0.875rem' }} onClick={enterDemoMode}>
            Demo
          </button>
          <button className="btn-hero-primary" style={{ padding: '10px 24px', fontSize: '0.875rem' }} onClick={login}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Login with GitHub
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="dot" />
          Open Source Contribution Intelligence
        </div>

        <h1 className="landing-big-title">
          Your GitHub,<br />
          <span className="gradient-word">Scored & Proven.</span>
        </h1>

        <p className="landing-subtitle">
          GitTrack goes beyond green squares. We analyze your merged pull requests,
          collaboration patterns, and coding consistency to generate a real Impact Score
          that recruiters can actually trust.
        </p>

        <div className="landing-hero-actions">
          <button className="btn-hero-primary" onClick={login}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Get Your Score Free
          </button>
          <button className="btn-hero-ghost" onClick={enterDemoMode}>
            ▶ See Live Demo
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
            A weighted 0-100 score that prioritises merged External PRs (x10 multiplier)
            over personal repositories, solving the "green square problem" once and for all.
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
            precisely: "Strong Frontend Dev", "Rust Systems Engineer", and more.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        Built with ❤️ for open source developers · GitTrack &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated, isDemoMode, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  const showSidebar = isAuthenticated || isDemoMode;
  
  return (
    <div className={showSidebar ? "app-layout" : "login-layout"}>
      {showSidebar && <Sidebar />}
      <Routes>
        <Route path="/" element={(isAuthenticated || isDemoMode) ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <ParticlesBackground />
      <AppContent />
    </Router>
  );
};

export default App;
