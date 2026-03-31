import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccounts, getAlerts } from '../services/mockData';
import { sendCrossBankAlert } from '../services/crossBankAlert';
import { useSystem, SYSTEM_PHASES } from '../context/SystemContext';
import AlertStatus from '../components/AlertStatus';
import { Bell, Radio, Send, CheckCircle, AlertTriangle, Search, Clock, Zap } from 'lucide-react';

export default function Alerts() {
  const navigate = useNavigate();
  const sys = useSystem();
  const [accounts] = useState(getAccounts());
  const [alerts, setAlerts] = useState(getAlerts());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [targetBank, setTargetBank] = useState('');
  const [newAlertData, setNewAlertData] = useState(null);

  // ─── Auto-escalation state ────────────────────────────────
  const [escalating, setEscalating] = useState(null);
  const [escalateCountdown, setEscalateCountdown] = useState(0);

  // ─── System phase ─────────────────────────────────────────
  useEffect(() => {
    if (sys.alerts.length > 0) {
      sys.transitionPhase(SYSTEM_PHASES.ALERT_ESCALATION, 'Alert page — reviewing system-generated alerts');
    }
  }, []);

  // ─── Requirement #3: Auto-escalate alert to Investigation ──
  const handleAlertClick = (alert) => {
    setEscalating(alert);
    sys.transitionPhase(SYSTEM_PHASES.ALERT_ESCALATION, `Alert ${alert.id || 'SYS'} opened — auto-escalating to Investigation`);
    sys.addSystemMessage('Case escalated by system — routing to Investigation', 'warning');

    // Create case in system context
    sys.createCase({
      alertId: alert.id,
      accountName: alert.accountName || alert.accountId || 'Unknown',
      riskScore: alert.riskScore || 0,
      reason: alert.reason || alert.message || 'Suspicious activity',
      flags: alert.flags || [],
      sourceAlert: alert,
    });

    let cd = 3;
    setEscalateCountdown(cd);
    const iv = setInterval(() => {
      cd--;
      setEscalateCountdown(cd);
      if (cd <= 0) {
        clearInterval(iv);
        // Navigate to investigation with alert context
        const accountParam = alert.accountId || alert.sourceAccount || '';
        navigate(`/investigation?account=${accountParam}&fromAlert=true`);
      }
    }, 1000);
  };

  const handleSendAlert = () => {
    if (!selectedAccount || !targetBank) return;
    const account = accounts.find(a => a.id === selectedAccount);
    const result = sendCrossBankAlert(selectedAccount, account?.name || '', targetBank, `Suspicious activity alert for ${selectedAccount}. Requesting immediate review and block.`);
    setNewAlertData(result);
    sys.addSystemMessage(`Cross-bank alert sent: ${selectedAccount} → ${targetBank}`, 'info');
  };

  // ─── Escalation overlay ───────────────────────────────────
  if (escalating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div>
          <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px', background: 'rgba(229,57,53,0.1)', border: '2px solid rgba(229,57,53,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tisRingPulse 1.5s ease-in-out infinite' }}>
            <Search size={36} style={{ color: 'var(--neon-red)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, letterSpacing: 2, color: 'var(--neon-red)', marginBottom: 8 }}>
            CASE ESCALATED BY SYSTEM
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {escalating.reason || escalating.message || 'Suspicious activity detected'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            Routing to Investigation in {escalateCountdown}s…
          </div>
          <div style={{ marginTop: 20, width: 200, height: 4, borderRadius: 4, background: 'var(--bg-void)', margin: '20px auto 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 4, background: 'var(--neon-red)', animation: 'progressPulse 1s linear infinite' }} />
          </div>
        </div>
        <style>{`@keyframes tisRingPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } } @keyframes progressPulse { 0% { width: 0; } 100% { width: 100%; } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Cross-Bank Alerts</h2>
        <p>Inter-bank communication and account blocking coordination</p>
      </div>

      {/* ─── System-generated alerts from onboarding/transactions ─── */}
      {sys.alerts.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(229,57,53,0.3)' }}>
          <div className="card-header">
            <div className="card-title"><Zap size={16} className="icon" /> System-Generated Alerts</div>
            <span className="badge badge-danger">{sys.alerts.length} new</span>
          </div>
          {sys.alerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              style={{
                padding: 14, background: 'rgba(229,57,53,0.05)', borderRadius: 8, marginBottom: 8,
                borderLeft: '3px solid var(--neon-red)', cursor: 'pointer',
                transition: 'all 0.2s', position: 'relative',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,57,53,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,57,53,0.05)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={14} style={{ color: 'var(--neon-red)' }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--neon-red)', letterSpacing: 1 }}>
                    {alert.type === 'ONBOARDING_BLOCK' ? 'ONBOARDING BLOCKED' : alert.type === 'TRANSACTION_FRAUD' ? 'FRAUD DETECTED' : 'ALERT'}
                  </span>
                </div>
                <span className="badge badge-danger">Click to Investigate →</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {alert.accountName || 'Unknown'} {alert.riskScore ? `(TIS: ${alert.riskScore}/100)` : ''}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alert.reason}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {new Date(alert.timestamp).toLocaleString()} • Auto-escalation enabled
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Send size={16} className="icon" /> Send New Alert</div>
          </div>
          <div className="form-group">
            <label className="form-label">Subject Account</label>
            <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">Select account...</option>
              {accounts.filter(a => a.tis >= 30).map(acc => (
                <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} (TIS: {acc.tis})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Bank</label>
            <select className="form-select" value={targetBank} onChange={e => setTargetBank(e.target.value)}>
              <option value="">Select target bank...</option>
              <option value="National Bank">National Bank</option>
              <option value="Metro Bank">Metro Bank</option>
              <option value="State Bank">State Bank</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSendAlert} disabled={!selectedAccount || !targetBank} style={{ width: '100%', justifyContent: 'center' }}>
            <Radio size={14} /> Send Alert
          </button>
          {newAlertData && <div style={{ marginTop: 20 }}><AlertStatus alertData={newAlertData} /></div>}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><Bell size={16} className="icon" /> Alert History</div>
            <span className="badge badge-info">{alerts.length} alerts</span>
          </div>
          {alerts.map(alert => (
            <div key={alert.id} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${alert.status === 'sent' ? 'var(--success)' : 'var(--warning)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{alert.id}</span>
                <span className={`badge ${alert.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>
                  {alert.status === 'sent' ? <><CheckCircle size={10} /> Sent</> : alert.status}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{alert.accountId} → {alert.targetBank}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alert.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
