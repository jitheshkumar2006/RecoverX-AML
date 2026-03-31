import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowRightLeft, Search, ShieldAlert, Bell, FileText, AlertTriangle, Activity, BarChart3, Network } from 'lucide-react';

const navItems = [
  { section: '1. Prevention', items: [
    { to: '/onboarding', icon: Users, label: 'Onboarding & KYC' },
  ]},
  { section: '2. Live Feed Sync', items: [
    { to: '/integrations', icon: Network, label: 'Data Integration' },
  ]},
  { section: '3. Detection & Graph', items: [
    { to: '/', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/transactions', icon: ArrowRightLeft, label: 'Live Transactions' },
    { to: '/investigation', icon: Search, label: 'Investigator Review' },
  ]},
  { section: '4. Action & Audit', items: [
    { to: '/recovery', icon: BarChart3, label: 'Asset Recovery' },
    { to: '/alerts', icon: Bell, label: 'Cross-Bank Alerts' },
    { to: '/reports', icon: FileText, label: 'Regulatory Reports' },
  ]},
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{ background: 'linear-gradient(135deg, var(--neon-red), #8b0000)', boxShadow: '0 0 15px var(--neon-red-glow)' }}>
          <ShieldAlert size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ color: '#ffffff' }}>RecoverX</h1>
          <span style={{ color: '#8892b0' }}>Mule Account Defense</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                end={item.to === '/'}
              >
                <item.icon size={18} className="icon" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-emergency">
        <NavLink to="/emergency" className="btn btn-emergency" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <AlertTriangle size={18} />
          I Got Scammed!
        </NavLink>
      </div>
    </aside>
  );
}
