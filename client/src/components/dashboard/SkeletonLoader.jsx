import './SkeletonLoader.css';

export const SkeletonBlock = ({ width = '100%', height = 20, radius = 6, style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

export const ProfileHeaderSkeleton = () => (
  <div className="skeleton-profile-header card">
    <div className="flex items-center gap-4">
      <SkeletonBlock width={80} height={80} radius={40} />
      <div className="flex flex-col gap-2" style={{ flex: 1 }}>
        <SkeletonBlock width="40%" height={28} />
        <SkeletonBlock width="60%" height={16} />
        <SkeletonBlock width="30%" height={20} radius={20} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <SkeletonBlock width={80} height={64} radius={8} />
        <SkeletonBlock width={60} height={14} radius={4} style={{ marginTop: 8 }} />
      </div>
    </div>
  </div>
);

export const MetricCardSkeleton = () => (
  <div className="card skeleton-metric-card">
    <SkeletonBlock width="50%" height={12} style={{ marginBottom: 16 }} />
    <SkeletonBlock width="40%" height={36} style={{ marginBottom: 8 }} />
    <SkeletonBlock width="70%" height={12} />
  </div>
);

export const ChartSkeleton = ({ height = 200 }) => (
  <div className="card">
    <SkeletonBlock width="30%" height={14} style={{ marginBottom: 20 }} />
    <SkeletonBlock width="100%" height={height} radius={8} />
  </div>
);

export const HeatmapSkeleton = () => (
  <div className="card">
    <SkeletonBlock width="40%" height={14} style={{ marginBottom: 16 }} />
    <div className="skeleton-heatmap-grid">
      {Array.from({ length: 52 }).map((_, i) => (
        <div key={i} className="skeleton-heatmap-col">
          {Array.from({ length: 7 }).map((_, j) => (
            <div key={j} className="skeleton-heatmap-cell skeleton" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const SkeletonLoader = () => (
  <div className="skeleton-dashboard">
    <ProfileHeaderSkeleton />
    <div className="grid-metric-cards" style={{ marginTop: 16 }}>
      {[0,1,2,3].map(i => <MetricCardSkeleton key={i} />)}
    </div>
    <div className="grid-2" style={{ marginTop: 16 }}>
      <ChartSkeleton height={240} />
      <ChartSkeleton height={240} />
    </div>
    <HeatmapSkeleton />
  </div>
);

export default SkeletonLoader;
