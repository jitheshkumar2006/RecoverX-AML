import { getTISColor } from '../services/tisEngine';

export default function TISIndicator({ score, level, size = 'medium' }) {
  const color = getTISColor(level);
  const sizes = {
    small: { circle: 60, font: 18, label: 10 },
    medium: { circle: 100, font: 28, label: 12 },
    large: { circle: 140, font: 38, label: 14 },
  };
  const s = sizes[size] || sizes.medium;

  return (
    <div className="tis-gauge">
      <div
        className="tis-circle"
        style={{
          width: s.circle,
          height: s.circle,
          fontSize: s.font,
          background: `rgba(${color === '#ef4444' ? '239,68,68' : color === '#f59e0b' ? '245,158,11' : '34,197,94'}, 0.1)`,
          color: color,
          '--tis-color': color,
          '--tis-pct': score,
        }}
      >
        {score}
      </div>
      <span className={`tis-label ${level.toLowerCase()}`} style={{ fontSize: s.label }}>
        {level} Risk
      </span>
    </div>
  );
}
