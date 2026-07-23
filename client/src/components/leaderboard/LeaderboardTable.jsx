import { useState } from 'react';
import { formatDate } from '../../utils/formatters';
import TagBadge from '../dashboard/TagBadge';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './LeaderboardTable.css';

const RankMedal = ({ rank }) => {
  if (rank === 1) return <span className="rank-medal rank-medal--gold">🥇</span>;
  if (rank === 2) return <span className="rank-medal rank-medal--silver">🥈</span>;
  if (rank === 3) return <span className="rank-medal rank-medal--bronze">🥉</span>;
  return <span className="rank-number">#{rank}</span>;
};

const DeltaBadge = ({ delta }) => {
  if (!delta) return <span className="delta-neutral">—</span>;
  const isUp = delta > 0;
  return (
    <span className={`delta-badge ${isUp ? 'delta-up' : 'delta-down'}`}>
      {isUp ? '↑' : '↓'} {Math.abs(delta)}
    </span>
  );
};

const ScoreBar = ({ score }) => (
  <div className="lb-score-bar-wrapper">
    <div className="lb-score-bar-track">
      <div className="lb-score-bar-fill" style={{ width: `${score}%` }} />
    </div>
    <span className="lb-score-number">{score}</span>
  </div>
);

const LeaderboardTable = ({ members = [], institutionName, institutionSlug, refreshKey, setRefreshKey, onRequireLogin }) => {
  const { user, isAuthenticated } = useAuth();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setIsJoining(true);
    try {
      await client.post('/leaderboard/join', { institutionSlug });
      setRefreshKey(old => old + 1);
    } catch (err) {
      alert(err.message || 'Failed to join');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this leaderboard?')) return;
    setIsJoining(true); // repurpose loading state
    try {
      await client.delete('/leaderboard/leave', { data: { institutionSlug } });
      setRefreshKey(old => old + 1);
    } catch (err) {
      alert(err.message || 'Failed to leave');
    } finally {
      setIsJoining(false);
    }
  };

  const isMember = members.some(m => m.username === user?.username);

  return (
    <div className="card lb-table-card animate-fade-in">
      {institutionName && (
        <div className="lb-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="lb-table-title">{institutionName}</h2>
            <span className="lb-member-count">{members.length} members</span>
          </div>
          <div>
            {isMember ? (
              <button className="btn btn-ghost" onClick={handleLeave} disabled={isJoining} style={{ padding: '6px 16px', fontSize: '0.85rem', color: 'var(--accent-danger)' }}>
                {isJoining ? 'Leaving...' : 'Leave Institution'}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleJoin} disabled={isJoining} style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                {isJoining ? 'Joining...' : 'Join Institution'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="lb-table-wrapper">
        <table className="lb-table">
          <thead>
            <tr className="lb-thead-row">
              <th className="lb-th lb-th-rank">Rank</th>
              <th className="lb-th lb-th-user">Contributor</th>
              <th className="lb-th lb-th-tag">Specialty</th>
              <th className="lb-th lb-th-streak">Streak</th>
              <th className="lb-th lb-th-prs">Ext. PRs</th>
              <th className="lb-th lb-th-score">Impact Score</th>
              <th className="lb-th lb-th-delta">Δ</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member, i) => (
              <tr
                key={member.username}
                className={`lb-row ${i < 3 ? `lb-row--top${i + 1}` : ''}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Rank */}
                <td className="lb-td lb-td-rank">
                  <RankMedal rank={member.rank || i + 1} />
                </td>

                {/* User */}
                <td className="lb-td lb-td-user">
                  <div className="lb-user-cell">
                    <img
                      src={member.avatarUrl}
                      alt={member.username}
                      className="lb-avatar"
                      width={36}
                      height={36}
                      onError={(e) => { e.target.src = `https://avatars.githubusercontent.com/u/${i * 1000}?v=4`; }}
                    />
                    <div>
                      <p className="lb-username">
                        <a href={`https://github.com/${member.username}`} target="_blank" rel="noopener noreferrer">
                          {member.displayName || member.username}
                        </a>
                      </p>
                      <p className="lb-handle">@{member.username}</p>
                    </div>
                  </div>
                </td>

                {/* Tag */}
                <td className="lb-td lb-td-tag">
                  {member.specialtyTag && (
                    <TagBadge tag={member.specialtyTag} size="sm" />
                  )}
                </td>

                {/* Streak */}
                <td className="lb-td lb-td-streak">
                  <span className="lb-streak">
                    🔥 {member.currentStreak || 0}d
                  </span>
                </td>

                {/* External PRs */}
                <td className="lb-td lb-td-prs">
                  <span className="lb-prs">{member.mergedPRCount || 0}</span>
                </td>

                {/* Score bar */}
                <td className="lb-td lb-td-score">
                  <ScoreBar score={member.impactScore || 0} />
                </td>

                {/* Delta */}
                <td className="lb-td lb-td-delta">
                  <DeltaBadge delta={member.rankDelta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {members.length === 0 && (
          <div className="lb-empty">
            <p>No members yet. Be the first to join!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardTable;
