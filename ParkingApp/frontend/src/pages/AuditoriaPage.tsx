import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditService } from '../services/auditService';
import type { EventoAuditoria, AccionAuditoria } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import clsx from 'clsx';

const accionColor: Record<AccionAuditoria, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-violet-100 text-violet-700',
  LOGOUT: 'bg-slate-100 text-slate-600',
};

export default function AuditoriaPage() {
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [filtered, setFiltered] = useState<EventoAuditoria[]>([]);
  const [search, setSearch] = useState('');
  const [accionFiltro, setAccionFiltro] = useState<AccionAuditoria | ''>('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventoAuditoria | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await auditService.listar();
      // Ordenar más reciente primero
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setEventos(sorted);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      eventos.filter((e) => {
        const matchSearch =
          e.servicio.toLowerCase().includes(q) ||
          e.entidad.toLowerCase().includes(q) ||
          e.usuario.toLowerCase().includes(q) ||
          e.accion.toLowerCase().includes(q);
        const matchAccion = accionFiltro ? e.accion === accionFiltro : true;
        return matchSearch && matchAccion;
      }),
    );
  }, [eventos, search, accionFiltro]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Auditoría"
        subtitle="Registro de todas las acciones del sistema"
        action={
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Buscar por servicio, entidad, usuario…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={accionFiltro}
          onChange={(e) => setAccionFiltro(e.target.value as AccionAuditoria | '')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todas las acciones</option>
          {(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'] as AccionAuditoria[]).map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No hay eventos de auditoría" description="Los eventos aparecerán aquí cuando el sistema registre actividad" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Fecha</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Servicio</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Acción</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Entidad</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Usuario</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">IP</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(ev.timestamp).toLocaleString('es-EC', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-mono">{ev.servicio}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', accionColor[ev.accion] ?? 'bg-slate-100 text-slate-600')}>
                        {ev.accion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{ev.entidad}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.usuario}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{ev.ip}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(ev)}
                        className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium"
                      >
                        Ver datos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} evento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Modal detalle */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle del evento" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Servicio', selected.servicio],
                ['Acción', selected.accion],
                ['Entidad', selected.entidad],
                ['Usuario', selected.usuario],
                ['IP', selected.ip],
                ['MAC', selected.mac],
                ['Fecha', new Date(selected.timestamp).toLocaleString('es-EC')],
              ].map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-slate-400 text-xs">{k}</p>
                  <p className="font-medium text-slate-700 mt-0.5 break-all">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Datos adicionales</p>
              <pre className="bg-slate-900 text-green-400 text-xs p-4 rounded-xl overflow-auto max-h-60 leading-relaxed">
                {JSON.stringify(selected.datos, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
