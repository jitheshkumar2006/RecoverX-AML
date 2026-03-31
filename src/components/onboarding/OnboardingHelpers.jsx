import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, XCircle, Clock, User, Cpu, Mail, Activity, Zap,
  Shield, ChevronRight,
} from 'lucide-react';

// ─── Check status icon ────────────────────────────────────
export function CheckIcon({ status, size = 16 }) {
  if (status === 'clean')   return <CheckCircle   size={size} style={{ color: 'var(--neon-green)'  }} />;
  if (status === 'warning') return <AlertTriangle size={size} style={{ color: 'var(--neon-amber)'  }} />;
  if (status === 'risk')    return <XCircle       size={size} style={{ color: 'var(--neon-red)'    }} />;
  return <Clock size={size} style={{ color: 'var(--text-muted)' }} />;
}

// ─── Step Progress Bar ────────────────────────────────────
const STEP_LABELS = ['Personal Info', 'Identity & KYC', 'Risk Scan', 'Decision', 'Verification'];

export function StepProgress({ currentIdx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {STEP_LABELS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 'auto' : 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
            background: i <= currentIdx ? 'rgba(229,57,53,0.12)' : i === currentIdx + 1 ? 'rgba(229,57,53,0.05)' : 'var(--bg-secondary)',
            border: `1px solid ${i <= currentIdx ? 'rgba(229,57,53,0.3)' : 'var(--border-primary)'}`,
            transition: 'all 0.4s ease',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: i < currentIdx ? 'var(--neon-green)' : i === currentIdx ? 'var(--neon-red)' : 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: i <= currentIdx ? '#fff' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
            }}>
              {i < currentIdx ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase',
              letterSpacing: 0.8, color: i <= currentIdx ? 'var(--neon-red)' : 'var(--text-muted)',
            }}>{label}</span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div style={{
              flex: 1, height: 2, minWidth: 16,
              background: i < currentIdx ? 'var(--neon-red)' : 'var(--border-primary)',
              transition: 'background 0.4s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Animated scan check row ──────────────────────────────
export function ScanRow({ label, icon: Icon, done, status, delay, result }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const borderColor = done
    ? status === 'risk' ? 'rgba(229,57,53,0.25)' : status === 'warning' ? 'rgba(245,124,0,0.2)' : 'rgba(0,200,83,0.2)'
    : 'var(--border-primary)';
  const iconBg = done
    ? status === 'risk' ? 'rgba(229,57,53,0.12)' : status === 'warning' ? 'rgba(245,124,0,0.1)' : 'rgba(0,200,83,0.1)'
    : 'rgba(255,255,255,0.04)';
  const iconColor = done
    ? status === 'risk' ? 'var(--neon-red)' : status === 'warning' ? 'var(--neon-amber)' : 'var(--neon-green)'
    : 'var(--text-muted)';

  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, background: 'var(--bg-void)',
      border: `1px solid ${borderColor}`, transition: 'all 0.4s ease',
      opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)',
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, flexShrink: 0 }}>
          <Icon size={15} />
        </div>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>{label}</span>
        {done ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: iconColor }}>{result?.score}/{result?.maxScore}</span>
            <CheckIcon status={status} size={16} />
          </div>
        ) : (
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--neon-red)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        )}
      </div>
      {done && result?.flags?.length > 0 && (
        <div style={{ marginTop: 8, paddingLeft: 44 }}>
          {result.flags.map((f, i) => <FlagRow key={i} flag={f} compact />)}
        </div>
      )}
    </div>
  );
}

// ─── Flag row ─────────────────────────────────────────────
export function FlagRow({ flag, compact }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: compact ? '4px 8px' : '7px 10px',
      borderRadius: 6, background: 'rgba(229,57,53,0.06)',
      border: '1px solid rgba(229,57,53,0.15)', marginBottom: 4,
    }}>
      <AlertTriangle size={compact ? 11 : 13} style={{ color: 'var(--neon-red)', flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: compact ? 10 : 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{flag}</span>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────
export function ScoreBar({ score, max, color }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div style={{ height: 6, background: 'var(--bg-void)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ height: '100%', borderRadius: 10, width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}`, transition: 'width 0.8s ease' }} />
    </div>
  );
}

// ─── Demo Scenario Selector ───────────────────────────────
export function DemoScenarioPanel({ scenarios, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card" style={{ marginBottom: 16, border: '1px solid rgba(213,0,249,0.2)' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '2px 0' }}
      >
        <div className="card-title" style={{ fontSize: 10 }}>
          <Zap size={14} style={{ color: 'var(--neon-purple)' }} /> Demo Scenarios
        </div>
        <span className="badge badge-purple">
          {expanded ? 'Hide' : 'Quick Fill'}
        </span>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {Object.entries(scenarios).map(([key, s]) => (
            <button
              key={key}
              onClick={() => onSelect(s.form)}
              style={{
                padding: '10px 12px', borderRadius: 8, background: 'var(--bg-void)', cursor: 'pointer',
                border: `1px solid ${s.color}33`, textAlign: 'left', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 0 12px ${s.color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}33`; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>{s.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module icons map ─────────────────────────────────────
export const MODULE_ICONS = {
  identity: User, device: Cpu, telecom: Mail, velocity: Activity, behavior: Zap,
};
export const MODULE_LABELS = {
  identity: 'Identity Intelligence', device: 'Device Intelligence',
  telecom: 'Telecom & Email Intel', velocity: 'Velocity Check', behavior: 'Behavioral Signals',
};

export const scoreColor = (s) => s >= 61 ? 'var(--neon-red)' : s >= 31 ? 'var(--neon-amber)' : 'var(--neon-green)';
export const checkColor = (status) => status === 'risk' ? 'var(--neon-red)' : status === 'warning' ? 'var(--neon-amber)' : 'var(--neon-green)';
