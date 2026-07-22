import api from '../lib/api';
import type { Ticket, TicketCreateRequest, TicketCloseRequest } from '../types';

export const ticketService = {
  listar: () =>
    api.get<Ticket[]>('/tickets').then((r) => r.data),

  listarActivos: () =>
    api.get<Ticket[]>('/tickets/activos').then((r) => r.data),

  obtener: (id: string) =>
    api.get<Ticket>(`/tickets/${id}`).then((r) => r.data),

  crear: (data: TicketCreateRequest) =>
    api.post<Ticket>('/tickets', data).then((r) => r.data),

  cerrar: (id: string, data: TicketCloseRequest = {}) =>
    api.patch<Ticket>(`/tickets/${id}`, data).then((r) => r.data),

  eliminar: (id: string) =>
    api.delete(`/tickets/${id}`),
};
