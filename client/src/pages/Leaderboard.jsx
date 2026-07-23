import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useLeaderboard from '../hooks/useLeaderboard';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import TopBar from '../components/layout/TopBar';
import { ChartSkeleton } from '../components/dashboard/SkeletonLoader';
import client from '../api/client';
import './Leaderboard.css';

const InstitutionCard = ({ board, isSelected, onClick }) => (
  <button
    className={`inst-card ${isSelected ? 'inst-card--selected' : ''}`}
    onClick={onClick}
  >
    <div className="inst-card-name">{board.institutionName}</div>
    <div className="inst-card-meta">
      <span>{board.memberCount} members</span>
      <span className="inst-card-score">Avg: {board.avgImpactScore}</span>
    </div>
  </button>
);

// Login prompt modal shown when an unauthenticated visitor tries to create/join
const LoginPromptModal = ({ onClose, onLogin }) => (
  <div
    className="modal-overlay"
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}
    onClick={onClose}
  >
    <div
      className="card"
      style={{ width: 380, padding: 32, textAlign: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
      <h3 style={{ marginBottom: 8, fontSize: '1.1rem' }}>Login Required</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.6 }}>
        You need to be logged in with GitHub to create or join an institution leaderboard.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={onLogin}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Login with GitHub
        </button>
      </div>
    </div>
  </div>
);

const Leaderboard = ({ onToggleSidebar }) => {
  const { isAuthenticated, login } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt]  = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstSlug, setNewInstSlug] = useState('');
  const [isCreating, setIsCreating]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [refreshKey, setRefreshKey]   = useState(0);

  // Check for pending join after OAuth redirect
  useEffect(() => {
    if (isAuthenticated) {
      const pendingJoin = sessionStorage.getItem('pendingJoinInstitutionSlug');
      if (pendingJoin) {
        sessionStorage.removeItem('pendingJoinInstitutionSlug');
        const processPendingJoin = async () => {
          try {
            await client.post('/leaderboard/join', { institutionSlug: pendingJoin });
            setRefreshKey(old => old + 1);
            setSelectedSlug(pendingJoin);
          } catch (err) {
            console.error('Failed to process pending join:', err);
          }
        };
        processPendingJoin();
      }
    }
  }, [isAuthenticated]);

  const { boards, isLoading: boardsLoading } = useLeaderboard(null, false, refreshKey);
  const { data, isLoading: membersLoading }  = useLeaderboard(selectedSlug, false);

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setErrorMsg('');
    try {
      await client.post('/leaderboard', {
        institutionName: newInstName,
        institutionSlug: newInstSlug,
      });
      setShowCreateModal(false);
      setNewInstName('');
      setNewInstSlug('');
      setRefreshKey((old) => old + 1);
      setSelectedSlug(newInstSlug);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create institution');
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewInstName(val);
    setNewInstSlug(
      val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    );
  };

  return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content">
        <div className="lb-page-layout">
          {/* Institution list sidebar */}
          <aside className="lb-sidebar animate-fade-in-left">
            <div className="lb-sidebar-header">
              <h3 className="lb-sidebar-title">Institutions</h3>
              <span className="badge badge-primary">{boards?.length || 0}</span>
            </div>

            {boardsLoading ? (
              <div className="lb-sidebar-loading">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="inst-card-skeleton skeleton"
                    style={{ height: 64, borderRadius: 8, marginBottom: 8 }}
                  />
                ))}
              </div>
            ) : (
              <div className="lb-inst-list">
                {boards?.map((board) => (
                  <InstitutionCard
                    key={board.institutionSlug}
                    board={board}
                    isSelected={selectedSlug === board.institutionSlug}
                    onClick={() => setSelectedSlug(board.institutionSlug)}
                  />
                ))}
              </div>
            )}

            <button className="btn btn-success lb-create-btn" onClick={handleCreateClick}>
              + Create Institution
            </button>
          </aside>

          {/* Leaderboard table */}
          <div className="lb-main">
            {!selectedSlug ? (
              <div className="lb-empty-state card">
                <div className="lb-empty-icon">🏆</div>
                <h3>Select an institution</h3>
                <p>Choose an institution from the sidebar to view its leaderboard.</p>
              </div>
            ) : membersLoading ? (
              <ChartSkeleton height={400} />
            ) : data ? (
              <LeaderboardTable
                members={data.members}
                institutionName={data.institutionName}
                institutionSlug={data.institutionSlug}
                refreshKey={refreshKey}
                setRefreshKey={setRefreshKey}
                onRequireLogin={() => {
                  sessionStorage.setItem('pendingJoinInstitutionSlug', data.institutionSlug);
                  setShowLoginPrompt(true);
                }}
              />
            ) : null}
          </div>
        </div>
      </main>

      {/* Login prompt for unauthenticated visitors */}
      {showLoginPrompt && (
        <LoginPromptModal
          onClose={() => setShowLoginPrompt(false)}
          onLogin={login}
        />
      )}

      {/* Create Institution modal (authenticated only) */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          }}
        >
          <div className="card" style={{ width: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Create New Institution</h3>
            {errorMsg && (
              <p style={{ color: 'var(--accent-danger)', marginBottom: 12, fontSize: '0.9rem' }}>
                {errorMsg}
              </p>
            )}
            <form onSubmit={handleCreateInstitution}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Institution Name
                </label>
                <input
                  type="text"
                  value={newInstName}
                  onChange={handleNameChange}
                  required
                  placeholder="e.g. Stanford University"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)', color: 'white' }}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Institution Slug (URL)
                </label>
                <input
                  type="text"
                  value={newInstSlug}
                  onChange={(e) => setNewInstSlug(e.target.value)}
                  required
                  placeholder="e.g. stanford-university"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--bg-canvas)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
