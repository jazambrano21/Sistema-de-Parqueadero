import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decodeJwt } from '../lib/auth';
import type { JwtPayload } from '../types';

interface AuthState {
  token: string | null;
  username: string | null;
  roles: string[];
  tenantId: string | null;

  // Actions
  setAuth: (token: string, username: string, roles: string[]) => void;
  logout: () => void;

  // Derived helpers
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  payload: () => JwtPayload | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      username: null,
      roles: [],
      tenantId: null,

      setAuth: (token, username, roles) => {
        const payload = decodeJwt(token);
        set({
          token,
          username,
          roles,
          tenantId: payload?.tenantId ?? null,
        });
      },

      logout: () => set({ token: null, username: null, roles: [], tenantId: null }),

      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        const payload = decodeJwt(token);
        if (!payload) return false;
        return payload.exp * 1000 > Date.now();
      },

      isAdmin: () => {
        const { roles } = get();
        return roles.some((r) => r === 'ROLE_ADMIN' || r === 'ADMIN');
      },

      payload: () => {
        const { token } = get();
        return token ? decodeJwt(token) : null;
      },
    }),
    { name: 'auth-storage' },
  ),
);
