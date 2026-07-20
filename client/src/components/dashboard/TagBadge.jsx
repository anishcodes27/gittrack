import './TagBadge.css';

const TagBadge = ({ tag, detail, icon, size = 'md' }) => {
  if (!tag) return null;

  return (
    <div className={`tag-badge tag-badge--${size}`} title={detail || tag}>
      {icon && <span className="tag-badge-icon">{icon}</span>}
      <span className="tag-badge-text">{tag}</span>
    </div>
  );
};

export default TagBadge;
