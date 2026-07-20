import { useEffect, useRef, useState } from 'react';
import MetricCard from './MetricCard';
import './PRCard.css';

// SVG circular progress ring
const CircularProgress = ({ percentage, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference - (percentage / 100) * circumference);
    }, 300);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <svg width={size} height={size} className="pr-ring" style={{ transform: 'rotate(-90deg)' }}>
      {/* Background ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--bg-overlay)" strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="var(--accent-success)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.2s ease', filter: 'drop-shadow(0 0 4px rgba(57,211,83,0.5))' }}
      />
    </svg>
  );
};

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PRCard = ({ data }) => {
  const mergeRate     = data?.prMergeRate     || 0;
  const mergedPRCount = data?.mergedPRCount   || 0;
  const externalCount = data?.externalPRCount || 0;
  const openCount     = data?.openPRCount     || 0;

  return (
    <MetricCard title="Merged Pull Requests" accent="success" delay={200} icon={<CheckIcon />}>
      <div className="pr-card-inner">
        <div className="pr-ring-wrapper">
          <CircularProgress percentage={mergeRate} />
          <div className="pr-ring-label">
            <span className="pr-ring-pct">{mergeRate}%</span>
            <span className="pr-ring-sub">merged</span>
          </div>
        </div>

        <div className="pr-stats">
          <div className="pr-stat-row">
            <span className="pr-stat-dot pr-stat-dot--external" />
            <span className="pr-stat-name">External</span>
            <span className="pr-stat-count">{externalCount}</span>
          </div>
          <div className="pr-stat-row">
            <span className="pr-stat-dot pr-stat-dot--personal" />
            <span className="pr-stat-name">Personal</span>
            <span className="pr-stat-count">{mergedPRCount - externalCount}</span>
          </div>
          <div className="pr-stat-row">
            <span className="pr-stat-dot pr-stat-dot--open" />
            <span className="pr-stat-name">Open</span>
            <span className="pr-stat-count">{openCount}</span>
          </div>
          <div className="pr-total">
            <span>Total: <strong>{mergedPRCount + openCount}</strong></span>
          </div>
        </div>
      </div>
    </MetricCard>
  );
};

export default PRCard;
