import api from '../lib/api';
import type { Tenant, TenantCreateRequest } from '../types';

export const tenantService = {
  listar: () =>
    api.get<Tenant[]>('/api/tenants').then((r) => r.data),

  obtener: (id: string) =>
    api.get<Tenant>(`/api/tenants/${id}`).then((r) => r.data),

  crear: (data: TenantCreateRequest) =>
    api.post<Tenant>('/api/tenants', data).then((r) => r.data),

  actualizar: (id: string, data: TenantCreateRequest) =>
    api.put<Tenant>(`/api/tenants/${id}`, data).then((r) => r.data),

  desactivar: (id: string) =>
    api.delete(`/api/tenants/${id}`),

  asignarUsuario: (tenantId: string, usuarioId: string) =>
    api.post(`/api/tenants/${tenantId}/usuarios/${usuarioId}`),

  desasignarUsuario: (usuarioId: string) =>
    api.delete(`/api/tenants/usuarios/${usuarioId}`),
};
