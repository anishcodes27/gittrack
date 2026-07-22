import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/layout/TopBar';
import client from '../api/client';

const Settings = ({ onToggleSidebar }) => {
  const { user, isDemoMode } = useAuth();
  
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'success' | 'error' | ''

  // Initialize from user context if available
  useEffect(() => {
    if (user?.settings) {
      setShowInLeaderboard(user.settings.showInLeaderboard ?? true);
      setEmailNotifications(user.settings.emailNotifications ?? false);
    }
  }, [user]);

  const handleSave = async () => {
    if (isDemoMode) {
      alert("Preferences cannot be saved in Demo Mode.");
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('');
    try {
      await client.put('/user/settings', {
        showInLeaderboard,
        emailNotifications
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content">
        <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Settings</span>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {saveStatus === 'success' && (
            <div style={{ padding: '10px 16px', background: 'rgba(46, 164, 79, 0.15)', color: 'var(--accent-success)', borderRadius: 6, marginBottom: 20, border: '1px solid var(--accent-success)' }}>
              Preferences saved successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div style={{ padding: '10px 16px', background: 'rgba(248, 81, 73, 0.15)', color: 'var(--accent-danger)', borderRadius: 6, marginBottom: 20, border: '1px solid var(--accent-danger)' }}>
              Failed to save preferences.
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Account Information</h3>
            <div style={{ padding: 16, background: 'var(--bg-overlay)', borderRadius: 8 }}>
              <p className="text-secondary">Connected GitHub Account:</p>
              <p className="font-semibold">{isDemoMode ? 'anishde12020' : user?.username}</p>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Preferences</h3>
            <div style={{ padding: 16, background: 'var(--bg-overlay)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showInLeaderboard}
                  onChange={(e) => setShowInLeaderboard(e.target.checked)}
                />
                <span>Show profile on public leaderboards</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span>Receive email notifications for weekly summaries</span>
              </label>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>Danger Zone</h3>
            <div style={{ padding: 16, border: '1px solid var(--accent-danger)', borderRadius: 8 }}>
              <p className="text-secondary" style={{ marginBottom: 12 }}>Permanently delete your GitTrack profile and disconnect GitHub.</p>
              <button 
                className="btn" 
                style={{ background: 'var(--accent-danger)', color: 'white' }}
                onClick={() => {
                  if (isDemoMode) alert("Cannot delete account in demo mode.");
                  else alert("Are you absolutely sure? This action cannot be undone.");
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
