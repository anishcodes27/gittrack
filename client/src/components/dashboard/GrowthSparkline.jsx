import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { formatMonthYear, sortMonthlyData } from '../../utils/formatters';
import MetricCard from './MetricCard';
import './GrowthSparkline.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="sparkline-tooltip">
      <p className="sparkline-tooltip-label">{formatMonthYear(label)}</p>
      <p className="sparkline-tooltip-value">Score: <strong>{payload[0]?.value}</strong></p>
      <p className="sparkline-tooltip-sub">PRs: {payload[1]?.value}</p>
    </div>
  );
};

const GrowthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const GrowthSparkline = ({ data }) => {
  const chartData = data?.monthlyGrowth ? sortMonthlyData(data.monthlyGrowth) : [];
  const growthIndex = data?.growthIndex || 0;
  const isPositive = growthIndex >= 0;

  return (
    <MetricCard
      title="12-Month Growth Trend"
      accent="primary"
      delay={300}
      icon={<GrowthIcon />}
      subtitle={
        <span style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
          {isPositive ? '↑' : '↓'} {Math.abs(growthIndex)}% vs prev quarter
        </span>
      }
      style={{ minHeight: 'unset' }}
    >
      <div className="sparkline-wrapper">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--accent-primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPRs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--accent-success)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              tickFormatter={(v) => formatMonthYear(v).split(' ')[0]}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              fill="url(#colorScore)"
              dot={false}
              animationDuration={1200}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="prs"
              stroke="var(--accent-success)"
              strokeWidth={1.5}
              fill="url(#colorPRs)"
              dot={false}
              animationDuration={1400}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="sparkline-legend">
        <span className="sparkline-legend-item">
          <span className="sparkline-legend-dot" style={{ background: 'var(--accent-primary)' }} />
          Impact Score
        </span>
        <span className="sparkline-legend-item">
          <span className="sparkline-legend-dot" style={{ background: 'var(--accent-success)' }} />
          Merged PRs
        </span>
      </div>
    </MetricCard>
  );
};

export default GrowthSparkline;
