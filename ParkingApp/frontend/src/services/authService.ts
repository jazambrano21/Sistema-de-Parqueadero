import api from '../lib/api';
import type { LoginRequest, LoginResponse, UserCreateRequest } from '../types';

export const authService = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),

  register: (data: UserCreateRequest) =>
    api.post('/api/auth/register', data).then((r) => r.data),

  logout: (token: string) =>
    api.post('/api/auth/logout', null, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
