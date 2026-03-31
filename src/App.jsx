import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SystemProvider } from './context/SystemContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Transactions from './pages/Transactions';
import Investigation from './pages/Investigation';
import Recovery from './pages/Recovery';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Emergency from './pages/Emergency';
import Integrations from './pages/Integrations';

function App() {
  return (
    <SystemProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="onboarding" element={<Onboarding />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="investigation" element={<Investigation />} />
            <Route path="recovery" element={<Recovery />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="emergency" element={<Emergency />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SystemProvider>
  );
}

export default App;
