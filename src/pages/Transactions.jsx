import { useState, useMemo } from 'react';
import { getTransactions, getAccounts, addTransaction, generateTxnId } from '../services/mockData';
import { AlertTriangle, ArrowRightLeft, Plus, Filter, TrendingUp } from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState(getTransactions());
  const accounts = getAccounts();
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTxn, setNewTxn] = useState({ from: '', to: '', amount: '' });

  const filtered = useMemo(() => {
    let txns = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (filter === 'flagged') txns = txns.filter(t => t.flagged);
    if (filter === 'normal') txns = txns.filter(t => !t.flagged);
    return txns;
  }, [transactions, filter]);

  const stats = useMemo(() => ({
    total: transactions.length,
    flagged: transactions.filter(t => t.flagged).length,
    totalAmount: transactions.reduce((s, t) => s + t.amount, 0),
    avgAmount: Math.round(transactions.reduce((s, t) => s + t.amount, 0) / transactions.length),
  }), [transactions]);

  const handleAddTransaction = () => {
    if (!newTxn.from || !newTxn.to || !newTxn.amount || newTxn.from === newTxn.to) return;
    const amount = parseInt(newTxn.amount);
    const flagged = amount > 200000;
    const txn = {
      id: generateTxnId(),
      from: newTxn.from,
      to: newTxn.to,
      amount,
      timestamp: new Date().toISOString(),
      type: 'transfer',
      status: 'completed',
      flagged,
    };
    addTransaction(txn);
    setTransactions(getTransactions());
    setShowAddModal(false);
    setNewTxn({ from: '', to: '', amount: '' });
  };

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : id;
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Transaction Monitoring</h2>
          <p>Real-time transaction feed with risk assessment</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Simulate Transaction
        </button>
      </div>

      {/* Mini Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card blue">
          <div className="stat-card-icon"><ArrowRightLeft size={16} /></div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Transactions</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-icon"><AlertTriangle size={16} /></div>
          <div className="stat-card-value">{stats.flagged}</div>
          <div className="stat-card-label">Flagged</div>
        </div>
        <div className="stat-card success">
          <div className="stat-card-icon"><TrendingUp size={16} /></div>
          <div className="stat-card-value">₹{(stats.totalAmount / 100000).toFixed(1)}L</div>
          <div className="stat-card-label">Total Volume</div>
        </div>
      </div>

      {/* Filter */}
      <div className="tabs" style={{ display: 'inline-flex', marginBottom: 16 }}>
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({transactions.length})</button>
        <button className={`tab ${filter === 'flagged' ? 'active' : ''}`} onClick={() => setFilter('flagged')}>
          Flagged ({transactions.filter(t => t.flagged).length})
        </button>
        <button className={`tab ${filter === 'normal' ? 'active' : ''}`} onClick={() => setFilter('normal')}>
          Normal ({transactions.filter(t => !t.flagged).length})
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(txn => (
                <tr key={txn.id} style={{ background: txn.flagged ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.id}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{getAccountName(txn.from)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{txn.from}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{getAccountName(txn.to)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{txn.to}</div>
                  </td>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: txn.amount >= 1000000 ? 'var(--danger)' : txn.amount >= 100000 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    ₹{txn.amount.toLocaleString()}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(txn.timestamp).toLocaleString()}
                  </td>
                  <td><span className="badge badge-success">{txn.status}</span></td>
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

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Simulate Transaction</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <div className="form-group">
              <label className="form-label">From Account</label>
              <select className="form-select" value={newTxn.from} onChange={e => setNewTxn({ ...newTxn, from: e.target.value })}>
                <option value="">Select sender</option>
                {accounts.filter(a => a.status !== 'frozen').map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} ({acc.bank})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">To Account</label>
              <select className="form-select" value={newTxn.to} onChange={e => setNewTxn({ ...newTxn, to: e.target.value })}>
                <option value="">Select receiver</option>
                {accounts.filter(a => a.id !== newTxn.from).map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.id} — {acc.name} ({acc.bank})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" placeholder="Enter amount" value={newTxn.amount} onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })} />
              {newTxn.amount > 200000 && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> This amount will be auto-flagged
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleAddTransaction} style={{ flex: 1, justifyContent: 'center' }}>
                <ArrowRightLeft size={14} /> Execute Transaction
              </button>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
