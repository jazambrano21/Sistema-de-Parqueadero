import { useEffect, useState, useCallback } from 'react';
import { Plus, Users, Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { tenantService } from '../services/tenantService';
import type { User, UserCreateRequest, Role, Tenant } from '../types';
import { getErrorMessage } from '../lib/api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

const emptyForm = (): UserCreateRequest => ({
  dni: '', firstName: '', middleName: '', lastName: '',
  email: '', phone: '', address: '', nationality: 'EC',
});

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openAssign, setOpenAssign] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserCreateRequest>(emptyForm());
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignTenantId, setAssignTenantId] = useState('');

  const load = useCallback(async () => {
    try {
      const [u, r, t] = await Promise.all([
        userService.listar(),
        userService.listarRoles(),
        tenantService.listar(),
      ]);
      setUsuarios(u);
      setRoles(r);
      setTenants(t);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(usuarios.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      u.person?.dni?.toLowerCase().includes(q) ||
      u.person?.email?.toLowerCase().includes(q) ||
      `${u.person?.firstName} ${u.person?.lastName}`.toLowerCase().includes(q),
    ));
  }, [usuarios, search]);

  const handleCreate = async () => {
    if (!form.dni || !form.firstName || !form.lastName || !form.email) {
      toast.error('DNI, nombre, apellido y email son requeridos');
      return;
    }
    setSaving(true);
    try {
      await userService.crear(form);
      toast.success('Usuario creado');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!openAssign) return;
    setSaving(true);
    try {
      if (assignRoleId) await userService.asignarRol(openAssign.id, assignRoleId);
      if (assignTenantId) await tenantService.asignarUsuario(assignTenantId, openAssign.id);
      toast.success('Asignaciones guardadas');
      setOpenAssign(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas del sistema"
        action={
          <button
            onClick={() => { setForm(emptyForm()); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text" placeholder="Buscar por nombre, DNI o email…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No hay usuarios" description="Crea el primer usuario del sistema"
          action={<button onClick={() => { setForm(emptyForm()); setOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Crear usuario</button>}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Usuario</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">DNI</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Tenant</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.username}</p>
                          <p className="text-slate-400 text-xs">{u.person?.firstName} {u.person?.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.person?.dni}</td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{u.person?.email}</td>
                    <td className="px-4 py-3">
                      {u.tenant ? (
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">{u.tenant.nombre}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Sin tenant</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <UserCheck className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <UserX className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setOpenAssign(u); setAssignRoleId(''); setAssignTenantId(''); }}
                        className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium transition-colors"
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Modal crear */}
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo usuario" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
              <input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="1234567890"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primer nombre *</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Juan"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Segundo nombre</label>
              <input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} placeholder="Carlos"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Pérez"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan@email.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0999999999"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Quito, Ecuador"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nacionalidad</label>
              <input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="EC"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal asignar rol/tenant */}
      <Modal open={!!openAssign} onClose={() => setOpenAssign(null)} title={`Asignar a ${openAssign?.username}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asignar rol</label>
            <select value={assignRoleId} onChange={(e) => setAssignRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin cambio</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Asignar tenant</label>
            <select value={assignTenantId} onChange={(e) => setAssignTenantId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sin cambio</option>
              {tenants.filter((t) => t.activo).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setOpenAssign(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">Cancelar</button>
            <button onClick={handleAssign} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
