// smart-inventory/frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Pages
import Landing   from '@/views/Landing';
import Auth      from '@/views/Auth';
import Dashboard from '@/views/Dashboard';
import Trades    from '@/views/Trades';
import Analytics from '@/views/Analytics';
import AI        from '@/views/AI';
import RiskMgmt  from '@/views/RiskManagement';
import Alerts    from '@/views/Alerts';
import Learn     from '@/views/Learn';
import LiveChart from '@/views/LiveChart';
import Broker    from '@/views/Broker';
import Strategies from '@/views/Strategies';
import Settings  from '@/views/Settings';
import Admin     from '@/views/Admin';

// Layout
import Layout from '@/components/common/Layout';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/auth" replace />;
};

// Public Route (нэвтэрсэн бол redirect)
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore();
  return !token ? children : <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? children : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      {/* Landing or Redirect */}
      <Route path="/" element={token ? <Navigate to="/dashboard" replace /> : <Landing />} />

      {/* Public */}
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />

      {/* Protected — Layout дотор */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="trades" element={<Trades />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai" element={<AI />} />
        <Route path="chart" element={<LiveChart />} />
        <Route path="broker" element={<Broker />} />
        <Route path="risk" element={<RiskMgmt />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="learn" element={<Learn />} />
        <Route path="strategies" element={<Strategies />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
