import { useEffect, useState, useCallback } from 'react';
import { Plus, Building2, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantService } from '../services/tenantService';
import type { Tenant, TenantCreateRequest } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const emptyForm = (): TenantCreateRequest => ({ nombre: '', slug: '', descripcion: '' });

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantCreateRequest>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await tenantService.listar();
      setTenants(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Generar slug automáticamente desde el nombre
  const handleNombreChange = (nombre: string) => {
    const slug = nombre.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    setForm((f) => ({ ...f, nombre, slug: editTenant ? f.slug : slug }));
  };

  const handleOpen = (t?: Tenant) => {
    if (t) {
      setEditTenant(t);
      setForm({ nombre: t.nombre, slug: t.slug, descripcion: t.descripcion ?? '' });
    } else {
      setEditTenant(null);
      setForm(emptyForm());
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.slug) { toast.error('Nombre y slug son requeridos'); return; }
    setSaving(true);
    try {
      if (editTenant) {
        await tenantService.actualizar(editTenant.id, form);
        toast.success('Tenant actualizado');
      } else {
        await tenantService.crear(form);
        toast.success('Tenant creado');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (t: Tenant) => {
    if (!confirm(`¿Desactivar el tenant "${t.nombre}"? Sus usuarios perderán acceso.`)) return;
    try {
      await tenantService.desactivar(t.id);
      toast.success('Tenant desactivado');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenants"
        subtitle="Gestión de parqueaderos cliente"
        action={
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo tenant
          </button>
        }
      />

      {tenants.length === 0 ? (
        <EmptyState icon={Building2} title="No hay tenants registrados" description="Crea el primer parqueadero cliente"
          action={<button onClick={() => handleOpen()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Crear tenant</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tenants.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex items-center gap-1">
                  {t.activo ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      <XCircle className="w-3 h-3" /> Inactivo
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 text-base">{t.nombre}</h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">/{t.slug}</p>
              {t.descripcion && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{t.descripcion}</p>}
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                Creado: {new Date(t.creadoEn).toLocaleDateString('es-EC')}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleOpen(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                {t.activo && (
                  <button
                    onClick={() => handleDeactivate(t)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Desactivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editTenant ? 'Editar tenant' : 'Nuevo tenant'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={(e) => handleNombreChange(e.target.value)} placeholder="Parqueadero ESPE Norte"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug * <span className="text-xs text-slate-400 font-normal">(solo letras minúsculas, números y guiones)</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 py-2 bg-slate-50 text-slate-400 text-sm border-r border-slate-300">/</span>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="parqueadero-espe"
                className="flex-1 px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3}
              placeholder="Descripción del parqueadero cliente"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Guardando…' : editTenant ? 'Actualizar' : 'Crear tenant'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
