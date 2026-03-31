import { useState } from 'react';
import { Network, Database, CheckCircle, RefreshCcw, AlertTriangle } from 'lucide-react';
import { simulateExternalBankBatch } from '../services/mockData';

export default function Integrations() {
  const [banks, setBanks] = useState([
    { id: 'iob_core', name: 'IOB Core Banking Ledger', status: 'connected', lastSync: '10 mins ago', integrationType: 'Real-time API', uptime: '99.9%' }
  ]);

  const [simulating, setSimulating] = useState(false);

  const handleSimulate = (bankName) => {
    setSimulating(bankName);
    setTimeout(() => {
      simulateExternalBankBatch(bankName);
      setBanks(banks.map(b => b.name === bankName ? { ...b, lastSync: 'Just now' } : b));
      setSimulating(false);
    }, 1500);
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#00529b', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 14 }}>IOB</div>
          Data Integration Gateway
        </h2>
        <p>Sync with IOB Core Banking Ledgers to ingest and analyze potential mule accounts</p>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="stat-card blue">
          <div className="stat-card-icon"><Network size={20} /></div>
          <div className="stat-card-value">1</div>
          <div className="stat-card-label">Active Core Connector</div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon"><Database size={20} /></div>
          <div className="stat-card-value">1.4M</div>
          <div className="stat-card-label">TXNs Analyzed Today</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon"><AlertTriangle size={20} /></div>
          <div className="stat-card-value">1.2ms</div>
          <div className="stat-card-label">Avg Pipeline Latency</div>
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
        Internal System Status
      </h3>

      <div style={{ display: 'grid', gap: 16 }}>
        {banks.map(bank => (
          <div key={bank.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bank.status === 'connected' ? 'rgba(0, 200, 83, 0.1)' : 'rgba(229, 57, 53, 0.1)',
                color: bank.status === 'connected' ? 'var(--neon-green)' : 'var(--neon-red)'
              }}>
                <Network size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {bank.name}
                  <span className={`badge ${bank.status === 'connected' ? 'badge-success' : 'badge-danger'}`}>
                    {bank.status === 'connected' ? 'SECURE LINK' : 'OFF-LINE'}
                  </span>
                </h4>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  <span>Type: <strong style={{ color: 'var(--text-secondary)' }}>{bank.integrationType}</strong></span>
                  <span>Uptime: <strong style={{ color: 'var(--text-secondary)' }}>{bank.uptime}</strong></span>
                  <span>Last Sync: <strong style={{ color: 'var(--text-secondary)' }}>{bank.lastSync}</strong></span>
                </div>
              </div>
            </div>
            <div>
              {bank.status === 'connected' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleSimulate(bank.name)}
                  disabled={simulating === bank.name}
                  style={{ background: '#00529b', borderColor: '#00529b', color: '#fff' }}
                >
                  {simulating === bank.name ? <div className="spinner" /> : <RefreshCcw size={14} />}
                  {simulating === bank.name ? 'Ingesting...' : 'Start Live Core Feed'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
