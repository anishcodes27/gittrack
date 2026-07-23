import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';
import TopBar from '../components/layout/TopBar';
import { formatNumber } from '../utils/formatters';
import './Compare.css';

// ─── Weighted comparison score (client-side) ──────────────────────────────────
const weightedScore = (d) => {
  if (!d) return 0;
  const impact     = (d.impactScore     || 0) * 0.50;
  const streak     = Math.min((d.currentStreak || 0), 365) / 365 * 100 * 0.20;
  const repos      = Math.min((d.publicRepos   || 0), 200) / 200 * 100 * 0.15;
  const followers  = Math.min((d.followers     || 0), 10000) / 10000 * 100 * 0.15;
  return impact + streak + repos + followers;
};

// ─── Single metric comparison row ─────────────────────────────────────────────
const MetricRow = ({ label, valA, valB, formatFn = (v) => v }) => {
  const max = Math.max(valA, valB, 1);
  const pctA = (valA / max) * 100;
  const pctB = (valB / max) * 100;

  let verdict = 'Tie';
  let verdictClass = 'verdict--tie';
  if (valA > valB) { verdict = 'A wins'; verdictClass = 'verdict--a'; }
  else if (valB > valA) { verdict = 'B wins'; verdictClass = 'verdict--b'; }

  return (
    <div className="cmp-metric-row">
      <div className="cmp-metric-label">{label}</div>
      <div className="cmp-metric-bars">
        {/* User A bar — fills right-to-left */}
        <div className="cmp-bar-wrap cmp-bar-wrap--a">
          <span className="cmp-bar-val">{formatFn(valA)}</span>
          <div className="cmp-bar cmp-bar--a" style={{ width: `${pctA}%` }} />
        </div>

        <span className={`cmp-verdict ${verdictClass}`}>{verdict}</span>

        {/* User B bar — fills left-to-right */}
        <div className="cmp-bar-wrap cmp-bar-wrap--b">
          <div className="cmp-bar cmp-bar--b" style={{ width: `${pctB}%` }} />
          <span className="cmp-bar-val">{formatFn(valB)}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Profile summary card ──────────────────────────────────────────────────────
const ProfileCard = ({ data, label, accent }) => {
  if (!data) return (
    <div className="cmp-profile-card cmp-profile-card--empty">
      <div className="cmp-profile-placeholder">
        <span>{label}</span>
        <p>No data</p>
      </div>
    </div>
  );

  return (
    <div className={`cmp-profile-card cmp-profile-card--${accent}`}>
      <div className="cmp-profile-accent-bar" />
      <img src={data.avatarUrl} alt={data.username} className="cmp-profile-avatar" />
      <div className="cmp-profile-info">
        <h3 className="cmp-profile-name">{data.displayName || data.username}</h3>
        <a
          href={data.profileUrl || `https://github.com/${data.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cmp-profile-username"
        >
          @{data.username}
        </a>
      </div>
      <div className="cmp-profile-stats">
        <div className="cmp-profile-stat">
          <span className="cmp-profile-stat-val">{formatNumber(data.publicRepos || 0)}</span>
          <span className="cmp-profile-stat-label">Repos</span>
        </div>
        <div className="cmp-profile-stat">
          <span className="cmp-profile-stat-val">{formatNumber(data.followers || 0)}</span>
          <span className="cmp-profile-stat-label">Followers</span>
        </div>
        <div className="cmp-profile-stat">
          <span className="cmp-profile-stat-val">{data.impactScore || 0}</span>
          <span className="cmp-profile-stat-label">Score</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Compare Page ────────────────────────────────────────────────────────
const Compare = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [inputA, setInputA]     = useState(searchParams.get('a') || '');
  const [inputB, setInputB]     = useState(searchParams.get('b') || '');
  const [dataA, setDataA]       = useState(null);
  const [dataB, setDataB]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [compared, setCompared] = useState(false);

  const handleSwap = () => {
    setInputA(inputB);
    setInputB(inputA);
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    const userA = inputA.trim();
    const userB = inputB.trim();

    if (!userA || !userB) {
      setError('Please enter both GitHub usernames.');
      return;
    }
    if (userA.toLowerCase() === userB.toLowerCase()) {
      setError('Please enter two different usernames.');
      return;
    }

    setError('');
    setLoading(true);
    setCompared(false);

    try {
      const [resA, resB] = await Promise.all([
        client.get(`/user/${userA}`),
        client.get(`/user/${userB}`),
      ]);
      setDataA(resA.data);
      setDataB(resB.data);
      setCompared(true);
      navigate(`/compare?a=${userA}&b=${userB}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to fetch one or both users. Check the usernames and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine winner
  const scoreA = weightedScore(dataA);
  const scoreB = weightedScore(dataB);
  let winner = null;
  let winnerName = '';
  if (compared && dataA && dataB) {
    if (scoreA > scoreB) { winner = 'A'; winnerName = dataA.displayName || dataA.username; }
    else if (scoreB > scoreA) { winner = 'B'; winnerName = dataB.displayName || dataB.username; }
    else { winner = 'TIE'; winnerName = 'It\'s a tie!'; }
  }

  const METRICS = [
    { label: 'Impact Score',          keyA: 'impactScore',    fmt: (v) => `${v}/100` },
    { label: 'Lifetime Contributions', keyA: 'totalCommits',  fmt: formatNumber },
    { label: 'Current Streak',         keyA: 'currentStreak', fmt: (v) => `${v}d` },
    { label: 'Merged PRs',            keyA: 'mergedPRCount',  fmt: formatNumber },
    { label: 'External PRs',          keyA: 'externalPRCount', fmt: formatNumber },
    { label: 'Public Repositories',   keyA: 'publicRepos',   fmt: formatNumber },
    { label: 'Followers',             keyA: 'followers',      fmt: formatNumber },
    { label: 'PR Merge Rate',         keyA: 'prMergeRate',    fmt: (v) => `${v}%` },
  ];

  return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />

      <main className="page-content compare-content">
        <div className="compare-heading">
          <h1 className="compare-page-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
              <path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
            </svg>
            Compare Developers
          </h1>
          <p className="compare-page-sub">
            Compare any two GitHub profiles side-by-side across impact score, streak, contributions, and more.
          </p>
        </div>

        {/* ── Search form ── */}
        <form className="compare-form card" onSubmit={handleCompare}>
          <div className="compare-inputs">
            <div className="compare-input-group compare-input-group--a">
              <label className="compare-input-label">
                <span className="compare-badge compare-badge--a">A</span>
                Developer A
              </label>
              <input
                id="compare-input-a"
                type="text"
                className="compare-input"
                placeholder="GitHub username…"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              className="compare-swap-btn"
              onClick={handleSwap}
              title="Swap users"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 3l4 4-4 4"/><line x1="20" y1="7" x2="4" y2="7"/>
                <path d="M8 21l-4-4 4-4"/><line x1="4" y1="17" x2="20" y2="17"/>
              </svg>
            </button>

            <div className="compare-input-group compare-input-group--b">
              <label className="compare-input-label">
                <span className="compare-badge compare-badge--b">B</span>
                Developer B
              </label>
              <input
                id="compare-input-b"
                type="text"
                className="compare-input"
                placeholder="GitHub username…"
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {error && <p className="compare-error">{error}</p>}

          <button
            id="compare-submit-btn"
            type="submit"
            className="compare-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin-slow">
                  <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Comparing…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/>
                  <path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>
                </svg>
                Compare
              </>
            )}
          </button>
        </form>

        {/* ── Results ── */}
        {compared && dataA && dataB && (
          <div className="compare-results animate-fade-in">

            {/* Winner banner */}
            <div className={`compare-winner-banner ${winner === 'TIE' ? 'compare-winner-banner--tie' : ''}`}>
              <span className="compare-winner-trophy">
                {winner === 'TIE' ? '🤝' : '🏆'}
              </span>
              <div className="compare-winner-text">
                {winner === 'TIE' ? (
                  <span className="compare-winner-label">It's a Tie!</span>
                ) : (
                  <>
                    <span className="compare-winner-label">Overall Winner</span>
                    <span className="compare-winner-name">{winnerName}</span>
                  </>
                )}
              </div>
              <div className="compare-winner-scores">
                <div className={`compare-winner-score ${winner === 'A' ? 'compare-winner-score--active' : ''}`}>
                  <span>{(dataA.displayName || dataA.username).split(' ')[0]}</span>
                  <strong>{scoreA.toFixed(1)}</strong>
                </div>
                <span className="compare-winner-vs">vs</span>
                <div className={`compare-winner-score ${winner === 'B' ? 'compare-winner-score--active' : ''}`}>
                  <span>{(dataB.displayName || dataB.username).split(' ')[0]}</span>
                  <strong>{scoreB.toFixed(1)}</strong>
                </div>
              </div>
            </div>

            {/* Profile cards */}
            <div className="compare-profiles">
              <ProfileCard data={dataA} label="A" accent="a" />
              <ProfileCard data={dataB} label="B" accent="b" />
            </div>

            {/* Metrics comparison */}
            <div className="cmp-metrics-section card">
              <div className="card-header">
                <span className="card-title">Metrics Comparison</span>
                <div className="cmp-legend">
                  <span className="cmp-legend-dot cmp-legend-dot--a" />
                  <span className="cmp-legend-label">{dataA.username}</span>
                  <span className="cmp-legend-dot cmp-legend-dot--b" />
                  <span className="cmp-legend-label">{dataB.username}</span>
                </div>
              </div>
              <div className="cmp-metrics-list">
                {METRICS.map(({ label, keyA, fmt }) => (
                  <MetricRow
                    key={label}
                    label={label}
                    valA={dataA[keyA] || 0}
                    valB={dataB[keyA] || 0}
                    formatFn={fmt}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Compare;
