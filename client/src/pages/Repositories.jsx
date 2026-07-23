import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useUserData from '../hooks/useUserData';
import TopBar from '../components/layout/TopBar';
import { SkeletonBlock, ChartSkeleton } from '../components/dashboard/SkeletonLoader';
import { formatNumber } from '../utils/formatters';
import './Repositories.css';

// ─── Per-repo mini language bar ───────────────────────────────────────────────
const RepoLangBar = ({ languages }) => {
  if (!languages?.length) return null;
  return (
    <div className="rp-lang-bar">
      {languages.map((l) => (
        <div
          key={l.name}
          className="rp-lang-seg"
          style={{ width: `${l.percentage}%`, background: l.color || '#94A3B8' }}
          title={`${l.name} ${l.percentage}%`}
        />
      ))}
    </div>
  );
};

// ─── Language dot ─────────────────────────────────────────────────────────────
const LangDot = ({ lang }) => {
  if (!lang) return <span className="rp-no-lang">—</span>;
  return (
    <span className="rp-lang-dot-row">
      <span className="rp-lang-dot" style={{ background: lang.color || '#94A3B8' }} />
      <span className="rp-lang-name">{lang.name}</span>
    </span>
  );
};

// ─── Top Repo Card ────────────────────────────────────────────────────────────
const RepoCard = ({ repo }) => (
  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="rp-card">
    <div className="rp-card-top">
      <div className="rp-card-name-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
        </svg>
        <span>{repo.name}</span>
      </div>
      <div className="rp-card-stats">
        <span className="rp-stat rp-stat--star">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {formatNumber(repo.stargazerCount)}
        </span>
        <span className="rp-stat">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 5C7 3.89 7.9 3 9 3s2 .89 2 2-.9 2-2 2-2-.89-2-2zM15 19c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM9 7v4.13a3 3 0 0 0 2 2.83V16h2v-2.04A3 3 0 0 0 15 11V8h-2" />
          </svg>
          {formatNumber(repo.forkCount)}
        </span>
      </div>
    </div>

    {repo.description && <p className="rp-card-desc">{repo.description}</p>}

    <RepoLangBar languages={repo.languages} />

    <div className="rp-card-footer">
      <LangDot lang={repo.primaryLanguage} />
      <div className="rp-card-topics">
        {(repo.topics || []).slice(0, 3).map((t) => (
          <span key={t} className="rp-topic">{t}</span>
        ))}
      </div>
    </div>
  </a>
);

// ─── Sort header ──────────────────────────────────────────────────────────────
const SortTh = ({ label, field, sortBy, sortDir, onSort }) => {
  const active = sortBy === field;
  return (
    <th
      className={`rp-th rp-th--sort ${active ? 'rp-th--active' : ''}`}
      onClick={() => onSort(field)}
    >
      {label}
      <span className="rp-sort-arrow">{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}</span>
    </th>
  );
};

// ─── Summary stat card ────────────────────────────────────────────────────────
const SummaryCard = ({ icon, label, value, accent }) => (
  <div className={`rp-summary-card rp-summary-card--${accent}`}>
    <div className="rp-summary-icon">{icon}</div>
    <div className="rp-summary-val">{value}</div>
    <div className="rp-summary-label">{label}</div>
  </div>
);

// ─── Skeleton for repos ───────────────────────────────────────────────────────
const ReposSkeleton = () => (
  <div className="rp-skeleton">
    <div className="rp-summary-strip">
      {[0,1,2,3].map((i) => (
        <div key={i} className="card" style={{ padding: 20 }}>
          <SkeletonBlock width="40%" height={14} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="60%" height={28} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="50%" height={12} />
        </div>
      ))}
    </div>
    <div className="rp-top-grid">
      {[0,1,2,3,4,5].map((i) => (
        <div key={i} className="card" style={{ padding: 18, minHeight: 140 }}>
          <SkeletonBlock width="55%" height={14} style={{ marginBottom: 10 }} />
          <SkeletonBlock width="80%" height={12} style={{ marginBottom: 10 }} />
          <SkeletonBlock width="100%" height={4} style={{ marginBottom: 12 }} />
          <SkeletonBlock width="40%" height={12} />
        </div>
      ))}
    </div>
  </div>
);

