import { useState, useMemo } from 'react';
import { getAccounts } from '../services/mockData';
import { calculateRecovery, freezeAccount } from '../services/recoveryEngine';
import { sendCrossBankAlert } from '../services/crossBankAlert';
import RecoveryPanel from '../components/RecoveryPanel';
import AlertStatus from '../components/AlertStatus';
import { BarChart3, Snowflake, Radio } from 'lucide-react';

export default function Recovery() {
  const [accounts, setAccounts] = useState(getAccounts());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [alertData, setAlertData] = useState(null);

  const frozenAccounts = useMemo(() => accounts.filter(a => a.status === 'frozen'), [accounts]);
  const suspiciousAccounts = useMemo(() => accounts.filter(a => a.tis >= 50 && a.status !== 'frozen'), [accounts]);
  const recoveryData = useMemo(() => selectedAccount ? calculateRecovery(selectedAccount) : null, [selectedAccount, accounts]);

  const handleFreeze = (accountId) => {
    freezeAccount(accountId);
    setAccounts(getAccounts());
    if (!selectedAccount) setSelectedAccount(accountId);
  };

  const handleSendAlert = () => {
    if (!selectedAccount) return;
    const account = accounts.find(a => a.id === selectedAccount);
    if (!account) return;

    const result = sendCrossBankAlert(selectedAccount, account.name, 'Partner Bank Network', `High-risk account ${selectedAccount} (${account.name}) detected. Requesting immediate block.`);
    setAlertData(result);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Recovery Center</h2>
        <p>Fund recovery analysis and cross-bank coordination</p>
      </div>

      {/* Account Selection */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Frozen Accounts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Snowflake size={16} className="icon" /> Frozen Accounts</div>
            <span className="badge badge-frozen">{frozenAccounts.length}</span>
          </div>
          {frozenAccounts.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>
              <p>No frozen accounts. Freeze suspicious accounts from the Investigation page.</p>
            </div>
          ) : (
            <div className="account-select-list">
              {frozenAccounts.map(acc => (
                <div
                  key={acc.id}
                  className={`account-select-item ${selectedAccount === acc.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAccount(acc.id)}
                >
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

        {/* Suspicious - Ready to Freeze */}
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

      {/* Recovery Analysis + Alert */}
      {selectedAccount && (
        <div className="grid-2" style={{ marginBottom: 20 }}>
          <RecoveryPanel recoveryData={recoveryData} />
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title"><Radio size={16} className="icon" /> Cross-Bank Alert</div>
              </div>
              {!alertData ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Send an alert to partner banks to block related accounts and prevent further fund movement.
                  </p>
                  <button className="btn btn-primary" onClick={handleSendAlert} style={{ width: '100%', justifyContent: 'center' }}>
                    <Radio size={14} /> Send Cross-Bank Alert
                  </button>
                </div>
              ) : (
                <AlertStatus alertData={alertData} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
