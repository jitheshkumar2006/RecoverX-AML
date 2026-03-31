import { useState } from 'react';
import { CheckCircle, Clock, Send, Shield, Radio } from 'lucide-react';

export default function AlertStatus({ alertData, onSimulate }) {
  const [steps, setSteps] = useState(alertData?.steps || []);
  const [simulating, setSimulating] = useState(false);
  const [overallStatus, setOverallStatus] = useState('pending');

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    setOverallStatus('sending');

    const newSteps = [...steps];
    newSteps[0] = { ...newSteps[0], status: 'completed' };
    newSteps[1] = { ...newSteps[1], status: 'in-progress' };
    setSteps([...newSteps]);

    const delays = [
      { idx: 1, status: 'completed', next: 2, overall: 'encrypting' },
      { idx: 2, status: 'completed', next: 3, overall: 'sending' },
      { idx: 3, status: 'completed', next: 4, overall: 'received' },
      { idx: 4, status: 'completed', next: -1, overall: 'blocked' },
    ];

    for (const { idx, status, next, overall } of delays) {
      await new Promise(r => setTimeout(r, 2000));
      newSteps[idx] = { ...newSteps[idx], status };
      if (next >= 0 && next < newSteps.length) {
        newSteps[next] = { ...newSteps[next], status: 'in-progress' };
      }
      setSteps([...newSteps]);
      setOverallStatus(overall);
    }

    setSimulating(false);
    if (onSimulate) onSimulate();
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <Radio size={16} className="icon" />
          Cross-Bank Alert
        </div>
        <span className={`badge ${overallStatus === 'blocked' ? 'badge-success' : overallStatus === 'pending' ? 'badge-info' : 'badge-warning'}`}>
          {overallStatus === 'blocked' ? 'Completed' : overallStatus === 'pending' ? 'Ready' : 'In Progress'}
        </span>
      </div>

      {alertData && (
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-primary)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Target Bank</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{alertData.targetBank}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{alertData.message}</div>
        </div>
      )}

      <div className="timeline">
        {steps.map((step, i) => (
          <div className="timeline-item" key={i}>
            <div className={`timeline-dot ${step.status}`}>
              {step.status === 'completed' ? <CheckCircle size={12} /> :
                step.status === 'in-progress' ? <Clock size={12} /> :
                  <Shield size={10} />}
            </div>
            <div className="timeline-content">
              <h4>{step.step}</h4>
              <p>{step.time}</p>
            </div>
          </div>
        ))}
      </div>

      {overallStatus === 'blocked' && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8, border: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Account blocked in target bank successfully</span>
        </div>
      )}

      {overallStatus === 'pending' && (
        <button className="btn btn-primary" onClick={handleSimulate} style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
          <Send size={14} />
          Send Alert
        </button>
      )}

      {simulating && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, color: 'var(--text-secondary)' }}>
          <div className="spinner" />
          <span style={{ fontSize: 13 }}>Processing...</span>
        </div>
      )}
    </div>
  );
}
