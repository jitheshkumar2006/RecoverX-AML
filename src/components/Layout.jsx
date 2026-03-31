import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { subscribeToIntegrations } from '../services/mockData';
import { AlertOctagon, X, Search } from 'lucide-react';

export default function Layout() {
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeToIntegrations((data) => {
      setAlert(data);
    });
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {alert && (
          <div style={{
            position: 'absolute', top: 30, right: 30, zIndex: 9999,
            background: 'var(--bg-glass)', border: '1px solid var(--neon-red)',
            borderRadius: 12, padding: 20, width: 380,
            boxShadow: 'var(--shadow-lg), 0 0 30px var(--neon-red-glow)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ color: 'var(--neon-red)', animation: 'emergencyPulse 2s infinite' }}>
                <AlertOctagon size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                  Critical Priority Alert
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  New Mule Account identified in live feed (<strong style={{ color: 'var(--text-primary)' }}>{alert.entity}</strong>).
                  Rapid structuring transfers flagged (Total: Rs. {(alert.txns.reduce((a, b) => a + b.amount, 0)).toLocaleString()}).
                </p>
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => {
                    navigate(`/investigation?account=${alert.localId}`);
                    setAlert(null);
                  }}>
                    <Search size={12} /> Investigate
                  </button>
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => setAlert(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
