import api from '../lib/api';
import type { Vehiculo, VehiculoCreateRequest } from '../types';

export const vehiculoService = {
  listar: () =>
    api.get<Vehiculo[]>('/vehiculo').then((r) => r.data),

  obtener: (id: string) =>
    api.get<Vehiculo>(`/vehiculo/${id}`).then((r) => r.data),

  buscarPorPlaca: (placa: string) =>
    api.get<Vehiculo>(`/vehiculo/placa/${encodeURIComponent(placa)}`).then((r) => r.data),

  crear: (data: VehiculoCreateRequest) =>
    api.post<Vehiculo>('/vehiculo', data).then((r) => r.data),

  actualizar: (id: string, data: Partial<VehiculoCreateRequest['datos']>) =>
    api.patch<Vehiculo>(`/vehiculo/${id}`, data).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/vehiculo/${id}`),
};
