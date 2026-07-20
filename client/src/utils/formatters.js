/**
 * Formatting utility functions for GitTrack dashboard.
 */

/** Format a number with K/M suffixes */
export const formatNumber = (num) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
};

/** Format a date to "Jan 2024" */
export const formatMonthYear = (dateStr) => {
  const d = new Date(dateStr + '-01');
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

/** Format a date to "Jul 19, 2026" */
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

/** Format a date to relative time ("2 hours ago") */
export const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60)    return 'just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
};

/** Return a color hex for the heatmap level (0-4) */
export const heatmapColor = (level) => {
  const colors = [
    'var(--graph-none)',
    'var(--graph-low)',
    'var(--graph-med-low)',
    'var(--graph-med-high)',
    'var(--graph-high)',
  ];
  return colors[Math.min(level, 4)] || colors[0];
};

/** Clamp a number between min and max */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Get a score color class based on value */
export const scoreColor = (score) => {
  if (score >= 80) return 'var(--accent-success)';
  if (score >= 60) return 'var(--accent-primary)';
  if (score >= 40) return 'var(--accent-warning)';
  return 'var(--accent-danger)';
};

/** Truncate a string with ellipsis */
export const truncate = (str, n = 30) =>
  str && str.length > n ? str.slice(0, n - 1) + '…' : str;

/** Pad month keys for consistent sorting */
export const sortMonthlyData = (data) =>
  [...data].sort((a, b) => a.month.localeCompare(b.month));
