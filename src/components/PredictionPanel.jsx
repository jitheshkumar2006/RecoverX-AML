import { TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react';

export default function PredictionPanel({ prediction, accountName }) {
  if (!prediction || !prediction.predictedAccount) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={16} className="icon" />
            Future Movement Prediction
          </div>
        </div>
        <div className="empty-state" style={{ padding: 20 }}>
          <p>No prediction available for this account.</p>
        </div>
      </div>
    );
  }

  const { predictedAccount, predictedAccountName, predictedBank, confidence, reasoning, riskLevel, predictedAmount, alternatives } = prediction;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <TrendingUp size={16} className="icon" />
          Future Movement Prediction
        </div>
        <span className={`badge ${riskLevel === 'High' ? 'badge-danger' : riskLevel === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
          {riskLevel} Risk
        </span>
      </div>

      {/* Prediction Flow */}
      <div className="prediction-arrow">
        <div className="prediction-node source">
          {accountName || 'Source'}
        </div>
        <div className="prediction-connector">
          <ArrowRight size={20} />
          <span>₹{predictedAmount.toLocaleString()}</span>
          <ArrowRight size={20} />
        </div>
        <div className="prediction-node target">
          <AlertTriangle size={14} style={{ marginBottom: 4 }} />
          <div>{predictedAccountName}</div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{predictedBank}</div>
        </div>
      </div>

      {/* Confidence */}
      <div style={{ marginBottom: 12 }}>
        <div className="confidence-meter">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 80 }}>Confidence</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${confidence}%`,
                background: confidence >= 70 ? 'var(--danger)' : confidence >= 40 ? 'var(--warning)' : 'var(--success)',
              }}
            />
          </div>
          <span className="confidence-value" style={{ color: confidence >= 70 ? 'var(--danger)' : confidence >= 40 ? 'var(--warning)' : 'var(--success)' }}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <div style={{ padding: 10, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{reasoning}</p>
      </div>

      {/* Alternatives */}
      {alternatives && alternatives.length > 0 && (
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Alternative Destinations
          </h4>
          {alternatives.map((alt, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alt.accountName} ({alt.accountId})</span>
              <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{alt.confidence}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
