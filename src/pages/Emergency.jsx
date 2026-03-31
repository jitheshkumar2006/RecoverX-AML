import { useState, useMemo } from 'react';
import { getAccounts, getTransactionsForAccount } from '../services/mockData';
import { investigate } from '../services/iseEngine';
import { freezeAccount } from '../services/recoveryEngine';
import { getNetworkData } from '../services/graphEngine';
import GraphVisualization from '../components/GraphVisualization';
import TISIndicator from '../components/TISIndicator';
import ISEPanel from '../components/ISEPanel';
import { AlertTriangle, Snowflake, CheckCircle, Search, Shield, ArrowRight } from 'lucide-react';

export default function Emergency() {
  const [step, setStep] = useState(0); // 0=select, 1=scanning, 2=results
  const [selectedAccount, setSelectedAccount] = useState('');
  const [accounts, setAccounts] = useState(getAccounts());
  const [iseData, setIseData] = useState(null);
  const [frozen, setFrozen] = useState(false);
  const networkData = useMemo(() => getNetworkData(), [accounts]);

  const handleEmergency = () => {
    if (!selectedAccount) return;
    setStep(1);
    // Simulate scanning delay
    setTimeout(() => {
      const data = investigate(selectedAccount);
      setIseData(data);
      setStep(2);
    }, 2000);
  };

  const handleFreeze = () => {
    freezeAccount(selectedAccount);
    setAccounts(getAccounts());
    setFrozen(true);
  };

  const steps = [
    { label: 'Report Scam', done: step >= 1 },
    { label: 'Scan Transactions', done: step >= 2 },
    { label: 'Build Graph', done: step >= 2 },
    { label: 'ISE Analysis', done: step >= 2 },
    { label: 'Decision', done: frozen },
    { label: 'Recovery', done: frozen },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={28} /> Emergency Response
        </h2>
        <p>Rapid fraud response — scan, analyze, and freeze in seconds</p>
      </div>

      {/* Progress Steps */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: s.done ? 'var(--success)' : step === i ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: 'white', fontSize: 12, fontWeight: 600,
              }}>
                {s.done ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: s.done ? 'var(--success)' : 'var(--text-secondary)' }}>{s.label}</span>
              {i < steps.length - 1 && <ArrowRight size={14} style={{ color: 'var(--text-muted)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 0: Select Account */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 40 }}>
          <AlertTriangle size={56} style={{ color: 'var(--danger)', marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Report a Scam</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Select the affected account. We'll immediately scan transactions, build a graph, and run ISE analysis.
          </p>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Your Account</label>
            <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">Select your account...</option>
              {accounts.filter(a => a.status !== 'frozen').map(acc => (
                <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} ({acc.bank})</option>
              ))}
            </select>
          </div>
          <button className="btn btn-emergency" onClick={handleEmergency} disabled={!selectedAccount}>
            <AlertTriangle size={18} /> I Got Scammed — Start Emergency Scan
          </button>
        </div>
      )}

      {/* Step 1: Scanning */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 20px', borderWidth: 3 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Scanning...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Fetching transactions, building graph, running ISE analysis...</p>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 2 && iseData && (
        <div>
          {frozen && (
            <div style={{ padding: 16, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--success)' }}>Account Frozen Successfully</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>All outgoing transactions have been blocked.</div>
              </div>
            </div>
          )}

          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><div className="card-title"><Search size={16} className="icon" /> Transaction Network</div></div>
              <GraphVisualization nodes={networkData.nodes} edges={networkData.edges} selectedNode={selectedAccount} height="350px" />
            </div>
            <div>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><div className="card-title"><Shield size={16} className="icon" /> Threat Score</div></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <TISIndicator score={iseData.tis.score} level={iseData.tis.level} />
                </div>
              </div>
              {!frozen && (
                <button className="btn btn-danger" onClick={handleFreeze} style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}>
                  <Snowflake size={18} /> Freeze Account Now
                </button>
              )}
            </div>
          </div>
          <ISEPanel iseData={iseData} onFreeze={handleFreeze} onMonitor={() => {}} />
        </div>
      )}
    </div>
  );
}
