import MetricCard from './MetricCard';

const FlameIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-success)" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 2C12.5 2 12 6 9.5 8c-1.5 1.2-3 1.5-4 2.5-2 2-2.5 5-1 7.5C6 20.5 8.5 22 12 22s7-2.5 7-6c0-2-1-3.5-2.5-4.5 0 0 .5 2-1 3-.5.5-1 .5-1 .5s1-2 .5-4c-.5-2-2-3-2-3s-.5 2-1 3C11 13 9.5 13.5 9 15c-.5 1.5.5 3 1.5 3.5C9 18 8 16.5 8.5 14.5c.5-2 2-3 3-4 .5-.5 1-1.5 1-3z" />
  </svg>
);

const StreakCard = ({ data }) => {
  const streak  = data?.currentStreak  || 0;
  const longest = data?.longestStreak  || 0;

  return (
    <MetricCard
      title="Coding Streak"
      accent="success"
      delay={100}
      icon={<FlameIcon />}
      subtitle={`Longest streak: ${longest} days`}
    >
      <div className="streak-value-row">
        <span className="metric-card-value metric-card-value--success">{streak}</span>
        <span className="streak-unit">days</span>
      </div>
      {/* Mini flame bars */}
      <div className="streak-bars">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="streak-bar"
            style={{
              height: `${Math.max(20, Math.min(100, (i < streak ? 60 + Math.random() * 40 : 20)))}%`,
              background: i < streak
                ? `rgba(46,164,79,${0.4 + (i / 14) * 0.6})`
                : 'var(--bg-overlay)',
            }}
          />
        ))}
      </div>
    </MetricCard>
  );
};

export default StreakCard;
