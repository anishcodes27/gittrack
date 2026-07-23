import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import MetricCard from './MetricCard';
import './WeeklyActivity.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="wa-tooltip">
      <p className="wa-tooltip-label">{new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
      <p className="wa-tooltip-value">Commits: <strong>{payload[0].value}</strong></p>
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const WeeklyActivity = ({ data }) => {
  // We need to aggregate the daily heatmap data into weekly sums
  const heatmap = data?.contributionHeatmap || [];
  
  // Group by week (assuming data is sorted chronologically and covers about a year)
  // We'll just take the last 12 weeks for a clear, readable chart
  const weeklyData = [];
  
  if (heatmap.length > 0) {
    // Group days into weeks of 7
    let currentWeekCommits = 0;
    let currentWeekStart = heatmap[0].date;
    
    for (let i = 0; i < heatmap.length; i++) {
      currentWeekCommits += heatmap[i].count;
      
      // If end of week or last day
      if ((i + 1) % 7 === 0 || i === heatmap.length - 1) {
        weeklyData.push({
          date: currentWeekStart,
          commits: currentWeekCommits
        });
        
        if (i + 1 < heatmap.length) {
          currentWeekStart = heatmap[i + 1].date;
          currentWeekCommits = 0;
        }
      }
    }
  }

  // Take the last 12 weeks
  const recentWeeks = weeklyData.slice(-12);

  return (
    <MetricCard
      title="Weekly Activity"
      accent="success"
      delay={300}
      icon={<ActivityIcon />}
      subtitle={<span style={{ color: 'var(--text-secondary)' }}>Commit volume over time</span>}
      style={{ minHeight: 'unset' }}
    >
      <div className="wa-chart-wrapper">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={recentWeeks} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              axisLine={false}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="commits"
              stroke="var(--accent-success)"
              strokeWidth={2}
              fill="url(#colorCommits)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--accent-success)', stroke: 'var(--bg-canvas)' }}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MetricCard>
  );
};

export default WeeklyActivity;
