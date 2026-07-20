import { useState } from 'react';
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

const Leaderboard = () => {
  const { isDemoMode } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState(isDemoMode ? 'iit-kgp' : null);
  const [showModal, setShowModal] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstSlug, setNewInstSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // We use key to force re-fetch when new board is created
  const [refreshKey, setRefreshKey] = useState(0);

  const { boards, isLoading: boardsLoading } = useLeaderboard(null, isDemoMode, refreshKey);
  const { data, isLoading: membersLoading } = useLeaderboard(selectedSlug, isDemoMode);

  const handleCreateInstitution = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setErrorMsg("Cannot create institution in Demo Mode.");
      return;
    }
    setIsCreating(true);
    setErrorMsg('');
    try {
      await client.post('/leaderboard', {
        institutionName: newInstName,
        institutionSlug: newInstSlug,
      });
      setShowModal(false);
      setNewInstName('');
      setNewInstSlug('');
      setRefreshKey(old => old + 1); // Refresh the list
      setSelectedSlug(newInstSlug); // Auto-select the newly created board
    } catch (err) {
      setErrorMsg(err.message || "Failed to create institution");
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewInstName(val);
    setNewInstSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  return (
    <div className="main-area">
      <TopBar />
      <main className="page-content">
        <div className="lb-page-layout">
          {/* Sidebar: institution list */}
          <aside className="lb-sidebar animate-fade-in-left">
            <div className="lb-sidebar-header">
              <h3 className="lb-sidebar-title">Institutions</h3>
              <span className="badge badge-primary">{boards?.length || 0}</span>
            </div>

            {boardsLoading ? (
              <div className="lb-sidebar-loading">
                {[0,1,2].map(i => (
                  <div key={i} className="inst-card-skeleton skeleton" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />
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

            <button className="btn btn-success lb-create-btn" onClick={() => setShowModal(true)}>
              + Create Institution
            </button>
          </aside>

          {/* Main: leaderboard table */}
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
              />
            ) : null}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Create New Institution</h3>
            {errorMsg && <p style={{ color: 'var(--accent-danger)', marginBottom: 12, fontSize: '0.9rem' }}>{errorMsg}</p>}
            
            <form onSubmit={handleCreateInstitution}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Institution Name</label>
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
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Institution Slug (URL)</label>
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
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
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
