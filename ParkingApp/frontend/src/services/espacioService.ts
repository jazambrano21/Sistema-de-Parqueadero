import api from '../lib/api';
import type { Espacio, EspacioCreateRequest, EstadoEspacio } from '../types';

export const espacioService = {
  listar: () =>
    api.get<Espacio[]>('/api/espacios').then((r) => r.data),

  listarPorZona: (idZona: string) =>
    api.get<Espacio[]>(`/api/espacios/zona/${idZona}`).then((r) => r.data),

  listarPorEstado: (estado: EstadoEspacio) =>
    api.get<Espacio[]>(`/api/espacios/estado/${estado}`).then((r) => r.data),

  disponiblesPorZona: (nombreZona: string) =>
    api.get<Espacio[]>(`/api/espacios/disponibles?zona=${encodeURIComponent(nombreZona)}`).then((r) => r.data),

  obtener: (id: string) =>
    api.get<Espacio>(`/api/espacios/${id}`).then((r) => r.data),

  crear: (data: EspacioCreateRequest) =>
    api.post<Espacio>('/api/espacios', data).then((r) => r.data),

  actualizar: (id: string, data: EspacioCreateRequest) =>
    api.put<Espacio>(`/api/espacios/${id}`, data).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/api/espacios/${id}`),

  cambiarEstado: (id: string, estado: EstadoEspacio) =>
    api.patch<Espacio>(`/api/espacios/${id}/estado?estado=${estado}`).then((r) => r.data),
};
