import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from 'recharts';
import './LanguageRadar.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="radar-tooltip">
      <span style={{ color: d.color }}>{d.payload.name}</span>
      <strong> {d.value}%</strong>
    </div>
  );
};

const RADAR_COLORS = {
  TypeScript:  '#2b7489',
  JavaScript:  '#f1e05a',
  Python:      '#3572A5',
  Go:          '#00ADD8',
  Rust:        '#dea584',
  CSS:         '#563d7c',
  Java:        '#b07219',
  'C++':       '#f34b7d',
  Swift:       '#F05138',
  Kotlin:      '#7F52FF',
};

const LanguageRadar = ({ data }) => {
  const languages = data?.languages || [];

  // Use top 6 languages for a clean radar
  const radarData = languages.slice(0, 6).map((lang) => ({
    name: lang.name,
    percentage: lang.percentage,
    color: RADAR_COLORS[lang.name] || lang.color || 'var(--accent-primary)',
  }));

  return (
    <div className="card language-radar-card">
      <div className="card-header">
        <span className="card-title">Language Distribution</span>
        <span className="radar-badge">Top {radarData.length} langs</span>
      </div>

      <div className="radar-chart-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid
              stroke="var(--border-subtle)"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'auto']}
              tick={{ fontSize: 9, fill: 'var(--text-muted)' }}
              tickCount={4}
              axisLine={false}
            />
            <Radar
              name="Usage %"
              dataKey="percentage"
              stroke="var(--accent-primary)"
              fill="var(--accent-primary)"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--accent-primary)', strokeWidth: 0 }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Language pills */}
      <div className="language-pills">
        {languages.slice(0, 8).map((lang) => (
          <div key={lang.name} className="language-pill">
            <span
              className="language-pill-dot"
              style={{ background: RADAR_COLORS[lang.name] || lang.color || 'var(--accent-primary)' }}
            />
            <span className="language-pill-name">{lang.name}</span>
            <span className="language-pill-pct">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageRadar;
