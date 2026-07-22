import axios, { AxiosError } from 'axios';

/**
 * Cliente HTTP centralizado.
 * Todas las peticiones pasan por el Kong API Gateway en /api, /tickets, /vehiculo.
 * El proxy de Vite redirige al gateway en localhost:8000 en desarrollo.
 * En producción el frontend sirve desde el mismo host que Kong.
 */
const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor — agrega Bearer token automáticamente ────────────────
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const token: string | undefined = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // storage corrupted — ignore
    }
  }
  return config;
});

// ── Response interceptor — manejo global de errores ──────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// ─── Helpers de error ────────────────────────────────────────────────────────
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
