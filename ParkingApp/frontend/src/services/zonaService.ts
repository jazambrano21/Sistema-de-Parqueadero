import api from '../lib/api';
import type { Zona, ZonaCreateRequest } from '../types';

export const zonaService = {
  listar: () =>
    api.get<Zona[]>('/api/zonas').then((r) => r.data),

  buscar: (nombre: string) =>
    api.get<Zona[]>(`/api/zonas/buscar?nombre=${encodeURIComponent(nombre)}`).then((r) => r.data),

  crear: (data: ZonaCreateRequest) =>
    api.post<Zona>('/api/zonas', data).then((r) => r.data),

  actualizar: (id: string, data: ZonaCreateRequest) =>
    api.put<Zona>(`/api/zonas/${id}`, data).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/api/zonas/${id}`),
};
