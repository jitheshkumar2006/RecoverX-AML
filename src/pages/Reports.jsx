import { useState } from 'react';
import { getAccounts, getTransactionsForAccount } from '../services/mockData';
import { downloadFIR } from '../services/reportGenerator';
import { investigate } from '../services/iseEngine';
import TISIndicator from '../components/TISIndicator';
import { FileText, Download, Shield, AlertTriangle } from 'lucide-react';

export default function Reports() {
  const [accounts] = useState(getAccounts());
  const [selectedAccount, setSelectedAccount] = useState('');
  const [generating, setGenerating] = useState(false);

  const selectedData = selectedAccount ? {
    account: accounts.find(a => a.id === selectedAccount),
    ise: investigate(selectedAccount),
    txns: getTransactionsForAccount(selectedAccount),
  } : null;

  const handleDownload = () => {
    if (!selectedAccount) return;
    setGenerating(true);
    setTimeout(() => { downloadFIR(selectedAccount); setGenerating(false); }, 500);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Law Enforcement Reports</h2>
        <p>Generate FIR-style investigation reports</p>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FileText size={16} className="icon" /> Generate Report</div>
          </div>
          <div className="form-group">
            <label className="form-label">Subject Account</label>
            <select className="form-select" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">Select account...</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} | TIS: {acc.tis}</option>
              ))}
            </select>
          </div>
          {selectedData ? (
            <div>
              <div style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Preview</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Account', selectedData.account.name],
                    ['Bank', selectedData.account.bank],
                    ['Status', selectedData.account.status],
                    ['Transactions', selectedData.txns.length],
                  ].map(([k, v]) => (
                    <div key={k}><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div><div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div></div>
                  ))}
                </div>
              </div>
              <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Report includes:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {['Account details & TIS breakdown', 'ISE analysis & suspicion reasons', 'Complete transaction records', 'Graph insights & recommendations'].map((item, i) => (
                  <li key={i} style={{ padding: '6px 0', fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-primary)' }}>
                    <Shield size={12} style={{ color: 'var(--accent-blue)' }} />{item}
                  </li>
                ))}
              </ul>
              <button className="btn btn-primary" onClick={handleDownload} disabled={generating} style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
                {generating ? <div className="spinner" /> : <Download size={14} />}
                {generating ? 'Generating...' : 'Download FIR Report (PDF)'}
              </button>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <FileText size={48} style={{ opacity: 0.2 }} />
              <h3>Select an Account</h3>
              <p>Choose an account to generate a report</p>
            </div>
          )}
        </div>
        <div>
          {selectedData && (
            <>
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header"><div className="card-title"><Shield size={16} className="icon" /> TIS</div></div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <TISIndicator score={selectedData.ise.tis.score} level={selectedData.ise.tis.level} />
                </div>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title"><AlertTriangle size={16} className="icon" /> Suspicion Summary</div></div>
                <ul className="ise-reasons">
                  {selectedData.ise.suspicionReasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
