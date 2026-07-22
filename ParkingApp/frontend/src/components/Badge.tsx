import clsx from 'clsx';
import type { EstadoEspacio } from '../types';

const estadoConfig: Record<EstadoEspacio, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-green-100 text-green-700' },
  OCUPADO: { label: 'Ocupado', cls: 'bg-red-100 text-red-700' },
  RESERVADO: { label: 'Reservado', cls: 'bg-yellow-100 text-yellow-700' },
  MANTENIMIENTO: { label: 'Mantenimiento', cls: 'bg-slate-100 text-slate-600' },
};

export function EstadoBadge({ estado }: { estado: EstadoEspacio }) {
  const cfg = estadoConfig[estado] ?? { label: estado, cls: 'bg-slate-100 text-slate-600' };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.cls)}>
      {cfg.label}
    </span>
  );
}

export function RolBadge({ rol }: { rol: string }) {
  const clean = rol.replace('ROLE_', '');
  const cls =
    clean === 'ADMIN'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-blue-100 text-blue-700';
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cls)}>
      {clean}
    </span>
  );
}
