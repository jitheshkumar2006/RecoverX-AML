import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAccounts } from '../services/mockData';
import { getNetworkData } from '../services/graphEngine';
import { investigate } from '../services/iseEngine';
import { calculateTIS } from '../services/tisEngine';
import { predictNextMovement } from '../services/predictionEngine';
import { freezeAccount } from '../services/recoveryEngine';
import { useSystem, SYSTEM_PHASES } from '../context/SystemContext';
import GraphVisualization from '../components/GraphVisualization';
import TISIndicator from '../components/TISIndicator';
import ISEPanel from '../components/ISEPanel';
import PredictionPanel from '../components/PredictionPanel';
import CopilotPanel from '../components/CopilotPanel';
import { Search, Users, Shield, Snowflake, Eye, CheckCircle, AlertTriangle, Zap, XCircle } from 'lucide-react';

export default function Investigation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sys = useSystem();
  const initialAccount = searchParams.get('account') || '';
  const fromAlert = searchParams.get('fromAlert') === 'true';
  const [selectedAccount, setSelectedAccount] = useState(initialAccount);
  const [accounts, setAccounts] = useState(getAccounts());
  const [networkData, setNetworkData] = useState(getNetworkData());
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(false);

  // ─── Auto-investigation state ─────────────────────────────
  const [autoInvestigating, setAutoInvestigating] = useState(false);
  const [autoSteps, setAutoSteps] = useState([]);
  const [showMarkFraud, setShowMarkFraud] = useState(false);
  const [markingFraud, setMarkingFraud] = useState(false);
  const [fraudMarked, setFraudMarked] = useState(false);

  const iseData = useMemo(() => selectedAccount ? investigate(selectedAccount) : null, [selectedAccount, accounts]);
  const tisData = useMemo(() => selectedAccount ? calculateTIS(selectedAccount) : null, [selectedAccount, accounts]);
  const prediction = useMemo(() => selectedAccount ? predictNextMovement(selectedAccount) : null, [selectedAccount, accounts]);
  const selectedAccountData = useMemo(() => accounts.find(a => a.id === selectedAccount), [selectedAccount, accounts]);

  // ─── Set system phase ─────────────────────────────────────
  useEffect(() => {
    sys.transitionPhase(SYSTEM_PHASES.INVESTIGATION, 'Investigation Center active');
    return () => sys.transitionPhase(SYSTEM_PHASES.IDLE);
  }, []);

  // ─── Auto-investigation from alert (Requirement #3) ────────
  useEffect(() => {
    if (fromAlert && selectedAccount) {
      setAutoInvestigating(true);
      sys.addSystemMessage(`Auto-investigation started for ${selectedAccount}`, 'warning');

      const steps = [
        { label: 'Loading account data…', delay: 800 },
        { label: 'Running graph analysis…', delay: 1600 },
        { label: 'Computing Threat Intelligence Score…', delay: 2400 },
        { label: 'Running prediction engine…', delay: 3200 },
        { label: 'Investigation ready — review recommended', delay: 4000 },
      ];

      steps.forEach(({ label, delay }) => {
        setTimeout(() => {
          setAutoSteps(prev => [...prev, label]);
        }, delay);
      });

      setTimeout(() => {
        setAutoInvestigating(false);
        setShowMarkFraud(true);
        sys.addSystemMessage('Auto-investigation complete — Mark as Fraud available', 'info');
      }, 4500);
    }
  }, [fromAlert, selectedAccount]);

  const handleNodeSelect = useCallback((nodeId) => {
    setSelectedAccount(nodeId);
    setFreezeSuccess(false);
  }, []);

  const handleFreeze = useCallback(() => {
    if (!selectedAccount) return;
    setFreezeLoading(true);
    setTimeout(() => {
      freezeAccount(selectedAccount);
      setAccounts(getAccounts());
      setNetworkData(getNetworkData());
      setFreezeLoading(false);
      setFreezeSuccess(true);
      sys.addSystemMessage(`Account ${selectedAccount} frozen`, 'warning');
    }, 1000);
  }, [selectedAccount]);

  // ─── Requirement #4: Mark as Fraud → Recovery ─────────────
  const handleMarkFraud = () => {
    setMarkingFraud(true);
    sys.transitionPhase(SYSTEM_PHASES.RECOVERY, `Fraud confirmed for ${selectedAccount} — triggering recovery`);
    sys.addSystemMessage(`Account ${selectedAccount} marked as FRAUD — initiating recovery`, 'danger');

    // Auto-freeze first
    if (selectedAccountData && selectedAccountData.status !== 'frozen') {
      freezeAccount(selectedAccount);
      setAccounts(getAccounts());
    }

    // Show recovery steps with delays
    const steps = [
      { label: 'Freezing account…', delay: 500 },
      { label: 'Tracing fund flow…', delay: 1500 },
      { label: 'Notifying partner banks…', delay: 2500 },
      { label: 'Recovery engine activated', delay: 3500 },
    ];

    steps.forEach(({ label, delay }) => {
      setTimeout(() => {
        setAutoSteps(prev => [...prev, `🔴 ${label}`]);
      }, delay);
    });

    // Initiate recovery in system context
    sys.initiateRecovery(selectedAccount, selectedAccountData?.name || 'Unknown');

    // Navigate to recovery after steps
    setTimeout(() => {
      setFraudMarked(true);
      setTimeout(() => navigate('/recovery'), 1500);
    }, 4000);
  };

  const handleMonitor = useCallback(() => {
    sys.addSystemMessage(`Account ${selectedAccount} set to enhanced monitoring`, 'info');
  }, [selectedAccount]);

  return (
    <div>
      <div className="page-header">
        <h2>Investigation Center</h2>
        <p>Graph analysis, threat intelligence, and automated investigation</p>
      </div>

      {/* ─── Auto-investigation progress ─── */}
      {autoInvestigating && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(229,57,53,0.3)' }}>
          <div className="card-header">
            <div className="card-title"><Zap size={16} className="icon" /> Auto-Investigation Running</div>
            <span className="badge badge-danger" style={{ animation: 'statusPulse 1.5s infinite' }}>LIVE</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {autoSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', animation: 'fadeIn 0.3s ease' }}>
                <CheckCircle size={12} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{step}</span>
              </div>
            ))}
            {autoSteps.length < 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 12, height: 12, border: '2px solid var(--neon-amber)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--neon-amber)' }}>Processing…</span>
              </div>
            )}
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } } @keyframes spin { to { transform: rotate(360deg); } } @keyframes statusPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

      {/* ─── Mark as Fraud banner ─── */}
      {showMarkFraud && !fraudMarked && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(229,57,53,0.4)', background: 'rgba(229,57,53,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={20} style={{ color: 'var(--neon-red)' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--neon-red)', letterSpacing: 1 }}>CASE ESCALATED BY SYSTEM</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Investigation auto-complete. Confirm fraud to trigger recovery pipeline.</div>
              </div>
            </div>
            <button className="btn btn-danger" onClick={handleMarkFraud} disabled={markingFraud} style={{ padding: '10px 20px', fontSize: 13, letterSpacing: 1 }}>
              {markingFraud ? <><div className="spinner" /> Processing…</> : <><XCircle size={14} /> Mark as Fraud → Recovery</>}
            </button>
          </div>
          {markingFraud && (
            <div style={{ marginTop: 12, padding: '8px 0' }}>
              {autoSteps.filter(s => s.startsWith('🔴')).map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0', animation: 'fadeIn 0.3s ease' }}>
                  <CheckCircle size={12} style={{ color: 'var(--neon-red)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{step.replace('🔴 ', '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {fraudMarked && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,200,83,0.3)', textAlign: 'center', padding: 20 }}>
          <CheckCircle size={32} style={{ color: 'var(--neon-green)', marginBottom: 8 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--neon-green)', letterSpacing: 2 }}>FRAUD CONFIRMED — REDIRECTING TO RECOVERY</div>
        </div>
      )}

      {/* Account Selector */}
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <select className="form-select" style={{ maxWidth: 350 }} value={selectedAccount} onChange={e => { setSelectedAccount(e.target.value); setFreezeSuccess(false); }}>
            <option value="">Select an account to investigate...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} ({acc.bank}) {acc.status === 'frozen' ? '❄️ FROZEN' : ''} {acc.tis >= 70 ? '🔴' : acc.tis >= 40 ? '🟡' : '🟢'}</option>
            ))}
          </select>
          {selectedAccountData && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${selectedAccountData.status === 'frozen' ? 'badge-frozen' : 'badge-info'}`}>
                {selectedAccountData.status === 'frozen' ? '❄️ Frozen' : '● Active'}
              </span>
              {freezeSuccess && <span className="badge badge-success" style={{ animation: 'fadeIn 0.3s ease' }}><CheckCircle size={12} /> Account Frozen</span>}
            </div>
          )}
        </div>
      </div>

      {/* Graph + TIS */}
      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title"><Users size={16} className="icon" /> Transaction Network</div></div>
          <GraphVisualization nodes={networkData.nodes} edges={networkData.edges} onNodeSelect={handleNodeSelect} selectedNode={selectedAccount} height="420px" />
        </div>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title"><Shield size={16} className="icon" /> Threat Intelligence Score</div></div>
            {tisData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><TISIndicator score={tisData.score} level={tisData.level} /></div>
                {tisData.factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: f.score > f.max * 0.6 ? 'var(--danger)' : 'var(--text-primary)' }}>{f.score}/{f.max}</span>
                  </div>
                ))}
              </div>
            ) : (<div className="empty-state" style={{ padding: 20 }}><p>Select an account to view TIS</p></div>)}
          </div>
          {selectedAccountData && selectedAccountData.status !== 'frozen' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={handleFreeze} disabled={freezeLoading} style={{ flex: 1, justifyContent: 'center' }}>
                {freezeLoading ? <div className="spinner" /> : <Snowflake size={14} />} Initiate Core Freeze
              </button>
              <button className="btn btn-warning" onClick={handleMonitor} style={{ flex: 1, justifyContent: 'center' }}><Eye size={14} /> Monitor Focus</button>
            </div>
          )}
        </div>
      </div>

      {/* ISE + Prediction + Copilot */}
      {selectedAccount && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <ISEPanel iseData={iseData} onFreeze={handleFreeze} onMonitor={handleMonitor} loading={freezeLoading} />
          <PredictionPanel prediction={prediction} accountName={selectedAccountData?.name} />
          <CopilotPanel account={selectedAccountData} />
        </div>
      )}
    </div>
  );
}
