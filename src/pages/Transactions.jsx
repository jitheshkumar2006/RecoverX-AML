import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, getAccounts, addTransaction, generateTxnId } from '../services/mockData';
import { predictNextMovement } from '../services/predictionEngine';
import { useSystem, SYSTEM_PHASES } from '../context/SystemContext';
import { AlertTriangle, ArrowRightLeft, Plus, Filter, TrendingUp, Zap, Shield, CheckCircle, Clock } from 'lucide-react';

export default function Transactions() {
  const navigate = useNavigate();
  const sys = useSystem();
  const [transactions, setTransactions] = useState(getTransactions());
  const accounts = getAccounts();
  const [filter, setFilter] = useState('all');

  // ─── Simulated transaction flow state ─────────────────────
  const [simulating, setSimulating] = useState(false);
  const [simSteps, setSimSteps] = useState([]);
  const [simResult, setSimResult] = useState(null);

  // ─── Set system phase ─────────────────────────────────────
  useEffect(() => {
    sys.transitionPhase(SYSTEM_PHASES.MONITORING, 'Transaction monitoring active');
    return () => sys.transitionPhase(SYSTEM_PHASES.IDLE);
  }, []);

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
  }), [transactions]);

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : id;
  };

  // ─── Requirement #2: Simulated Event-Based Transaction Flow ──
  const handleSimulateTransaction = useCallback(() => {
    if (accounts.length < 2) {
      sys.addSystemMessage('Need at least 2 accounts — go to Integrations first', 'warning');
      return;
    }

    setSimulating(true);
    setSimSteps([]);
    setSimResult(null);
    sys.transitionPhase(SYSTEM_PHASES.TRANSACTION_SCAN, 'Simulated transaction initiated — running analysis…');

    // Pick random accounts
    const activeAccounts = accounts.filter(a => a.status !== 'frozen');
    const from = activeAccounts[Math.floor(Math.random() * activeAccounts.length)];
    const toOptions = activeAccounts.filter(a => a.id !== from.id);
    const to = toOptions[Math.floor(Math.random() * toOptions.length)];
    const amount = Math.floor(Math.random() * 500000) + 50000;
    const isSuspicious = amount > 200000 || from.tis >= 50 || to.tis >= 50;

    // Step 1: Transaction created
    setTimeout(() => {
      setSimSteps(prev => [...prev, { label: `Transaction initiated: ${from.name} → ${to.name} (₹${amount.toLocaleString()})`, status: 'done' }]);
      sys.addSystemMessage(`Transaction: ${from.id} → ${to.id} — ₹${amount.toLocaleString()}`, 'info');
    }, 500);

    // Step 2: Running prediction engine
    setTimeout(() => {
      setSimSteps(prev => [...prev, { label: 'Running prediction engine…', status: 'done' }]);
    }, 1200);

    // Step 3: Graph analysis
    setTimeout(() => {
      const prediction = predictNextMovement(from.id);
      setSimSteps(prev => [...prev, {
        label: `Graph analysis: ${prediction.predictedAccount ? `Next likely target: ${prediction.predictedAccountName} (${prediction.confidence}% confidence)` : 'No layering pattern detected'}`,
        status: 'done'
      }]);
    }, 2000);

    // Step 4: Risk assessment
    setTimeout(() => {
      setSimSteps(prev => [...prev, {
        label: isSuspicious ? `⚠️ SUSPICIOUS — ${amount > 200000 ? 'High amount' : 'High-risk account involved'}` : '✓ Transaction appears normal',
        status: isSuspicious ? 'danger' : 'success'
      }]);
    }, 2800);

    // Step 5: Final action
    setTimeout(() => {
      const txn = {
        id: generateTxnId(), from: from.id, to: to.id, amount,
        timestamp: new Date().toISOString(), type: 'transfer', status: 'completed', flagged: isSuspicious,
      };
      addTransaction(txn);
      setTransactions(getTransactions());

      if (isSuspicious) {
        setSimSteps(prev => [...prev, { label: '🔴 Alert generated — auto-escalating to Alerts page', status: 'danger' }]);
        sys.transitionPhase(SYSTEM_PHASES.FRAUD_DETECTED, `Suspicious transaction detected: ₹${amount.toLocaleString()}`);
        sys.addAlert({
          type: 'TRANSACTION_FRAUD', accountName: from.name, accountId: from.id,
          riskScore: from.tis, reason: `Suspicious transaction ₹${amount.toLocaleString()} from ${from.name} to ${to.name}`,
          txnId: txn.id, amount,
        });
        setSimResult({ suspicious: true, txn, from, to });

        // Auto-navigate to alerts after 2s
        setTimeout(() => {
          navigate('/alerts');
        }, 2500);
      } else {
        setSimSteps(prev => [...prev, { label: '✓ Transaction completed — no anomalies', status: 'success' }]);
        sys.transitionPhase(SYSTEM_PHASES.MONITORING, 'Transaction cleared — resuming monitoring');
        setSimResult({ suspicious: false, txn, from, to });
        setTimeout(() => setSimulating(false), 2000);
      }
    }, 3500);
  }, [accounts, navigate, sys]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Transaction Monitoring</h2>
          <p>Real-time transaction feed with automated risk assessment</p>
        </div>
        <button className="btn btn-primary" onClick={handleSimulateTransaction} disabled={simulating}>
          {simulating ? <><div className="spinner" /> Analyzing…</> : <><Zap size={14} /> Simulate Transaction</>}
        </button>
      </div>

      {/* ─── Simulation Progress ─── */}
      {simulating && (
        <div className="card" style={{ marginBottom: 20, borderColor: simResult?.suspicious ? 'rgba(229,57,53,0.3)' : 'rgba(0,176,255,0.25)' }}>
          <div className="card-header">
            <div className="card-title"><Shield size={16} className="icon" /> Transaction Analysis</div>
            <span className={`badge ${simResult ? (simResult.suspicious ? 'badge-danger' : 'badge-success') : 'badge-info'}`} style={{ animation: !simResult ? 'statusPulse 1.5s infinite' : 'none' }}>
              {simResult ? (simResult.suspicious ? 'FRAUD DETECTED' : 'CLEARED') : 'ANALYZING'}
            </span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {simSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', animation: 'fadeIn 0.3s ease' }}>
                {step.status === 'danger' ? (
                  <AlertTriangle size={12} style={{ color: 'var(--neon-red)', flexShrink: 0 }} />
                ) : step.status === 'success' ? (
                  <CheckCircle size={12} style={{ color: 'var(--neon-green)', flexShrink: 0 }} />
                ) : (
                  <CheckCircle size={12} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                )}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, flex: 1,
                  color: step.status === 'danger' ? 'var(--neon-red)' : step.status === 'success' ? 'var(--neon-green)' : 'var(--text-secondary)',
                }}>{step.label}</span>
              </div>
            ))}
            {!simResult && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{ width: 12, height: 12, border: '2px solid var(--neon-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--neon-blue)' }}>Processing…</span>
              </div>
            )}
          </div>
          {simResult?.suspicious && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(229,57,53,0.08)', fontSize: 11, color: 'var(--neon-amber)', fontFamily: 'var(--font-mono)' }}>
              ⚡ Auto-navigating to Alerts in 2s…
            </div>
          )}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } } @keyframes spin { to { transform: rotate(360deg); } } @keyframes statusPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
        </div>
      )}

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
        <button className={`tab ${filter === 'flagged' ? 'active' : ''}`} onClick={() => setFilter('flagged')}>Flagged ({transactions.filter(t => t.flagged).length})</button>
        <button className={`tab ${filter === 'normal' ? 'active' : ''}`} onClick={() => setFilter('normal')}>Normal ({transactions.filter(t => !t.flagged).length})</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>TXN ID</th><th>From</th><th>To</th><th>Amount</th><th>Timestamp</th><th>Risk</th></tr>
            </thead>
            <tbody>
              {filtered.map(txn => (
                <tr key={txn.id} style={{ background: txn.flagged ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{txn.id}</td>
                  <td><div style={{ fontSize: 13, fontWeight: 500 }}>{getAccountName(txn.from)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{txn.from}</div></td>
                  <td><div style={{ fontSize: 13, fontWeight: 500 }}>{getAccountName(txn.to)}</div><div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{txn.to}</div></td>
                  <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: txn.amount >= 1000000 ? 'var(--danger)' : txn.amount >= 100000 ? 'var(--warning)' : 'var(--text-primary)' }}>₹{txn.amount.toLocaleString()}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(txn.timestamp).toLocaleString()}</td>
                  <td>{txn.flagged ? <span className="badge badge-danger"><AlertTriangle size={10} /> Flagged</span> : <span className="badge badge-success">Normal</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
