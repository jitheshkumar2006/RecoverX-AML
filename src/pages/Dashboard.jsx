import { useState, useMemo } from 'react';
import { getAccounts, getTransactions, getActionLog } from '../services/mockData';
import { getSuspiciousChains, getNetworkData } from '../services/graphEngine';
import { useNavigate } from 'react-router-dom';
import GraphVisualization from '../components/GraphVisualization';
import { Users, ArrowRightLeft, ShieldAlert, Snowflake, AlertTriangle, BarChart3, Activity } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const accounts = getAccounts();
  const transactions = getTransactions();
  const actionLog = getActionLog();
  const suspiciousChains = getSuspiciousChains();
  const networkData = getNetworkData();
  const [selectedNode, setSelectedNode] = useState(null);

  const stats = useMemo(() => {
    const frozen = accounts.filter(a => a.status === 'frozen').length;
    const highRisk = accounts.filter(a => a.tis >= 70).length;
    const flagged = transactions.filter(t => t.flagged).length;
    const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
    return { total: accounts.length, frozen, highRisk, flagged, totalVolume, chains: suspiciousChains.length };
  }, [accounts, transactions, suspiciousChains]);

  const recentTxns = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);

  return (
    <div>
      <div className="page-header">
        <h2>Command Center</h2>
        <p>Real-time fraud detection and recovery intelligence</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-card-icon"><Users size={18} /></div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Accounts</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-icon"><ShieldAlert size={18} /></div>
          <div className="stat-card-value">{stats.highRisk}</div>
          <div className="stat-card-label">High Risk Accounts</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-icon"><AlertTriangle size={18} /></div>
          <div className="stat-card-value">{stats.flagged}</div>
          <div className="stat-card-label">Flagged Transactions</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-icon"><Snowflake size={18} /></div>
          <div className="stat-card-value">{stats.frozen}</div>
          <div className="stat-card-label">Frozen Accounts</div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon"><BarChart3 size={18} /></div>
          <div className="stat-card-value">₹{(stats.totalVolume / 100000).toFixed(1)}L</div>
          <div className="stat-card-label">Total Volume</div>
        </div>
      </div>

      {/* Graph + Chains */}
      <div className="grid-2-1" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Activity size={16} className="icon" /> Transaction Network</div>
            <button className="btn btn-ghost" onClick={() => navigate('/investigation')}>
              Open Investigation →
            </button>
          </div>
          <GraphVisualization
            nodes={networkData.nodes}
            edges={networkData.edges}
            onNodeSelect={(id) => { setSelectedNode(id); navigate(`/investigation?account=${id}`); }}
            height="380px"
          />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><AlertTriangle size={16} className="icon" /> Suspicious Chains</div>
            <span className="badge badge-danger">{suspiciousChains.length} detected</span>
          </div>
          {suspiciousChains.map((chain, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--bg-primary)', borderRadius: 8, marginBottom: 8, borderLeft: `3px solid ${chain.riskLevel === 'Critical' ? 'var(--danger)' : chain.riskLevel === 'High' ? 'var(--warning)' : 'var(--accent-blue)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className={`badge ${chain.riskLevel === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>{chain.riskLevel}</span>
                <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                  ₹{chain.totalAmount.toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                {chain.accounts.map((acc, j) => (
                  <span key={j}>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{acc}</span>
                    {j < chain.accounts.length - 1 && <span style={{ color: 'var(--danger)', margin: '0 2px' }}> → </span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><ArrowRightLeft size={16} className="icon" /> Recent Transactions</div>
          <button className="btn btn-ghost" onClick={() => navigate('/transactions')}>View All →</button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTxns.map(txn => (
                <tr key={txn.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.id}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.from}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.to}</td>
                  <td style={{ fontWeight: 600 }}>₹{txn.amount.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(txn.timestamp).toLocaleString()}</td>
                  <td>
                    {txn.flagged ? (
                      <span className="badge badge-danger"><AlertTriangle size={10} /> Flagged</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
