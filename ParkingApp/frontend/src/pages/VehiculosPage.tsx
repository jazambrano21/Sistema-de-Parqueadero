import { useEffect, useState, useCallback } from 'react';
import { Plus, Car, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { vehiculoService } from '../services/vehiculoService';
import type { Vehiculo, VehiculoCreateRequest, TipoVehiculo, Clasificacion } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const clasificaciones: Clasificacion[] = ['Gasolina', 'Diésel', 'Eléctrico', 'Híbrido'];

const emptyForm = (): VehiculoCreateRequest => ({
  tipo: 'AUTO',
  datos: {
    placa: '', marca: '', modelo: '', color: '', anio: new Date().getFullYear(),
    clasificacion: 'Gasolina', numeroPuertas: 4, capacidadMaletero: 300,
  },
});

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [filtered, setFiltered] = useState<Vehiculo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<VehiculoCreateRequest>(emptyForm());

  const load = useCallback(async () => {
    try {
      const data = await vehiculoService.listar();
      setVehiculos(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(vehiculos.filter((v) =>
      v.placa.toLowerCase().includes(q) ||
      v.marca.toLowerCase().includes(q) ||
      v.modelo.toLowerCase().includes(q),
    ));
  }, [vehiculos, search]);

  const setDatos = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, datos: { ...f.datos, [key]: value } }));

  const handleTipoChange = (tipo: TipoVehiculo) => {
    setForm({
      tipo,
      datos: {
        ...form.datos,
        ...(tipo === 'AUTO' ? { numeroPuertas: 4, capacidadMaletero: 300 } : {}),
        ...(tipo === 'MOTO' ? { tipoMoto: 'Deportiva' } : {}),
        ...(tipo === 'CAMIONETA' ? { cabina: 'Doble', capacidadCarga: 1000 } : {}),
      },
    });
  };

  const handleSave = async () => {
    const d = form.datos;
    if (!d.placa || !d.marca || !d.modelo || !d.color || !d.anio) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      await vehiculoService.crear({ ...form, datos: { ...d, placa: d.placa.toUpperCase() } });
      toast.success('Vehículo registrado');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (v: Vehiculo) => {
    if (!confirm(`¿Eliminar el vehículo ${v.placa}?`)) return;
    try {
      await vehiculoService.eliminar(v.id);
      toast.success('Vehículo eliminado');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const tipoIcon = (tipo: string) => {
    if (tipo === 'MOTO') return '🏍️';
    if (tipo === 'CAMIONETA') return '🛻';
    return '🚗';
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vehículos"
        subtitle="Registro del parque vehicular"
        action={
          <button
            onClick={() => { setForm(emptyForm()); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Registrar vehículo
          </button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por placa, marca o modelo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No hay vehículos registrados"
          description="Registra el primer vehículo"
          action={
            <button onClick={() => { setForm(emptyForm()); setOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Registrar vehículo
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Tipo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Placa</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Marca / Modelo</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Color</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Año</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Combustible</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xl">{tipoIcon((v as any).tipo)}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800">{v.placa}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{v.marca}</p>
                      <p className="text-slate-400 text-xs">{v.modelo}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{v.color}</td>
                    <td className="px-4 py-3 text-slate-600">{v.anio}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{v.clasificacion}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(v)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} vehículo{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar vehículo" size="lg">
        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de vehículo *</label>
            <div className="flex gap-3">
              {(['AUTO', 'MOTO', 'CAMIONETA'] as TipoVehiculo[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTipoChange(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.tipo === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'AUTO' ? '🚗' : t === 'MOTO' ? '🏍️' : '🛻'} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Datos comunes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
              <input value={form.datos.placa} onChange={(e) => setDatos('placa', e.target.value.toUpperCase())} placeholder="ABC-1234"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Marca *</label>
              <input value={form.datos.marca} onChange={(e) => setDatos('marca', e.target.value)} placeholder="Toyota"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
              <input value={form.datos.modelo} onChange={(e) => setDatos('modelo', e.target.value)} placeholder="Corolla"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color *</label>
              <input value={form.datos.color} onChange={(e) => setDatos('color', e.target.value)} placeholder="Blanco"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Año *</label>
              <input type="number" value={form.datos.anio} onChange={(e) => setDatos('anio', parseInt(e.target.value))} min={1990} max={2030}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Combustible *</label>
              <select value={form.datos.clasificacion} onChange={(e) => setDatos('clasificacion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {clasificaciones.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {form.tipo === 'AUTO' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de puertas</label>
                <input type="number" value={form.datos.numeroPuertas ?? 4} onChange={(e) => setDatos('numeroPuertas', parseInt(e.target.value))} min={2} max={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad maletero (L)</label>
                <input type="number" value={form.datos.capacidadMaletero ?? 300} onChange={(e) => setDatos('capacidadMaletero', parseInt(e.target.value))} min={0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}
          {form.tipo === 'MOTO' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de moto</label>
              <select value={form.datos.tipoMoto ?? 'Deportiva'} onChange={(e) => setDatos('tipoMoto', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['Deportiva', 'Crucero', 'Naked', 'Scooter', 'Enduro'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          {form.tipo === 'CAMIONETA' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de cabina</label>
                <select value={form.datos.cabina ?? 'Doble'} onChange={(e) => setDatos('cabina', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Simple</option>
                  <option>Doble</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad de carga (kg)</label>
                <input type="number" value={form.datos.capacidadCarga ?? 1000} onChange={(e) => setDatos('capacidadCarga', parseInt(e.target.value))} min={0}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Registrando…' : 'Registrar vehículo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
