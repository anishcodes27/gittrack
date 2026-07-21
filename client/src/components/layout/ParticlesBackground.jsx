import { useMemo } from 'react';
import './ParticlesBackground.css';

/**
 * ParticlesBackground
 * 40 small glowing particles that drift upward with random positions,
 * speeds, sizes, and opacities. Never blocks interactions (pointer-events: none).
 */
const ParticlesBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.2 + 0.08,
      duration: Math.random() * 18 + 14,
      delay: Math.random() * -30,
      drift: (Math.random() - 0.5) * 80,
      blur: Math.random() * 2 + 0.5,
      color: i % 3 === 0
        ? 'rgba(88, 166, 255, 1)'
        : i % 3 === 1
          ? 'rgba(57, 211, 83, 1)'
          : 'rgba(188, 140, 255, 1)',
    }));
  }, []);

  return (
    <div className="particles-container" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            filter: `blur(${p.blur}px)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticlesBackground;