// ─── Page date formatter ──────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Repositories = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchedUser = queryParams.get('user');
  const username = searchedUser || user?.username;

  const { data, isLoading, error } = useUserData(username, false);

  const [sortBy, setSortBy]   = useState('stargazerCount');
  const [sortDir, setSortDir] = useState('desc');
  const [langFilter, setLangFilter] = useState('All');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const repos = data?.repositories || [];

  // Unique language list for filter dropdown
  const allLangs = useMemo(() => {
    const langs = new Set();
    repos.forEach((r) => { if (r.primaryLanguage?.name) langs.add(r.primaryLanguage.name); });
    return ['All', ...Array.from(langs).sort()];
  }, [repos]);

  // Summary stats
  const totalStars = repos.reduce((s, r) => s + (r.stargazerCount || 0), 0);
  const totalForks = repos.reduce((s, r) => s + (r.forkCount || 0), 0);
  const topLang = data?.languages?.[0]?.name || '—';

  // Sort + filter
  const filtered = useMemo(() => {
    let list = langFilter === 'All'
      ? repos
      : repos.filter((r) => r.primaryLanguage?.name === langFilter);

    return [...list].sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (sortBy === 'updatedAt') { av = new Date(av); bv = new Date(bv); }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [repos, langFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSlice  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const topRepos = useMemo(
    () => [...repos].sort((a, b) => b.stargazerCount - a.stargazerCount).slice(0, 6),
    [repos]
  );

  const handleSort = (field) => {
    if (sortBy === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(field); setSortDir('desc'); }
    setPage(1);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (!username) return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            🔍 Search a GitHub username to explore their repositories.
          </p>
        </div>
      </main>
    </div>
  );

  if (isLoading) return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content"><ReposSkeleton /></main>
    </div>
  );

  if (error) return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--accent-danger)' }}>⚠️ {error}</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="main-area">
      <TopBar onToggleSidebar={onToggleSidebar} />
      <main className="page-content rp-page animate-fade-in">

        {/* Page header */}
        <div className="rp-page-header">
          <div>
            <h1 className="rp-page-title">
              <img
                src={data?.avatarUrl}
                alt={username}
                className="rp-avatar-sm"
              />
              {data?.displayName || username}
              <span className="rp-username-tag">@{username}</span>
            </h1>
            <p className="rp-page-sub">Public repositories · sorted by activity</p>
          </div>
          <a
            href={`https://github.com/${username}?tab=repositories`}
            target="_blank"
            rel="noopener noreferrer"
            className="rp-gh-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View on GitHub ↗
          </a>
        </div>

        {/* Summary strip */}
        <div className="rp-summary-strip">
          <SummaryCard icon="📦" label="Total Repos"  value={repos.length}         accent="blue" />
          <SummaryCard icon="⭐" label="Total Stars"  value={formatNumber(totalStars)} accent="gold" />
          <SummaryCard icon="🍴" label="Total Forks"  value={formatNumber(totalForks)} accent="green" />
          <SummaryCard icon="💻" label="Top Language" value={topLang}               accent="purple" />
        </div>

        {/* Top Repositories */}
        {topRepos.length > 0 && (
          <>
            <div className="rp-section-header">
              <h2 className="rp-section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Top Repositories
              </h2>
              <span className="rp-count-badge">by stars</span>
            </div>
            <div className="rp-top-grid">
              {topRepos.map((repo) => <RepoCard key={repo.name} repo={repo} />)}
            </div>
          </>
        )}

        {/* All Repos — filtered + sortable table */}
        <div className="rp-section-header rp-section-header--table">
          <h2 className="rp-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            All Repositories
            <span className="rp-count-badge">{filtered.length}</span>
          </h2>

          {/* Language filter */}
          <select
            className="rp-lang-filter"
            value={langFilter}
            onChange={(e) => { setLangFilter(e.target.value); setPage(1); }}
          >
            {allLangs.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <SortTh label="Repository" field="name"           sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Stars"      field="stargazerCount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Forks"      field="forkCount"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <SortTh label="Updated"    field="updatedAt"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                <th className="rp-th">Language</th>
                <th className="rp-th rp-th--langbar">Stack</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((repo) => (
                <tr key={repo.name} className="rp-tr">
                  <td className="rp-td rp-td--name">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="rp-repo-link">
                      {repo.name}
                    </a>
                    {repo.description && (
                      <span className="rp-td-desc">{repo.description}</span>
                    )}
                    {(repo.topics || []).slice(0, 2).map((t) => (
                      <span key={t} className="rp-topic rp-topic--sm">{t}</span>
                    ))}
                  </td>
                  <td className="rp-td rp-td--num rp-td--star">
                    ⭐ {formatNumber(repo.stargazerCount)}
                  </td>
                  <td className="rp-td rp-td--num">
                    {formatNumber(repo.forkCount)}
                  </td>
                  <td className="rp-td rp-td--date">{fmtDate(repo.updatedAt)}</td>
                  <td className="rp-td"><LangDot lang={repo.primaryLanguage} /></td>
                  <td className="rp-td rp-td--langbar">
                    <RepoLangBar languages={repo.languages} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rp-pagination">
              <button
                className="rp-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >← Prev</button>
              <span className="rp-page-info">Page {page} of {totalPages}</span>
              <button
                className="rp-page-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >Next →</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Repositories;
