import { useState } from 'react';
import { heatmapColor, formatDate } from '../../utils/formatters';
import './ActivityHeatmap.css';

// Generate 52 weeks × 7 days of placeholder data if no real data provided
const generateDemoHeatmap = () => {
  const days = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rand = Math.random();
    const count = rand > 0.6 ? Math.floor(rand * 12) : 0;
    days.push({
      date: dateStr,
      count,
      level: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 8 ? 3 : 4,
    });
  }
  return days;
};

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ActivityHeatmap = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);

  // Use real heatmap or generate demo
  const rawDays = data?.contributionHeatmap?.length > 0
    ? data.contributionHeatmap
    : generateDemoHeatmap();

  // Pad to start on Sunday
  const firstDay = new Date(rawDays[0]?.date || new Date());
  const startPadding = firstDay.getDay(); // 0=Sun

  // Chunk into weeks (columns of 7)
  const allDays = [...Array(startPadding).fill(null), ...rawDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Month label positions
  const monthPositions = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValid = week.find(Boolean);
    if (firstValid) {
      const m = new Date(firstValid.date).getMonth();
      if (m !== lastMonth) {
        monthPositions.push({ col: wi, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    }
  });

  const totalContribs = rawDays.reduce((sum, d) => sum + (d?.count || 0), 0);
  const externalOnly  = data?.externalPRCount || 0;

  return (
    <div className="card heatmap-card animate-fade-in delay-500">
      <div className="card-header">
        <span className="card-title">External Contribution Activity</span>
        <div className="heatmap-meta">
          <span className="heatmap-total">{totalContribs.toLocaleString()} contributions · {externalOnly} external</span>
        </div>
      </div>

      <div className="heatmap-outer">
        {/* Day labels on left */}
        <div className="heatmap-day-labels">
          {WEEK_LABELS.filter((_, i) => i % 2 === 1).map((d) => (
            <span key={d} className="heatmap-day-label">{d}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-scroll">
          {/* Month labels */}
          <div className="heatmap-month-labels">
            {monthPositions.map((pos, i) => (
              <span
                key={i}
                className="heatmap-month-label"
                style={{ gridColumn: pos.col + 1 }}
              >
                {pos.label}
              </span>
            ))}
          </div>

          {/* Cells */}
          <div className="heatmap-grid">
            {weeks.map((week, wi) => (
              <div key={wi} className="heatmap-week">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di];
                  return (
                    <div
                      key={di}
                      className={`heatmap-cell ${day ? `heatmap-level-${day.level}` : 'heatmap-empty'}`}
                      style={{ background: day ? heatmapColor(day.level) : 'transparent' }}
                      onMouseEnter={(e) => {
                        if (day) {
                          const rect = e.target.getBoundingClientRect();
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top - 36,
                            date: day.date,
                            count: day.count,
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="heatmap-legend-cell"
            style={{ background: heatmapColor(level) }}
          />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="heatmap-floating-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.count} contributions</strong>
          <span> on {formatDate(tooltip.date)}</span>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
