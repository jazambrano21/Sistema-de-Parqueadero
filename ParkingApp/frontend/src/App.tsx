import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TicketsPage from './pages/TicketsPage';
import ZonasPage from './pages/ZonasPage';
import VehiculosPage from './pages/VehiculosPage';
import UsuariosPage from './pages/UsuariosPage';
import TenantsPage from './pages/TenantsPage';
import AuditoriaPage from './pages/AuditoriaPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="zonas" element={<ZonasPage />} />
        <Route path="vehiculos" element={<VehiculosPage />} />
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <UsuariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="tenants"
          element={
            <AdminRoute>
              <TenantsPage />
            </AdminRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <AdminRoute>
              <AuditoriaPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
