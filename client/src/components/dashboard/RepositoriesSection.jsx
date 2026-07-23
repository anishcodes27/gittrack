import { useState } from 'react';
import { formatNumber } from '../../utils/formatters';
import './RepositoriesSection.css';

// ─── Per-repo language bar ────────────────────────────────────────────────────
const RepoLanguageBar = ({ languages }) => {
  if (!languages || languages.length === 0) return null;
  return (
    <div className="repo-lang-bar">
      {languages.map((lang) => (
        <div
          key={lang.name}
          className="repo-lang-bar-segment"
          style={{ width: `${lang.percentage}%`, background: lang.color || '#94A3B8' }}
          title={`${lang.name} ${lang.percentage}%`}
        />
      ))}
    </div>
  );
};

// ─── Language dot ─────────────────────────────────────────────────────────────
const LangDot = ({ lang }) => {
  if (!lang) return null;
  return (
    <span className="repo-lang-dot-row">
      <span
        className="repo-lang-dot"
        style={{ background: lang.color || '#94A3B8' }}
      />
      <span className="repo-lang-name">{lang.name}</span>
    </span>
  );
};

// ─── Top Repo Card ────────────────────────────────────────────────────────────
const RepoCard = ({ repo }) => (
  <a
    href={repo.url}
    target="_blank"
    rel="noopener noreferrer"
    className="repo-card"
  >
    <div className="repo-card-header">
      <span className="repo-card-name">{repo.name}</span>
      <div className="repo-card-stats">
        <span className="repo-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {formatNumber(repo.stargazerCount)}
        </span>
        <span className="repo-stat">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 5C7 3.89 7.9 3 9 3s2 .89 2 2-.9 2-2 2-2-.89-2-2zM15 19c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM9 7v4.13a3 3 0 0 0 2 2.83V16h2v-2.04A3 3 0 0 0 15 11V8h-2" />
          </svg>
          {formatNumber(repo.forkCount)}
        </span>
      </div>
    </div>

    {repo.description && (
      <p className="repo-card-desc">{repo.description}</p>
    )}

    <RepoLanguageBar languages={repo.languages} />

    <div className="repo-card-footer">
      <LangDot lang={repo.primaryLanguage} />
      <div className="repo-card-topics">
        {(repo.topics || []).slice(0, 3).map((topic) => (
          <span key={topic} className="repo-topic-badge">{topic}</span>
        ))}
      </div>
    </div>
  </a>
);

// ─── Sortable table header cell ────────────────────────────────────────────────
const SortHeader = ({ label, field, sortBy, sortDir, onSort }) => {
  const active = sortBy === field;
  return (
    <th
      className={`repos-th repos-th--sortable ${active ? 'repos-th--active' : ''}`}
      onClick={() => onSort(field)}
    >
      {label}
      <span className="sort-arrow">
        {active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅'}
      </span>
    </th>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────
const RepositoriesSection = ({ data }) => {
  const [showAll, setShowAll]   = useState(false);
  const [page, setPage]         = useState(1);
  const [sortBy, setSortBy]     = useState('stargazerCount');
  const [sortDir, setSortDir]   = useState('desc');

  const repos = data?.repositories || [];
  if (repos.length === 0) return null;

  // Sort by stars for the top cards
  const topRepos = [...repos].sort((a, b) => b.stargazerCount - a.stargazerCount).slice(0, 6);

  // Sort all repos for the table
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const sorted = [...repos].sort((a, b) => {
    let av = a[sortBy];
    let bv = b[sortBy];
    if (sortBy === 'updatedAt') { av = new Date(av); bv = new Date(bv); }
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageSlice = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatUpdatedAt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="repos-section animate-fade-in">
      {/* ── Top Repositories ── */}
      <div className="repos-header">
        <h2 className="repos-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
          </svg>
          Top Repositories
        </h2>
        <span className="repos-count-badge">{repos.length} repos</span>
      </div>

      <div className="repos-top-grid">
        {topRepos.map((repo) => (
          <RepoCard key={repo.name} repo={repo} />
        ))}
      </div>

      {/* ── All Repositories Table ── */}
      <div className="repos-all-section">
        <button
          className="repos-toggle-btn"
          onClick={() => { setShowAll((v) => !v); setPage(1); }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: showAll ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          {showAll ? 'Hide All Repositories' : `Show All Repositories (${repos.length})`}
        </button>

        {showAll && (
          <div className="repos-table-wrapper">
            <table className="repos-table">
              <thead>
                <tr>
                  <SortHeader label="Repository" field="name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Stars" field="stargazerCount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Forks" field="forkCount" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Updated" field="updatedAt" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  <th className="repos-th">Language</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((repo) => (
                  <tr key={repo.name} className="repos-tr">
                    <td className="repos-td repos-td--name">
                      <a href={repo.url} target="_blank" rel="noopener noreferrer" className="repos-link">
                        {repo.name}
                      </a>
                      {repo.description && (
                        <span className="repos-td-desc">{repo.description}</span>
                      )}
                    </td>
                    <td className="repos-td repos-td--num">
                      <span className="repos-td-star">⭐ {formatNumber(repo.stargazerCount)}</span>
                    </td>
                    <td className="repos-td repos-td--num">
                      {formatNumber(repo.forkCount)}
                    </td>
                    <td className="repos-td repos-td--date">
                      {formatUpdatedAt(repo.updatedAt)}
                    </td>
                    <td className="repos-td">
                      <LangDot lang={repo.primaryLanguage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="repos-pagination">
                <button
                  className="repos-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >← Prev</button>
                <span className="repos-page-info">Page {page} of {totalPages}</span>
                <button
                  className="repos-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepositoriesSection;
