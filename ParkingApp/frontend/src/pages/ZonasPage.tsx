import { useEffect, useState, useCallback } from 'react';
import { Plus, MapPin, ChevronDown, ChevronUp, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { zonaService } from '../services/zonaService';
import { espacioService } from '../services/espacioService';
import type { Zona, Espacio, ZonaCreateRequest, EspacioCreateRequest, TipoZona, TipoEspacio, EstadoEspacio } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { EstadoBadge } from '../components/Badge';
import clsx from 'clsx';

const tiposZona: TipoZona[] = ['GENERAL', 'VIP', 'ESTUDIANTES', 'PREFERENCIAL'];
const tiposEspacio: TipoEspacio[] = ['CUBIERTO', 'DESCUBIERTO', 'ACCESIBLE'];

const estadoColor: Record<EstadoEspacio, string> = {
  DISPONIBLE: 'bg-green-400',
  OCUPADO: 'bg-red-400',
  RESERVADO: 'bg-yellow-400',
  MANTENIMIENTO: 'bg-slate-400',
};

const estadoMenu: EstadoEspacio[] = ['DISPONIBLE', 'OCUPADO', 'RESERVADO', 'MANTENIMIENTO'];

export default function ZonasPage() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [espaciosPorZona, setEspaciosPorZona] = useState<Record<string, Espacio[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal zona
  const [openZona, setOpenZona] = useState(false);
  const [editZona, setEditZona] = useState<Zona | null>(null);
  const [zonaForm, setZonaForm] = useState<ZonaCreateRequest>({ nombre: '', descripcion: '', capacidad: 10, tipo: 'GENERAL' });
  const [saving, setSaving] = useState(false);

  // Modal espacio
  const [openEspacio, setOpenEspacio] = useState<string | null>(null); // zonaId
  const [espacioForm, setEspacioForm] = useState<EspacioCreateRequest>({ descripcion: '', tipo: 'CUBIERTO', idZona: '' });

  const load = useCallback(async () => {
    try {
      const data = await zonaService.listar();
      setZonas(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadEspacios = async (zonaId: string) => {
    if (espaciosPorZona[zonaId]) return;
    try {
      const data = await espacioService.listarPorZona(zonaId);
      setEspaciosPorZona((prev) => ({ ...prev, [zonaId]: data }));
    } catch { /* ignore */ }
  };

  const toggleExpand = (zonaId: string) => {
    if (expanded === zonaId) {
      setExpanded(null);
    } else {
      setExpanded(zonaId);
      loadEspacios(zonaId);
    }
  };

  const refreshEspacios = async (zonaId: string) => {
    try {
      const data = await espacioService.listarPorZona(zonaId);
      setEspaciosPorZona((prev) => ({ ...prev, [zonaId]: data }));
    } catch { /* ignore */ }
  };

  // ─── ZONA CRUD ───
  const handleOpenCreateZona = () => {
    setEditZona(null);
    setZonaForm({ nombre: '', descripcion: '', capacidad: 10, tipo: 'GENERAL' });
    setOpenZona(true);
  };

  const handleEditZona = (z: Zona) => {
    setEditZona(z);
    setZonaForm({ nombre: z.nombre, descripcion: z.descripcion ?? '', capacidad: z.capacidad, tipo: z.tipo });
    setOpenZona(true);
  };

  const handleSaveZona = async () => {
    if (!zonaForm.nombre || !zonaForm.capacidad) { toast.error('Nombre y capacidad son requeridos'); return; }
    setSaving(true);
    try {
      if (editZona) {
        await zonaService.actualizar(editZona.id, zonaForm);
        toast.success('Zona actualizada');
      } else {
        await zonaService.crear(zonaForm);
        toast.success('Zona creada');
      }
      setOpenZona(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZona = async (z: Zona) => {
    if (!confirm(`¿Eliminar la zona "${z.nombre}"?`)) return;
    try {
      await zonaService.eliminar(z.id);
      toast.success('Zona eliminada');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // ─── ESPACIO CRUD ───
  const handleOpenCreateEspacio = (zonaId: string) => {
    setEspacioForm({ descripcion: '', tipo: 'CUBIERTO', idZona: zonaId });
    setOpenEspacio(zonaId);
  };

  const handleSaveEspacio = async () => {
    setSaving(true);
    try {
      await espacioService.crear(espacioForm);
      toast.success('Espacio creado');
      setOpenEspacio(null);
      refreshEspacios(espacioForm.idZona);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (espacio: Espacio, estado: EstadoEspacio) => {
    try {
      await espacioService.cambiarEstado(espacio.id, estado);
      toast.success(`Espacio ${espacio.nombre} → ${estado}`);
      refreshEspacios(espacio.zona.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteEspacio = async (espacio: Espacio) => {
    if (!confirm(`¿Eliminar espacio "${espacio.nombre}"?`)) return;
    try {
      await espacioService.eliminar(espacio.id);
      toast.success('Espacio eliminado');
      refreshEspacios(espacio.zona.id);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Zonas y Espacios"
        subtitle="Gestión del mapa de parqueadero"
        action={
          <button
            onClick={handleOpenCreateZona}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva zona
          </button>
        }
      />

      {zonas.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No hay zonas registradas"
          description="Crea la primera zona del parqueadero"
          action={
            <button onClick={handleOpenCreateZona} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Crear zona
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {zonas.map((zona) => {
            const esp = espaciosPorZona[zona.id] ?? [];
            const libres = esp.filter((e) => e.estado === 'DISPONIBLE').length;
            const pct = esp.length ? Math.round((esp.filter((e) => e.estado === 'OCUPADO').length / esp.length) * 100) : 0;
            const isOpen = expanded === zona.id;

            return (
              <div key={zona.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Zona header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleExpand(zona.id)}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-800">{zona.nombre}</p>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{zona.tipo}</span>
                      {zona.codigo && <span className="text-xs font-mono text-slate-400">{zona.codigo}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: pct < 60 ? '#22c55e' : pct < 85 ? '#f59e0b' : '#ef4444' }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {libres} libre{libres !== 1 ? 's' : ''} / {zona.capacidad} total
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditZona(zona); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteZona(zona); }}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Espacios */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-slate-100">
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> Espacios
                      </p>
                      <button
                        onClick={() => handleOpenCreateEspacio(zona.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar espacio
                      </button>
                    </div>

                    {esp.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">No hay espacios en esta zona</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {esp.map((espacio) => (
                          <div key={espacio.id} className="group relative border border-slate-200 rounded-xl p-3 hover:shadow-md transition-all">
                            <div className={clsx('w-3 h-3 rounded-full mb-2', estadoColor[espacio.estado])} />
                            <p className="text-xs font-semibold text-slate-700 truncate">{espacio.nombre}</p>
                            <p className="text-xs text-slate-400">{espacio.tipo}</p>
                            <EstadoBadge estado={espacio.estado} />

                            {/* Hover menu */}
                            <div className="absolute inset-0 bg-white/95 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
                              <p className="text-xs font-semibold text-slate-700 mb-1">{espacio.nombre}</p>
                              {estadoMenu.filter((s) => s !== espacio.estado).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleCambiarEstado(espacio, s)}
                                  className={clsx('w-full text-xs px-2 py-1 rounded-lg font-medium transition-colors',
                                    s === 'DISPONIBLE' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                    s === 'OCUPADO' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                    s === 'RESERVADO' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                    'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  )}
                                >
                                  {s}
                                </button>
                              ))}
                              <button
                                onClick={() => handleDeleteEspacio(espacio)}
                                className="w-full text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 mt-1"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Leyenda */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100">
                      {Object.entries(estadoColor).map(([estado, color]) => (
                        <div key={estado} className="flex items-center gap-1.5 text-xs text-slate-500">
                          <div className={clsx('w-2.5 h-2.5 rounded-full', color)} />
                          {estado}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal zona */}
      <Modal
        open={openZona}
        onClose={() => setOpenZona(false)}
        title={editZona ? 'Editar zona' : 'Nueva zona'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              value={zonaForm.nombre}
              onChange={(e) => setZonaForm({ ...zonaForm, nombre: e.target.value })}
              placeholder="Ej: Zona VIP Norte"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select
                value={zonaForm.tipo}
                onChange={(e) => setZonaForm({ ...zonaForm, tipo: e.target.value as TipoZona })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tiposZona.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad *</label>
              <input
                type="number"
                min={1}
                value={zonaForm.capacidad}
                onChange={(e) => setZonaForm({ ...zonaForm, capacidad: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              value={zonaForm.descripcion}
              onChange={(e) => setZonaForm({ ...zonaForm, descripcion: e.target.value })}
              rows={2}
              placeholder="Descripción opcional"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpenZona(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
              Cancelar
            </button>
            <button onClick={handleSaveZona} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Guardando…' : editZona ? 'Actualizar' : 'Crear zona'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal espacio */}
      <Modal
        open={!!openEspacio}
        onClose={() => setOpenEspacio(null)}
        title="Nuevo espacio"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de espacio *</label>
            <select
              value={espacioForm.tipo}
              onChange={(e) => setEspacioForm({ ...espacioForm, tipo: e.target.value as TipoEspacio })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tiposEspacio.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <input
              value={espacioForm.descripcion}
              onChange={(e) => setEspacioForm({ ...espacioForm, descripcion: e.target.value })}
              placeholder="Opcional"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpenEspacio(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
              Cancelar
            </button>
            <button onClick={handleSaveEspacio} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Creando…' : 'Crear espacio'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
