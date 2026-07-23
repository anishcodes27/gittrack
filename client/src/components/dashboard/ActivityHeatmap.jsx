import { useState, useRef, useEffect } from 'react';
import { heatmapColor, formatDate } from '../../utils/formatters';
import './ActivityHeatmap.css';

// Build exact 365-day calendar ending today with 0 default contributions
const generateEmptyHeatmap = () => {
  const days = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: 0,
      level: 0,
    });
  }
  return days;
};

const WEEK_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ActivityHeatmap = ({ data, source = 'prs' }) => {
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [data]);

  // Build a map of dates from fetched data
  const dataMap = new Map();
  if (data?.contributionHeatmap?.length > 0) {
    data.contributionHeatmap.forEach(d => dataMap.set(d.date, d));
  }

  // Extract set of dates (YYYY-MM-DD) where user has merged EXTERNAL PRs
  const externalPRDates = new Set(
    (data?.recentMergedPRs || [])
      .filter((pr) => pr.isExternal && pr.mergedAt)
      .map((pr) => new Date(pr.mergedAt).toISOString().split('T')[0])
  );

  // ALWAYS start with a full 365-day window ending today
  const emptyDays = generateEmptyHeatmap();

  // Merge the fetched data into the 365-day window (ensuring exact 365 days length)
  const sortedDays = emptyDays.map((emptyDay) => {
    const fetchedDay = dataMap.get(emptyDay.date);
    const day = fetchedDay || emptyDay;

    if (source === 'prs') {
      const isExternalDate = externalPRDates.has(day.date);
      return {
        ...day,
        count: isExternalDate ? (day.count || 0) : 0,
        level: isExternalDate ? (day.level || 0) : 0,
      };
    }
    return {
      ...day,
      count: day.count || 0,
      level: day.level || 0,
    };
  });

  // Build grid of 52-53 weeks (columns) x 7 days (Sunday to Saturday)
  const firstDate = new Date(sortedDays[0]?.date || new Date());
  const startDayOfWeek = firstDate.getDay(); // 0=Sun, 1=Mon...

  const allDays = [...Array(startDayOfWeek).fill(null), ...sortedDays];
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  // Month labels positioning based on week index
  const monthPositions = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValidDay = week.find(Boolean);
    if (firstValidDay) {
      const date = new Date(firstValidDay.date);
      const m = date.getMonth();
      if (m !== lastMonth) {
        monthPositions.push({ col: wi + 1, label: MONTH_LABELS[m] });
        lastMonth = m;
      }
    }
  });

  const totalContribs = sortedDays.reduce((sum, d) => sum + (d?.count || 0), 0);

  return (
    <div className="card heatmap-card animate-fade-in delay-500">
      <div className="card-header">
        <span className="card-title">Contribution Activity</span>
        <div className="heatmap-meta">
          <span className="heatmap-total">{totalContribs.toLocaleString()} contributions in the last year</span>
        </div>
      </div>

      <div className="heatmap-outer">
        {/* Day labels on left (Mon, Wed, Fri) */}
        <div className="heatmap-day-labels">
          {WEEK_LABELS.map((d, i) => (
            <span key={i} className="heatmap-day-label">{d}</span>
          ))}
        </div>

        {/* Grid */}
        <div className="heatmap-scroll" ref={scrollRef}>
          {/* Month labels */}
          <div className="heatmap-month-labels">
            {monthPositions.map((pos, i) => (
              <span
                key={i}
                className="heatmap-month-label"
                style={{ gridColumn: pos.col }}
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
                      className={`heatmap-cell ${day ? `heatmap-level-${day.level || 0}` : 'heatmap-empty'}`}
                      style={{ background: day ? heatmapColor(day.level || 0) : 'transparent' }}
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
          <strong>{tooltip.count} {source === 'commits' ? 'commits' : 'PRs'}</strong>
          <span> on {formatDate(tooltip.date)}</span>
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmap;
