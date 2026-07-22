import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  MapPin,
  Car,
  Users,
  Building2,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ParkingSquare,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tickets', icon: Ticket, label: 'Tickets' },
  { to: '/zonas', icon: MapPin, label: 'Zonas y Espacios' },
  { to: '/vehiculos', icon: Car, label: 'Vehículos' },
  { to: '/usuarios', icon: Users, label: 'Usuarios', adminOnly: true },
  { to: '/tenants', icon: Building2, label: 'Tenants', adminOnly: true },
  { to: '/auditoria', icon: ShieldCheck, label: 'Auditoría', adminOnly: true },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { username, tenantId, logout, token, isAdmin } = useAuthStore((s) => ({
    username: s.username,
    tenantId: s.tenantId,
    logout: s.logout,
    token: s.token,
    isAdmin: s.isAdmin,
  }));
  const navigate = useNavigate();
  const admin = isAdmin();

  const handleLogout = async () => {
    try {
      if (token) await authService.logout(token);
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
    }
  };

  const visibleItems = navItems.filter((i) => !i.adminOnly || admin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <ParkingSquare className="w-8 h-8 text-blue-400" />
        <div>
          <p className="text-white font-bold text-lg leading-tight">ParkingApp</p>
          <p className="text-slate-400 text-xs truncate max-w-[140px]">
            {tenantId ? `Tenant: ${tenantId.slice(0, 8)}…` : 'Super Admin'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white',
              )
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer user */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {username?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{username}</p>
            <p className="text-slate-400 text-xs">{admin ? 'Administrador' : 'Usuario'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-800 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 transition-transform duration-200 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar mobile */}
        <header className="flex items-center gap-4 px-4 py-3 bg-white border-b border-slate-200 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <ParkingSquare className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-slate-800">ParkingApp</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
