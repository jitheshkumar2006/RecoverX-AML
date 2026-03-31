import { Shield, AlertTriangle, ArrowRight, Snowflake, Eye } from 'lucide-react';

export default function ISEPanel({ iseData, onFreeze, onMonitor, loading = false }) {
  if (!iseData) return null;

  const { suspicionReasons, graphInsights, tis, suggestedAction, actionConfidence, actionReasoning } = iseData;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Shield size={16} className="icon" />
          Investigation Support Engine (ISE)
        </div>
        <span className={`badge ${suggestedAction === 'Freeze' ? 'badge-danger' : 'badge-warning'}`}>
          {suggestedAction === 'Freeze' ? <Snowflake size={12} /> : <Eye size={12} />}
          Suggests: {suggestedAction}
        </span>
      </div>

      {/* Suspicion Reasons */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
          Suspicion Reasons
        </h4>
        <ul className="ise-reasons">
          {suspicionReasons.map((reason, i) => (
            <li key={i}>{reason}</li>
          ))}
          {suspicionReasons.length === 0 && (
            <li style={{ borderColor: 'var(--success)', background: 'rgba(34, 197, 94, 0.05)' }}>
              No suspicious activity detected
            </li>
          )}
        </ul>
      </div>

      {/* Graph Insights */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
          Graph Insights
        </h4>
        <ul className="ise-reasons ise-insights">
          {graphInsights.map((insight, i) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Confidence & Reasoning */}
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
        <div className="confidence-meter" style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Action Confidence</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${actionConfidence}%`,
                background: actionConfidence >= 70 ? 'var(--danger)' : actionConfidence >= 40 ? 'var(--warning)' : 'var(--success)',
              }}
            />
          </div>
          <span className="confidence-value" style={{ color: actionConfidence >= 70 ? 'var(--danger)' : actionConfidence >= 40 ? 'var(--warning)' : 'var(--success)' }}>
            {actionConfidence}%
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{actionReasoning}</p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn btn-danger"
          onClick={onFreeze}
          disabled={loading}
          style={{ flex: 1 }}
        >
          <Snowflake size={14} />
          Freeze Account
        </button>
        <button
          className="btn btn-warning"
          onClick={onMonitor}
          disabled={loading}
          style={{ flex: 1 }}
        >
          <Eye size={14} />
          Monitor Account
        </button>
      </div>
    </div>
  );
}
