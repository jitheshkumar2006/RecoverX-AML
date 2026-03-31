// ============================================================
// RecoverX — System Status Bar
// Top status indicator showing real-time system state
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useSystem, SYSTEM_PHASES } from '../context/SystemContext';
import { Activity, Shield, AlertTriangle, Search, BarChart3, Radio, Cpu, Zap } from 'lucide-react';

const PHASE_ICONS = {
  idle: Activity,
  monitoring: Radio,
  scanning: Cpu,
  alert: AlertTriangle,
  investigating: Search,
  recovery: BarChart3,
};

export default function SystemStatusBar() {
  const { systemPhase, systemMessages, processingSteps } = useSystem();
  const [showLog, setShowLog] = useState(false);
  const [dots, setDots] = useState('');
  const logRef = useRef(null);

  // Animated dots for active states
  useEffect(() => {
    if (systemPhase === SYSTEM_PHASES.IDLE) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [systemPhase]);

  const Icon = PHASE_ICONS[systemPhase.icon] || Activity;
  const isActive = systemPhase !== SYSTEM_PHASES.IDLE;
  const isAlert = systemPhase === SYSTEM_PHASES.FRAUD_DETECTED || systemPhase === SYSTEM_PHASES.ALERT_ESCALATION;

  return (
    <>
      <div
        className={`system-status-bar ${isAlert ? 'status-alert' : isActive ? 'status-active' : 'status-idle'}`}
        onClick={() => setShowLog(!showLog)}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 20px',
          background: isAlert
            ? 'linear-gradient(90deg, rgba(229,57,53,0.15), rgba(229,57,53,0.05))'
            : isActive
            ? 'linear-gradient(90deg, rgba(0,176,255,0.1), rgba(0,176,255,0.03))'
            : 'rgba(15,15,25,0.6)',
          borderBottom: `1px solid ${isAlert ? 'rgba(229,57,53,0.3)' : isActive ? 'rgba(0,176,255,0.2)' : 'var(--border-primary)'}`,
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          transition: 'all 0.4s ease',
          userSelect: 'none',
        }}
      >
        {/* Pulse indicator */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: systemPhase.color,
          boxShadow: `0 0 8px ${systemPhase.color}`,
          animation: isActive ? 'statusPulse 1.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />

        {/* Icon */}
        <Icon
          size={14}
          style={{
            color: systemPhase.color,
            animation: isActive ? 'spin 3s linear infinite' : 'none',
            flexShrink: 0,
          }}
        />

        {/* Label */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: systemPhase.color,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          flex: 1,
        }}>
          {systemPhase.label}{dots}
        </span>

        {/* Processing steps count */}
        {processingSteps.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
            background: 'var(--bg-void)',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            {processingSteps.length} steps
          </span>
        )}

        {/* Recent messages count */}
        {systemMessages.length > 0 && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-muted)',
          }}>
            {systemMessages.length} events ▾
          </span>
        )}

        {/* Time */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-muted)',
        }}>
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Expandable log */}
      {showLog && systemMessages.length > 0 && (
        <div
          ref={logRef}
          style={{
            position: 'sticky',
            top: 37,
            zIndex: 99,
            maxHeight: 200,
            overflow: 'auto',
            background: 'rgba(10,10,20,0.95)',
            borderBottom: '1px solid var(--border-primary)',
            padding: '8px 20px',
            animation: 'slideIn 0.2s ease-out',
          }}
        >
          {systemMessages.slice(0, 20).map(msg => (
            <div key={msg.id} style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                background: msg.type === 'danger' ? 'var(--neon-red)' : msg.type === 'warning' ? 'var(--neon-amber)' : 'var(--neon-blue)',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: msg.type === 'danger' ? 'var(--neon-red)' : 'var(--text-secondary)',
              }}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}
