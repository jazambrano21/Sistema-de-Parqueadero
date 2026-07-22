import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParkingSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(form);
      setAuth(res.accessToken, res.username, res.roles);
      toast.success(`Bienvenido, ${res.username}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ParkingSquare className="w-9 h-9 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">ParkingApp</h1>
            <p className="text-blue-300 text-sm mt-1">Sistema de Parqueadero</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Iniciar sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="tu_usuario"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors mt-2"
            >
              {loading ? 'Iniciando sesión…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Sistema de Parqueadero Multitenant © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
