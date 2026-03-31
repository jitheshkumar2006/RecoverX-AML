import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAccounts } from '../services/mockData';
import { getNetworkData } from '../services/graphEngine';
import { investigate } from '../services/iseEngine';
import { calculateTIS } from '../services/tisEngine';
import { predictNextMovement } from '../services/predictionEngine';
import { freezeAccount } from '../services/recoveryEngine';
import GraphVisualization from '../components/GraphVisualization';
import TISIndicator from '../components/TISIndicator';
import ISEPanel from '../components/ISEPanel';
import PredictionPanel from '../components/PredictionPanel';
import CopilotPanel from '../components/CopilotPanel';
import { Search, Users, Shield, Snowflake, Eye, CheckCircle } from 'lucide-react';

export default function Investigation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialAccount = searchParams.get('account') || '';
  const [selectedAccount, setSelectedAccount] = useState(initialAccount);
  const [accounts, setAccounts] = useState(getAccounts());
  const [networkData, setNetworkData] = useState(getNetworkData());
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeSuccess, setFreezeSuccess] = useState(false);

  const iseData = useMemo(() => selectedAccount ? investigate(selectedAccount) : null, [selectedAccount, accounts]);
  const tisData = useMemo(() => selectedAccount ? calculateTIS(selectedAccount) : null, [selectedAccount, accounts]);
  const prediction = useMemo(() => selectedAccount ? predictNextMovement(selectedAccount) : null, [selectedAccount, accounts]);
  const selectedAccountData = useMemo(() => accounts.find(a => a.id === selectedAccount), [selectedAccount, accounts]);

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
    }, 1000);
  }, [selectedAccount]);

  const handleMonitor = useCallback(() => {
    // Just visual feedback
    alert(`Account ${selectedAccount} set to enhanced monitoring.`);
  }, [selectedAccount]);

  return (
    <div>
      <div className="page-header">
        <h2>Investigation Center</h2>
        <p>Graph analysis, threat intelligence, and automated investigation</p>
      </div>

      {/* Account Selector */}
      <div className="card" style={{ marginBottom: 20, padding: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            className="form-select"
            style={{ maxWidth: 350 }}
            value={selectedAccount}
            onChange={e => { setSelectedAccount(e.target.value); setFreezeSuccess(false); }}
          >
            <option value="">Select an account to investigate...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.id} — {acc.name} ({acc.bank}) {acc.status === 'frozen' ? '❄️ FROZEN' : ''} {acc.tis >= 70 ? '🔴' : acc.tis >= 40 ? '🟡' : '🟢'}
              </option>
            ))}
          </select>
          {selectedAccountData && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${selectedAccountData.status === 'frozen' ? 'badge-frozen' : 'badge-info'}`}>
                {selectedAccountData.status === 'frozen' ? '❄️ Frozen' : '● Active'}
              </span>
              {freezeSuccess && (
                <span className="badge badge-success" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <CheckCircle size={12} /> Account Frozen
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Graph + TIS */}
      <div className="grid-2-1" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Users size={16} className="icon" /> Transaction Network</div>
          </div>
          <GraphVisualization
            nodes={networkData.nodes}
            edges={networkData.edges}
            onNodeSelect={handleNodeSelect}
            selectedNode={selectedAccount}
            height="420px"
          />
        </div>

        <div>
          {/* TIS */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title"><Shield size={16} className="icon" /> Threat Intelligence Score</div>
            </div>
            {tisData ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <TISIndicator score={tisData.score} level={tisData.level} />
                </div>
                {tisData.factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-primary)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: f.score > f.max * 0.6 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {f.score}/{f.max}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 20 }}>
                <p>Select an account to view TIS</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {selectedAccountData && selectedAccountData.status !== 'frozen' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger" onClick={handleFreeze} disabled={freezeLoading} style={{ flex: 1, justifyContent: 'center' }}>
                {freezeLoading ? <div className="spinner" /> : <Snowflake size={14} />}
                Initiate Core Freeze
              </button>
              <button className="btn btn-warning" onClick={handleMonitor} style={{ flex: 1, justifyContent: 'center' }}>
                <Eye size={14} /> Monitor Focus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ISE + Prediction + Copilot */}
      {selectedAccount && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <ISEPanel
            iseData={iseData}
            onFreeze={handleFreeze}
            onMonitor={handleMonitor}
            loading={freezeLoading}
          />
          <PredictionPanel
            prediction={prediction}
            accountName={selectedAccountData?.name}
          />
          <CopilotPanel account={selectedAccountData} />
        </div>
      )}
    </div>
  );
}
