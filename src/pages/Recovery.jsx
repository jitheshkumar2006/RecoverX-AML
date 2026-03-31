import { useState, useEffect, useMemo } from 'react';
import { getAccounts } from '../services/mockData';
import { calculateRecovery, freezeAccount } from '../services/recoveryEngine';
import { sendCrossBankAlert } from '../services/crossBankAlert';
import { useSystem, SYSTEM_PHASES } from '../context/SystemContext';
import RecoveryPanel from '../components/RecoveryPanel';
import AlertStatus from '../components/AlertStatus';
import { BarChart3, Snowflake, Radio, CheckCircle, Shield, Zap } from 'lucide-react';

export default function Recovery() {
  const sys = useSystem();
  const [accounts, setAccounts] = useState(getAccounts());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [alertData, setAlertData] = useState(null);

  // ─── Auto-recovery state ──────────────────────────────────
  const [autoRecoverySteps, setAutoRecoverySteps] = useState([]);
  const [autoRecoveryDone, setAutoRecoveryDone] = useState(false);

  const frozenAccounts = useMemo(() => accounts.filter(a => a.status === 'frozen'), [accounts]);
  const suspiciousAccounts = useMemo(() => accounts.filter(a => a.tis >= 50 && a.status !== 'frozen'), [accounts]);
  const recoveryData = useMemo(() => selectedAccount ? calculateRecovery(selectedAccount) : null, [selectedAccount, accounts]);

  // ─── System phase ─────────────────────────────────────────
  useEffect(() => {
    sys.transitionPhase(SYSTEM_PHASES.RECOVERY, 'Recovery Center active');
    return () => sys.transitionPhase(SYSTEM_PHASES.IDLE);
  }, []);

  // ─── Requirement #4: Auto-trigger recovery from Investigation ──
  useEffect(() => {
    if (sys.recoveryStatus && sys.recoveryStatus.status === 'in_progress') {
      const acctId = sys.recoveryStatus.accountId;
      setSelectedAccount(acctId);

      // Auto-run recovery steps with delays
      const steps = [
        { label: 'Account freeze confirmed', icon: '❄️', delay: 800 },
        { label: 'Tracing fund flow across accounts…', icon: '🔍', delay: 2000 },
        { label: 'Cross-bank alert dispatched to partner banks', icon: '📡', delay: 3500 },
        { label: 'SAR report generated for RBI submission', icon: '📋', delay: 5000 },
        { label: 'Recovery pipeline complete — funds secured', icon: '✅', delay: 6500 },
      ];

      steps.forEach(({ label, icon, delay }, i) => {
        setTimeout(() => {
          setAutoRecoverySteps(prev => [...prev, { label, icon, timestamp: new Date().toLocaleTimeString() }]);
          sys.addSystemMessage(`Recovery: ${label}`, i === steps.length - 1 ? 'info' : 'warning');
          if (sys.updateRecoveryStep && i < 4) {
            sys.updateRecoveryStep(i, 'completed');
          }
        }, delay);
      });

      setTimeout(() => {
        setAutoRecoveryDone(true);
        sys.transitionPhase(SYSTEM_PHASES.IDLE, 'Recovery pipeline complete');
      }, 7000);
    }
  }, [sys.recoveryStatus]);

  const handleFreeze = (accountId) => {
    freezeAccount(accountId);
    setAccounts(getAccounts());
    if (!selectedAccount) setSelectedAccount(accountId);
    sys.addSystemMessage(`Account ${accountId} frozen from Recovery page`, 'warning');
  };

  const handleSendAlert = () => {
    if (!selectedAccount) return;
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;
    const result = sendCrossBankAlert(selectedAccount, account.name, 'Partner Bank Network', `High-risk account ${selectedAccount} (${account.name}) detected. Requesting immediate block.`);
    setAlertData(result);
    sys.addSystemMessage(`Cross-bank alert sent for ${selectedAccount}`, 'info');
  };

  return (
    <div>
      <div className="page-header">
        <h2>Recovery Center</h2>
        <p>Fund recovery analysis and cross-bank coordination</p>
      </div>

      {/* ─── Auto-Recovery Progress (from Investigation flow) ─── */}
      {sys.recoveryStatus && !autoRecoveryDone && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,200,83,0.3)' }}>
          <div className="card-header">
            <div className="card-title"><Zap size={16} className="icon" /> Recovery Pipeline Active</div>
            <span className="badge badge-success" style={{ animation: 'statusPulse 1.5s infinite' }}>PROCESSING</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
              Target: <strong style={{ color: 'var(--text-primary)' }}>{sys.recoveryStatus.accountName}</strong> ({sys.recoveryStatus.accountId})
            </div>
            {autoRecoverySteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', animation: 'fadeIn 0.4s ease' }}>
                <span style={{ fontSize: 14 }}>{step.icon}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{step.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{step.timestamp}</span>
              </div>
            ))}
            {autoRecoverySteps.length < 5 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 14, height: 14, border: '2px solid var(--neon-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--neon-green)' }}>Processing next step…</span>
              </div>
            )}
          </div>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } } @keyframes spin { to { transform: rotate(360deg); } } @keyframes statusPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

      {autoRecoveryDone && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(0,200,83,0.3)', textAlign: 'center', padding: 24 }}>
          <Shield size={40} style={{ color: 'var(--neon-green)', marginBottom: 12 }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, letterSpacing: 2, color: 'var(--neon-green)', marginBottom: 6 }}>RECOVERY COMPLETE</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            All recovery steps executed for {sys.recoveryStatus?.accountName}. Funds secured. SAR report generated.
          </div>
        </div>
      )}

      {/* Account Selection */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Snowflake size={16} className="icon" /> Frozen Accounts</div>
            <span className="badge badge-frozen">{frozenAccounts.length}</span>
          </div>
          {frozenAccounts.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No frozen accounts.</p></div>
          ) : (
            <div className="account-select-list">
              {frozenAccounts.map(acc => (
                <div key={acc.id} className={`account-select-item ${selectedAccount === acc.id ? 'selected' : ''}`} onClick={() => setSelectedAccount(acc.id)}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{acc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{acc.id} • {acc.bank}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>₹{acc.balance.toLocaleString()}</div>
                    <span className="badge badge-frozen">Frozen</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={16} className="icon" /> Suspicious (Unblocked)</div>
            <span className="badge badge-warning">{suspiciousAccounts.length}</span>
          </div>
          <div className="account-select-list">
            {suspiciousAccounts.map(acc => (
              <div key={acc.id} className="account-select-item">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{acc.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{acc.id} • TIS: {acc.tis}</div>
                </div>
                <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleFreeze(acc.id)}>
                  <Snowflake size={12} /> Freeze
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedAccount && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <RecoveryPanel recoveryData={recoveryData} />
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><div className="card-title"><Radio size={16} className="icon" /> Cross-Bank Alert</div></div>
              {!alertData ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Send alert to partner banks to block related accounts.</p>
                  <button className="btn btn-primary" onClick={handleSendAlert} style={{ width: '100%', justifyContent: 'center' }}><Radio size={14} /> Send Cross-Bank Alert</button>
                </div>
              ) : (<AlertStatus alertData={alertData} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
