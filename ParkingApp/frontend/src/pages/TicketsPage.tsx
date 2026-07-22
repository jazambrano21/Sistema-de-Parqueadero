import { useEffect, useState, useCallback } from 'react';
import { Plus, Ticket, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { ticketService } from '../services/ticketService';
import { zonaService } from '../services/zonaService';
import { espacioService } from '../services/espacioService';
import type { Ticket as TTicket, TicketCreateRequest, Zona, Espacio } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

type Tab = 'activos' | 'todos';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TTicket[]>([]);
  const [filtered, setFiltered] = useState<TTicket[]>([]);
  const [tab, setTab] = useState<Tab>('activos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openClose, setOpenClose] = useState<TTicket | null>(null);
  const [saving, setSaving] = useState(false);

  const [zonas, setZonas] = useState<Zona[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [form, setForm] = useState<TicketCreateRequest>({
    placa: '',
    dni: '',
    idEspacio: '',
    nombreZona: '',
  });
  const [zonaSeleccionada, setZonaSeleccionada] = useState('');

  const load = useCallback(async () => {
    try {
      const data = tab === 'activos'
        ? await ticketService.listarActivos()
        : await ticketService.listar();
      setTickets(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      tickets.filter(
        (t) =>
          t.placa.toLowerCase().includes(q) ||
          t.dni.toLowerCase().includes(q) ||
          t.nombreZona.toLowerCase().includes(q),
      ),
    );
  }, [tickets, search]);

  const loadZonas = async () => {
    try {
      const data = await zonaService.listar();
      setZonas(data);
    } catch { /* ignore */ }
  };

  const loadEspacios = async (_idZona: string, nombreZona: string) => {
    try {
      const data = await espacioService.disponiblesPorZona(nombreZona);
      setEspacios(data);
    } catch { /* ignore */ }
  };

  const handleOpenCreate = () => {
    loadZonas();
    setForm({ placa: '', dni: '', idEspacio: '', nombreZona: '' });
    setZonaSeleccionada('');
    setEspacios([]);
    setOpenCreate(true);
  };

  const handleZonaChange = (id: string) => {
    const zona = zonas.find((z) => z.id === id);
    setZonaSeleccionada(id);
    setForm((f) => ({ ...f, nombreZona: zona?.nombre ?? '', idEspacio: '' }));
    if (zona) loadEspacios(id, zona.nombre);
  };

  const handleCreate = async () => {
    if (!form.placa || !form.dni || !form.idEspacio) {
      toast.error('Completa todos los campos');
      return;
    }
    setSaving(true);
    try {
      await ticketService.crear(form);
      toast.success('Ticket creado');
      setOpenCreate(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!openClose) return;
    setSaving(true);
    try {
      await ticketService.cerrar(openClose.id);
      toast.success('Ticket cerrado — vehículo egresó');
      setOpenClose(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const duracion = (ingreso: string) => {
    const diff = Date.now() - new Date(ingreso).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tickets"
        subtitle="Registro de entrada y salida de vehículos"
        action={
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo ticket
          </button>
        }
      />

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['activos', 'todos'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'activos' ? 'Activos' : 'Todos'}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, DNI o zona…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No hay tickets"
          description={tab === 'activos' ? 'No hay vehículos en el parqueadero' : 'No se encontraron tickets'}
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Crear primer ticket
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Placa</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">DNI</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Zona</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Ingreso</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Duración</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{t.placa}</td>
                    <td className="px-4 py-3 text-slate-600">{t.dni}</td>
                    <td className="px-4 py-3 text-slate-600">{t.nombreZona}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(t.fechaHoraIngreso).toLocaleString('es-EC', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {t.activo ? (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Clock className="w-3.5 h-3.5" />
                          {duracion(t.fechaHoraIngreso)}
                        </span>
                      ) : (
                        t.fechaHoraSalida
                          ? duracion(t.fechaHoraIngreso)
                          : '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {t.activo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Cerrado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      ${(t.valorRecaudado ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {t.activo && (
                        <button
                          onClick={() => setOpenClose(t)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium transition-colors"
                        >
                          Cerrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Modal crear */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Nuevo ticket">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
              <input
                value={form.placa}
                onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
              <input
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zona *</label>
            <select
              value={zonaSeleccionada}
              onChange={(e) => handleZonaChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar zona</option>
              {zonas.map((z) => (
                <option key={z.id} value={z.id}>{z.nombre} ({z.tipo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Espacio disponible *</label>
            <select
              value={form.idEspacio}
              onChange={(e) => setForm({ ...form, idEspacio: e.target.value })}
              disabled={!zonaSeleccionada}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar espacio</option>
              {espacios.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre} — {e.tipo}</option>
              ))}
            </select>
            {zonaSeleccionada && espacios.length === 0 && (
              <p className="text-red-500 text-xs mt-1">No hay espacios disponibles en esta zona</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setOpenCreate(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Creando…' : 'Crear ticket'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal cerrar */}
      <Modal open={!!openClose} onClose={() => setOpenClose(null)} title="Cerrar ticket" size="sm">
        {openClose && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Placa</span>
                <span className="font-semibold font-mono">{openClose.placa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DNI</span>
                <span className="font-medium">{openClose.dni}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zona</span>
                <span className="font-medium">{openClose.nombreZona}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ingresó</span>
                <span className="font-medium">
                  {new Date(openClose.fechaHoraIngreso).toLocaleString('es-EC')}
                </span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Tiempo</span>
                <span className="font-semibold">{duracion(openClose.fechaHoraIngreso)}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              El sistema calculará automáticamente el valor a cobrar (tarifa: $1.50/hora).
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpenClose(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {saving ? 'Cerrando…' : 'Confirmar salida'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
