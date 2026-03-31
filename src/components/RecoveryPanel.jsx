import { BarChart3, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function RecoveryPanel({ recoveryData }) {
  if (!recoveryData) return null;

  const { amountFrozen, recoverableAmount, totalSuspiciousAmount, remainingRisk, recoveryPercentage, breakdown, timeline } = recoveryData;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <BarChart3 size={16} className="icon" />
          Recovery Engine
        </div>
        <span className={`badge ${recoveryPercentage >= 70 ? 'badge-success' : recoveryPercentage >= 30 ? 'badge-warning' : 'badge-danger'}`}>
          {recoveryPercentage}% Recoverable
        </span>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Amount Frozen</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
            ₹{amountFrozen.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--success)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Recoverable</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
            ₹{recoverableAmount.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--warning)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Suspicious</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
            ₹{totalSuspiciousAmount.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, borderLeft: '3px solid var(--danger)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Remaining Risk</div>
          <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
            ₹{remainingRisk.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recovery Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Recovery Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: recoveryPercentage >= 70 ? 'var(--success)' : 'var(--warning)' }}>
            {recoveryPercentage}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${recoveryPercentage}%`,
              background: recoveryPercentage >= 70
                ? 'linear-gradient(90deg, var(--success), #34d399)'
                : recoveryPercentage >= 30
                  ? 'linear-gradient(90deg, var(--warning), #eab308)'
                  : 'linear-gradient(90deg, var(--danger), #f97316)',
            }}
          />
        </div>
      </div>

      {/* Recovery Timeline */}
      <div>
        <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Recovery Timeline
        </h4>
        <div className="timeline">
          {timeline.map((item, i) => (
            <div className="timeline-item" key={i}>
              <div className={`timeline-dot ${item.status}`}>
                {item.status === 'completed' ? <CheckCircle size={12} /> :
                  item.status === 'in-progress' ? <Clock size={12} /> :
                    <AlertTriangle size={10} />}
              </div>
              <div className="timeline-content">
                <h4>{item.step}</h4>
                <p>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
