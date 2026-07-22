import api from '../lib/api';
import type { User, UserCreateRequest, Role } from '../types';

export const userService = {
  listar: () =>
    api.get<User[]>('/api/users').then((r) => r.data),

  obtener: (id: string) =>
    api.get<User>(`/api/users/${id}`).then((r) => r.data),

  crear: (data: UserCreateRequest) =>
    api.post<User>('/api/users', data).then((r) => r.data),

  buscarPorDni: (dni: string) =>
    api.get<User>(`/api/users/dni/${dni}`).then((r) => r.data),

  // Roles
  listarRoles: () =>
    api.get<Role[]>('/api/roles').then((r) => r.data),

  crearRol: (nombre: string, descripcion?: string) =>
    api.post<Role>('/api/roles', { name: nombre, description: descripcion }).then((r) => r.data),

  asignarRol: (userId: string, roleId: string) =>
    api.post(`/api/users/${userId}/roles/${roleId}`),
};
