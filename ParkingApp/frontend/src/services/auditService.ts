import api from '../lib/api';
import type { EventoAuditoria } from '../types';

export const auditService = {
  listar: () =>
    api.get<EventoAuditoria[]>('/api/audit').then((r) => r.data),

  obtener: (id: string) =>
    api.get<EventoAuditoria>(`/api/audit/${id}`).then((r) => r.data),
};
