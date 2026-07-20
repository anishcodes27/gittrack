import { useEffect, useRef, useState } from 'react';
import TagBadge from './TagBadge';
import { formatNumber } from '../../utils/formatters';
import './ProfileHeader.css';

// Animated counter that counts up from 0 to target
const AnimatedScore = ({ target, duration = 1500 }) => {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
};

const StatChip = ({ label, value, icon }) => (
  <div className="profile-stat-chip">
    {icon && <span>{icon}</span>}
    <span className="profile-stat-value">{value}</span>
    <span className="profile-stat-label">{label}</span>
  </div>
);

const ProfileHeader = ({ data }) => {
  if (!data) return null;

  const {
    username, displayName, bio, avatarUrl, profileUrl,
    impactScore, specialtyTag, specialtyTagDetail,
    followers, following, publicRepos,
    currentStreak, mergedPRCount, externalPRCount,
  } = data;

  return (
    <div className="profile-header card animate-fade-in">
      {/* Background glow */}
      <div className="profile-header-glow" />

      <div className="profile-header-inner">
        {/* Left: Avatar + Info */}
        <div className="profile-header-left">
          <div className="profile-avatar-wrapper">
            <img
              src={avatarUrl}
              alt={username}
              className="avatar avatar-glow profile-avatar"
              width={80}
              height={80}
            />
            <div className="profile-avatar-status" title="Active contributor" />
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h2 className="profile-display-name">{displayName || username}</h2>
              <a
                href={profileUrl || `https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-github-link"
                title="View on GitHub"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                @{username}
              </a>
            </div>

            {bio && <p className="profile-bio">{bio}</p>}

            <div className="profile-tags-row">
              <TagBadge tag={specialtyTag} detail={specialtyTagDetail} icon={data.specialtyIcon} />
            </div>

            <div className="profile-stats-row">
              <StatChip label="Repos" value={formatNumber(publicRepos || 0)} icon="📦" />
              <StatChip label="Followers" value={formatNumber(followers || 0)} icon="👥" />
              <StatChip label="Following" value={formatNumber(following || 0)} icon="➕" />
              <StatChip label="External PRs" value={externalPRCount || 0} icon="🔀" />
            </div>
          </div>
        </div>

        {/* Right: Impact Score */}
        <div className="profile-score-section">
          <p className="profile-score-label">Impact Score</p>
          <div className="score-display">
            <span className="score-number animate-glow-pulse animate-count-up">
              <AnimatedScore target={impactScore || 0} />
            </span>
            <span className="score-max">/100</span>
          </div>
          <div className="profile-score-bar">
            <div
              className="profile-score-fill"
              style={{ width: `${impactScore || 0}%` }}
            />
          </div>
          <p className="profile-score-sublabel">
            {impactScore >= 90 ? '🏆 Elite Contributor'
             : impactScore >= 75 ? '⭐ Top Contributor'
             : impactScore >= 50 ? '📈 Active Developer'
             : '🌱 Growing Developer'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
