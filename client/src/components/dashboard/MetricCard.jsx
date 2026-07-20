import './MetricCard.css';

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'primary',
  children,
  style = {},
  className = '',
  delay = 0,
}) => {
  const accentMap = {
    primary: 'card--interactive',
    success: 'card--success',
    warning: 'card--warning',
    default: '',
  };

  return (
    <div
      className={`card metric-card ${accentMap[accent] || ''} animate-fade-in ${className}`}
      style={{ ...style, animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="card-header">
        <span className="card-title">{title}</span>
        {icon && <span className={`metric-card-icon metric-card-icon--${accent}`}>{icon}</span>}
      </div>

      {/* Value */}
      {value !== undefined && (
        <div className={`metric-card-value metric-card-value--${accent}`}>{value}</div>
      )}

      {/* Subtitle */}
      {subtitle && <p className="metric-card-subtitle">{subtitle}</p>}

      {/* Custom children (e.g. sparklines) */}
      {children}
    </div>
  );
};

export default MetricCard;
