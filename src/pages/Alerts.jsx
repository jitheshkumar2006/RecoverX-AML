import { useState } from 'react';
import { getAccounts, getAlerts } from '../services/mockData';
import { sendCrossBankAlert } from '../services/crossBankAlert';
import AlertStatus from '../components/AlertStatus';
import { Bell, Radio, Send, CheckCircle } from 'lucide-react';

export default function Alerts() {
  const [accounts] = useState(getAccounts());
  const [alerts, setAlerts] = useState(getAlerts());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [targetBank, setTargetBank] = useState('');
  const [newAlertData, setNewAlertData] = useState(null);

  const handleSendAlert = () => {
    if (!selectedAccount || !targetBank) return;
    const account = accounts.find(a => a.id === selectedAccount);
    const result = sendCrossBankAlert(selectedAccount, account?.name || '', targetBank, `Suspicious activity alert for ${selectedAccount}. Requesting immediate review and block.`);
    setNewAlertData(result);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Cross-Bank Alerts</h2>
        <p>Inter-bank communication and account blocking coordination</p>
      </div>

      <div className="grid-2">
        {/* Send New Alert */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Send size={16} className="icon" /> Send New Alert</div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject Account</label>
            <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">Select account...</option>
              {accounts.filter(a => a.tis >= 30).map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.id} — {acc.name} (TIS: {acc.tis}) {acc.status === 'frozen' ? '❄️' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Bank</label>
            <select className="form-select" value={targetBank} onChange={e => setTargetBank(e.target.value)}>
              <option value="">Select target bank...</option>
              <option value="National Bank">National Bank</option>
              <option value="Metro Bank">Metro Bank</option>
              <option value="City Bank">City Bank</option>
              <option value="State Bank">State Bank</option>
              <option value="Offshore Trust">Offshore Trust</option>
              <option value="International Banking Corp">International Banking Corp</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleSendAlert} disabled={!selectedAccount || !targetBank} style={{ width: '100%', justifyContent: 'center' }}>
            <Radio size={14} /> Send Alert
          </button>

          {newAlertData && (
            <div style={{ marginTop: 20 }}>
              <AlertStatus alertData={newAlertData} />
            </div>
          )}
        </div>

        {/* Alert History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Bell size={16} className="icon" /> Alert History</div>
            <span className="badge badge-info">{alerts.length} alerts</span>
          </div>

          {alerts.map(alert => (
            <div key={alert.id} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${alert.status === 'sent' ? 'var(--success)' : alert.status === 'pending' ? 'var(--warning)' : 'var(--accent-blue)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{alert.id}</span>
                <span className={`badge ${alert.status === 'sent' ? 'badge-success' : 'badge-warning'}`}>
                  {alert.status === 'sent' ? <><CheckCircle size={10} /> Sent</> : alert.status}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
                {alert.accountId} → {alert.targetBank}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{alert.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {new Date(alert.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
