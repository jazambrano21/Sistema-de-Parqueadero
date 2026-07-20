/* ─────────────────────────────────────────────────────────────
   Sistema de Parqueadero — Frontend completo
   Vanilla JS + Tailwind CSS
───────────────────────────────────────────────────────────── */

const BASE = window.API_BASE || 'http://localhost:8000';

const URLS = {
  login:     `${BASE}/api/auth/login`,
  users:     `${BASE}/api/users`,
  roles:     `${BASE}/api/roles`,
  zonas:     `${BASE}/api/zonas`,
  espacios:  `${BASE}/api/espacios`,
  vehiculos: `${BASE}/vehiculo`,
  tickets:   `${BASE}/tickets`,
  audit:     `${BASE}/api/audit`,
  sse:       `${BASE}/api/espacios/sse`,
};

// ── Estado global ──────────────────────────────────────────
let token       = localStorage.getItem('token') || null;
let currentUser = localStorage.getItem('username') || '';
let eventSource = null;
let allZonas    = [];

// ── Helpers HTTP ───────────────────────────────────────────
const headers = (json = true) => {
  const h = {};
  if (json) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers(), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
};

// ── Toast ──────────────────────────────────────────────────
const toast = (msg, type = 'success') => {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `fixed bottom-6 right-6 px-5 py-3 rounded-lg shadow-lg text-sm z-50 transition-all ${
    type === 'error' ? 'bg-red-600' : 'bg-gray-800'
  } text-white`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
};

// ── Modales ────────────────────────────────────────────────
const openModal  = (id) => document.getElementById(id).classList.remove('hidden');
const closeModal = (id) => document.getElementById(id).classList.add('hidden');

// Cerrar modal al clic fuera
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ── Navegación entre tabs ──────────────────────────────────
const showTab = (name) => {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.remove('hidden');
  document.getElementById(`nav-${name}`).classList.add('active');

  // Cargar datos al cambiar tab
  const loaders = {
    dashboard: cargarDashboard,
    tickets:   loadTickets,
    zonas:     loadZonas,
    espacios:  loadEspacios,
    vehiculos: loadVehiculos,
    usuarios:  loadUsuarios,
    auditoria: loadAuditoria,
  };
  if (loaders[name]) loaders[name]();
};

// ── LOGIN ──────────────────────────────────────────────────
window.iniciarSesion = async () => {
  const username = document.getElementById('usernameLogin').value.trim();
  const password = document.getElementById('passwordLogin').value.trim();
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Ingrese usuario y contraseña';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const data = await api(URLS.login, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    token = data.accessToken || data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('username', data.username || username);
    currentUser = data.username || username;

    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('navUser').textContent = `👤 ${currentUser}`;

    showTab('dashboard');
  } catch (e) {
    errEl.textContent = 'Usuario o contraseña incorrectos';
    errEl.classList.remove('hidden');
  }
};

window.cerrarSesion = () => {
  if (eventSource) { eventSource.close(); eventSource = null; }
  token = null;
  localStorage.clear();
  document.getElementById('appView').classList.add('hidden');
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('usernameLogin').value = '';
  document.getElementById('passwordLogin').value = '';
};

// ── DASHBOARD ─────────────────────────────────────────────
const cargarDashboard = async () => {
  try {
    const [zonas, espacios] = await Promise.all([api(URLS.zonas), api(URLS.espacios)]);
    allZonas = zonas;
    renderDashboard(zonas, espacios);
    setConStatus(true);
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('es-EC');
    conectarSSE();
  } catch (e) {
    setConStatus(false);
    document.getElementById('zonasContainer').innerHTML =
      `<div class="empty-state"><p>Error cargando datos: ${e.message}</p></div>`;
  }
};

const setConStatus = (ok) => {
  const ind = document.getElementById('indicator');
  const st  = document.getElementById('statusText');
  if (!ind) return;
  ind.className = `w-3 h-3 rounded-full inline-block ${ok ? 'bg-green-500' : 'bg-red-500'}`;
  st.textContent = ok ? 'Conectado' : 'Desconectado';
};

const renderDashboard = (zonas, espacios) => {
  const c = document.getElementById('zonasContainer');
  document.getElementById('totalEspacios').textContent = `${espacios.length} espacios`;
  if (!zonas.length) {
    c.innerHTML = '<div class="empty-state"><p>No hay zonas registradas</p></div>';
    return;
  }
  c.innerHTML = zonas.map(z => {
    const esp = espacios.filter(e => e.idZona === z.id);
    return `
      <section class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xl font-bold text-gray-800">${z.nombre}</h3>
          <span class="badge badge-blue">${esp.length} espacios · ${z.tipo}</span>
        </div>
        ${esp.length ? `
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            ${esp.map(renderEspacioCard).join('')}
          </div>` : '<p class="text-gray-400 text-sm">Sin espacios</p>'}
      </section>`;
  }).join('');
};

const renderEspacioCard = (esp) => {
  const estado = esp.estado || 'DESCONOCIDO';
  const colors = {
    DISPONIBLE: 'bg-green-50 border-green-500',
    OCUPADO: 'bg-red-50 border-red-500',
    RESERVADO: 'bg-yellow-50 border-yellow-500',
    MANTENIMIENTO: 'bg-gray-50 border-gray-400',
  };
  const badges = {
    DISPONIBLE: 'badge-green', OCUPADO: 'badge-red',
    RESERVADO: 'badge-yellow', MANTENIMIENTO: 'badge-gray',
  };
  return `
    <div data-espacio-id="${esp.id}" class="espacio-card ${colors[estado] || 'bg-white border-gray-300'} rounded-lg shadow p-4 border-l-4">
      <div class="font-bold text-gray-800">${esp.nombre || 'Sin nombre'}</div>
      <div class="text-xs text-gray-500 mb-2">Tipo: ${esp.tipo || 'N/A'}</div>
      <div class="flex items-center justify-between mb-3">
        <span class="badge ${badges[estado] || 'badge-gray'}">${estado}</span>
        <span class="text-xs text-gray-400">${esp.id.slice(0,8)}</span>
      </div>
      ${estado === 'DISPONIBLE' ? `
        <button onclick="reservarEspacioRapido('${esp.id}','${esp.nombreZona || ''}','${esp.nombre || ''}')"
          class="w-full btn-primary text-xs py-1">Reservar</button>` : `
        <button disabled class="w-full bg-gray-300 text-gray-500 text-xs py-1 rounded cursor-not-allowed">No disponible</button>`}
    </div>`;
};

window.reservarEspacioRapido = async (idEspacio, nombreZona, nombreEspacio) => {
  const placa = document.getElementById('placaInput').value.trim();
  const dni   = document.getElementById('dniInput').value.trim();
  if (!placa || !dni) { toast('Ingresa placa y DNI arriba primero', 'error'); return; }
  if (!confirm(`¿Reservar ${nombreEspacio} en ${nombreZona}?`)) return;
  try {
    await api(URLS.tickets, { method: 'POST', body: JSON.stringify({ placa, dni, idEspacio, nombreZona }) });
    toast('✅ Ticket creado correctamente');
    cargarDashboard();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

const conectarSSE = () => {
  if (eventSource) eventSource.close();
  const url = token ? `${URLS.sse}?token=${token}` : URLS.sse;
  eventSource = new EventSource(url);
  eventSource.addEventListener('cambio-espacio', e => {
    try {
      const esp = JSON.parse(e.data);
      const card = document.querySelector(`[data-espacio-id="${esp.id}"]`);
      if (card) card.outerHTML = renderEspacioCard(esp);
      document.getElementById('lastUpdate').textContent = new Date().toLocaleString('es-EC');
    } catch {}
  });
  eventSource.onerror = () => setConStatus(false);
  eventSource.onopen  = () => setConStatus(true);
};

// ── TICKETS ───────────────────────────────────────────────
const loadTickets = async () => {
  const c = document.getElementById('ticketsTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const data = await api(URLS.tickets);
    if (!data.length) { c.innerHTML = '<div class="empty-state"><p>No hay tickets</p></div>'; return; }
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr>
            <th>Placa</th><th>DNI</th><th>Zona</th>
            <th>Ingreso</th><th>Salida</th><th>Valor</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            ${data.map(t => `
              <tr>
                <td class="font-mono font-bold">${t.placa}</td>
                <td>${t.dni}</td>
                <td>${t.nombreZona}</td>
                <td>${fmtDate(t.fechaHoraIngreso)}</td>
                <td>${t.fechaHoraSalida ? fmtDate(t.fechaHoraSalida) : '—'}</td>
                <td>${t.valorRecaudado ? '$' + Number(t.valorRecaudado).toFixed(2) : '—'}</td>
                <td><span class="badge ${t.activo ? 'badge-green' : 'badge-gray'}">${t.activo ? 'ACTIVO' : 'CERRADO'}</span></td>
                <td class="flex gap-2">
                  ${t.activo ? `<button onclick="abrirCerrarTicket('${t.id}')" class="btn-danger btn-sm">Cerrar</button>` : ''}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

// Abrir modal para cerrar ticket
window.abrirCerrarTicket = (id) => {
  document.getElementById('ct_id').value = id;
  document.getElementById('ct_valor').value = 0;
  openModal('modalCerrarTicket');
};

window.cerrarTicket = async () => {
  const id    = document.getElementById('ct_id').value;
  const valor = parseFloat(document.getElementById('ct_valor').value) || 0;
  try {
    await api(`${URLS.tickets}/${id}`, { method: 'PATCH', body: JSON.stringify({ valorRecaudado: valor }) });
    toast('✅ Ticket cerrado');
    closeModal('modalCerrarTicket');
    loadTickets();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// Crear ticket desde modal
window.crearTicket = async () => {
  const placa     = document.getElementById('tk_placa').value.trim();
  const dni       = document.getElementById('tk_dni').value.trim();
  const idEspacio = document.getElementById('tk_espacio').value;
  const zonaEl    = document.getElementById('tk_zona');
  const nombreZona = zonaEl.options[zonaEl.selectedIndex]?.text || '';

  if (!placa || !dni || !idEspacio) { toast('Completa todos los campos', 'error'); return; }
  try {
    await api(URLS.tickets, { method: 'POST', body: JSON.stringify({ placa, dni, idEspacio, nombreZona }) });
    toast('✅ Ticket creado');
    closeModal('modalTicket');
    loadTickets();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// Cargar espacios disponibles al seleccionar zona en modal ticket
window.loadEspaciosByZona = async () => {
  const zonaEl = document.getElementById('tk_zona');
  const zonaId = zonaEl.value;
  const espEl  = document.getElementById('tk_espacio');
  espEl.innerHTML = '<option>Cargando...</option>';
  try {
    const espacios = await api(`${URLS.espacios}/zona/${zonaId}/estado/DISPONIBLE`);
    espEl.innerHTML = espacios.length
      ? espacios.map(e => `<option value="${e.id}">${e.nombre} (${e.tipo})</option>`).join('')
      : '<option value="">Sin espacios disponibles</option>';
  } catch { espEl.innerHTML = '<option value="">Error cargando espacios</option>'; }
};

// ── ZONAS ─────────────────────────────────────────────────
const loadZonas = async () => {
  const c = document.getElementById('zonasTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const data = await api(URLS.zonas);
    allZonas = data;
    if (!data.length) { c.innerHTML = '<div class="empty-state"><p>No hay zonas</p></div>'; return; }
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Código</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${data.map(z => `
              <tr>
                <td class="font-semibold">${z.nombre}</td>
                <td class="font-mono text-xs">${z.codigo}</td>
                <td><span class="badge badge-blue">${z.tipo}</span></td>
                <td>${z.capacidad}</td>
                <td><span class="badge ${z.activo ? 'badge-green' : 'badge-gray'}">${z.espacio || 'N/A'}</span></td>
                <td class="flex gap-2">
                  <button onclick="editarZona('${z.id}','${z.nombre}','${z.descripcion||''}','${z.capacidad}','${z.tipo}')" class="btn-edit btn-sm">Editar</button>
                  <button onclick="eliminarZona('${z.id}')" class="btn-danger btn-sm">Eliminar</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

window.editarZona = (id, nombre, descripcion, capacidad, tipo) => {
  document.getElementById('z_id').value = id;
  document.getElementById('z_nombre').value = nombre;
  document.getElementById('z_descripcion').value = descripcion;
  document.getElementById('z_capacidad').value = capacidad;
  document.getElementById('z_tipo').value = tipo;
  document.getElementById('modalZonaTitle').textContent = 'Editar Zona';
  openModal('modalZona');
};

window.guardarZona = async () => {
  const id          = document.getElementById('z_id').value;
  const nombre      = document.getElementById('z_nombre').value.trim();
  const descripcion = document.getElementById('z_descripcion').value.trim();
  const capacidad   = parseInt(document.getElementById('z_capacidad').value);
  const tipo        = document.getElementById('z_tipo').value;
  if (!nombre || !capacidad) { toast('Completa nombre y capacidad', 'error'); return; }
  try {
    if (id) {
      await api(`${URLS.zonas}/${id}`, { method: 'PUT', body: JSON.stringify({ nombre, descripcion, capacidad, tipo }) });
      toast('✅ Zona actualizada');
    } else {
      await api(URLS.zonas, { method: 'POST', body: JSON.stringify({ nombre, descripcion, capacidad, tipo }) });
      toast('✅ Zona creada');
    }
    document.getElementById('z_id').value = '';
    document.getElementById('modalZonaTitle').textContent = 'Nueva Zona';
    closeModal('modalZona');
    loadZonas();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

window.eliminarZona = async (id) => {
  if (!confirm('¿Eliminar esta zona?')) return;
  try {
    await api(`${URLS.zonas}/${id}`, { method: 'DELETE' });
    toast('✅ Zona eliminada');
    loadZonas();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// ── ESPACIOS ──────────────────────────────────────────────
const loadEspacios = async () => {
  const c = document.getElementById('espaciosTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const [espacios, zonas] = await Promise.all([api(URLS.espacios), api(URLS.zonas)]);
    allZonas = zonas;
    if (!espacios.length) { c.innerHTML = '<div class="empty-state"><p>No hay espacios</p></div>'; return; }
    const zonaMap = Object.fromEntries(zonas.map(z => [z.id, z.nombre]));
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Zona</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            ${espacios.map(e => `
              <tr>
                <td class="font-semibold">${e.nombre}</td>
                <td>${zonaMap[e.idZona] || e.idZona}</td>
                <td><span class="badge badge-blue">${e.tipo}</span></td>
                <td><span class="badge ${estadoBadgeClass(e.estado)}">${e.estado}</span></td>
                <td class="flex gap-2">
                  <button onclick="cambiarEstadoEspacio('${e.id}')" class="btn-edit btn-sm">Estado</button>
                  <button onclick="eliminarEspacio('${e.id}')" class="btn-danger btn-sm">Eliminar</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

const estadoBadgeClass = (e) => ({
  DISPONIBLE: 'badge-green', OCUPADO: 'badge-red',
  RESERVADO: 'badge-yellow', MANTENIMIENTO: 'badge-gray',
}[e] || 'badge-gray');

// Abrir modal con zonas cargadas
const openModalEspacio = async () => {
  const sel = document.getElementById('esp_zona');
  sel.innerHTML = '<option>Cargando...</option>';
  try {
    const zonas = allZonas.length ? allZonas : await api(URLS.zonas);
    sel.innerHTML = zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Error</option>'; }
  document.getElementById('esp_id').value = '';
  document.getElementById('modalEspacioTitle').textContent = 'Nuevo Espacio';
  openModal('modalEspacio');
};
// Override del botón en HTML
window.openModalEspacioBtn = openModalEspacio;

window.guardarEspacio = async () => {
  const id          = document.getElementById('esp_id').value;
  const idZona      = document.getElementById('esp_zona').value;
  const tipo        = document.getElementById('esp_tipo').value;
  const descripcion = document.getElementById('esp_descripcion').value.trim();
  if (!idZona) { toast('Selecciona una zona', 'error'); return; }
  try {
    if (id) {
      await api(`${URLS.espacios}/${id}`, { method: 'PUT', body: JSON.stringify({ idZona, tipo, descripcion }) });
      toast('✅ Espacio actualizado');
    } else {
      await api(URLS.espacios, { method: 'POST', body: JSON.stringify({ idZona, tipo, descripcion }) });
      toast('✅ Espacio creado');
    }
    closeModal('modalEspacio');
    loadEspacios();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

window.cambiarEstadoEspacio = async (id) => {
  const estado = prompt('Nuevo estado:\nDISPONIBLE / OCUPADO / RESERVADO / MANTENIMIENTO');
  if (!estado) return;
  try {
    await api(`${URLS.espacios}/${id}/estado?estado=${estado.toUpperCase()}`, { method: 'PATCH' });
    toast('✅ Estado actualizado');
    loadEspacios();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

window.eliminarEspacio = async (id) => {
  if (!confirm('¿Eliminar este espacio?')) return;
  try {
    await api(`${URLS.espacios}/${id}`, { method: 'DELETE' });
    toast('✅ Espacio eliminado');
    loadEspacios();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// ── VEHÍCULOS ─────────────────────────────────────────────
const loadVehiculos = async () => {
  const c = document.getElementById('vehiculosTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const data = await api(URLS.vehiculos);
    if (!data.length) { c.innerHTML = '<div class="empty-state"><p>No hay vehículos</p></div>'; return; }
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr><th>Placa</th><th>Tipo</th><th>Marca</th><th>Modelo</th><th>Color</th><th>Año</th><th>Clasificación</th><th>Acciones</th></tr></thead>
          <tbody>
            ${data.map(v => `
              <tr>
                <td class="font-mono font-bold">${v.placa}</td>
                <td><span class="badge badge-blue">${v.tipo || 'N/A'}</span></td>
                <td>${v.marca}</td>
                <td>${v.modelo}</td>
                <td>${v.color}</td>
                <td>${v.anio}</td>
                <td>${v.clasificacion}</td>
                <td>
                  <button onclick="eliminarVehiculo('${v.id}')" class="btn-danger btn-sm">Eliminar</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

window.toggleVehiculoFields = () => {
  const tipo = document.getElementById('v_tipo').value;
  document.getElementById('autoFields').classList.toggle('hidden', tipo !== 'Auto');
  document.getElementById('camionetaFields').classList.toggle('hidden', tipo !== 'Camioneta');
  document.getElementById('motoFields').classList.toggle('hidden', tipo !== 'Motocicleta');
};

window.crearVehiculo = async () => {
  const tipo = document.getElementById('v_tipo').value;
  const datos = {
    placa:          document.getElementById('v_placa').value.trim(),
    marca:          document.getElementById('v_marca').value.trim(),
    modelo:         document.getElementById('v_modelo').value.trim(),
    color:          document.getElementById('v_color').value.trim(),
    anio:           parseInt(document.getElementById('v_anio').value),
    clasificacion:  document.getElementById('v_clasificacion').value,
  };
  if (tipo === 'Auto') {
    datos.numeroPuertas     = parseInt(document.getElementById('v_puertas').value);
    datos.capacidadMaletero = parseInt(document.getElementById('v_maletero').value);
  } else if (tipo === 'Camioneta') {
    datos.cabina          = document.getElementById('v_cabina').value;
    datos.capacidadCarga  = parseFloat(document.getElementById('v_carga').value);
  } else {
    datos.cilindrada = parseInt(document.getElementById('v_cilindrada').value);
    datos.tipoMoto   = document.getElementById('v_tipoMoto').value;
  }
  if (!datos.placa) { toast('Ingresa la placa', 'error'); return; }
  try {
    await api(URLS.vehiculos, { method: 'POST', body: JSON.stringify({ tipo, datos }) });
    toast('✅ Vehículo registrado');
    closeModal('modalVehiculo');
    loadVehiculos();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

window.eliminarVehiculo = async (id) => {
  if (!confirm('¿Eliminar este vehículo?')) return;
  try {
    await api(`${URLS.vehiculos}/${id}`, { method: 'DELETE' });
    toast('✅ Vehículo eliminado');
    loadVehiculos();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// ── USUARIOS ──────────────────────────────────────────────
const loadUsuarios = async () => {
  const c = document.getElementById('usuariosTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const data = await api(URLS.users);
    if (!data.length) { c.innerHTML = '<div class="empty-state"><p>No hay usuarios</p></div>'; return; }
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr>
            <th>Username</th><th>Nombres</th><th>Apellidos</th>
            <th>DNI</th><th>Email</th><th>Teléfono</th><th>Estado</th><th>Acciones</th>
          </tr></thead>
          <tbody>
            ${data.map(u => `
              <tr>
                <td class="font-mono font-bold">${u.username}</td>
                <td>${u.person?.firstName || ''} ${u.person?.middleName || ''}</td>
                <td>${u.person?.lastName || ''}</td>
                <td class="font-mono">${u.person?.dni || ''}</td>
                <td>${u.person?.email || ''}</td>
                <td>${u.person?.phone || ''}</td>
                <td><span class="badge ${u.active !== false ? 'badge-green' : 'badge-red'}">
                  ${u.active !== false ? 'Activo' : 'Inactivo'}
                </span></td>
                <td>
                  <button onclick="asignarRol('${u.id}')" class="btn-edit btn-sm">Rol</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

window.crearUsuario = async () => {
  const body = {
    firstName:   document.getElementById('u_firstName').value.trim(),
    middleName:  document.getElementById('u_middleName').value.trim(),
    lastName:    document.getElementById('u_lastName').value.trim(),
    dni:         document.getElementById('u_dni').value.trim(),
    email:       document.getElementById('u_email').value.trim(),
    phone:       document.getElementById('u_phone').value.trim(),
    address:     document.getElementById('u_address').value.trim(),
    nationality: document.getElementById('u_nationality').value.trim(),
  };
  if (!body.firstName || !body.lastName || !body.dni || !body.email) {
    toast('Completa los campos obligatorios', 'error'); return;
  }
  try {
    await api(URLS.users, { method: 'POST', body: JSON.stringify(body) });
    toast('✅ Usuario creado');
    closeModal('modalUsuario');
    loadUsuarios();
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

window.asignarRol = async (userId) => {
  try {
    const roles = await api(URLS.roles);
    const lista = roles.map((r, i) => `${i + 1}. ${r.name}`).join('\n');
    const idx   = parseInt(prompt(`Selecciona rol (número):\n${lista}`));
    if (isNaN(idx) || idx < 1 || idx > roles.length) { toast('Selección inválida', 'error'); return; }
    const roleId = roles[idx - 1].id;
    await api(`${URLS.users}/${userId}/roles/${roleId}`, { method: 'POST' });
    toast('✅ Rol asignado');
  } catch (e) { toast(`Error: ${e.message}`, 'error'); }
};

// ── AUDITORÍA ─────────────────────────────────────────────
window.loadAuditoria = async () => {
  const c = document.getElementById('auditoriaTable');
  c.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
  try {
    const data = await api(URLS.audit);
    if (!data.length) { c.innerHTML = '<div class="empty-state"><p>Sin eventos de auditoría</p></div>'; return; }
    c.innerHTML = `
      <div class="bg-white rounded shadow overflow-x-auto">
        <table class="data-table">
          <thead><tr>
            <th>Fecha</th><th>Servicio</th><th>Entidad</th>
            <th>Acción</th><th>Usuario</th><th>IP</th>
          </tr></thead>
          <tbody>
            ${data.map(a => `
              <tr>
                <td class="text-xs">${fmtDate(a.timestamp)}</td>
                <td><span class="badge badge-blue">${a.servicio || '—'}</span></td>
                <td>${a.entidad || '—'}</td>
                <td><span class="badge ${a.accion === 'CREATE' ? 'badge-green' : a.accion === 'DELETE' ? 'badge-red' : 'badge-yellow'}">${a.accion || '—'}</span></td>
                <td class="font-mono text-xs">${a.usuario || '—'}</td>
                <td class="font-mono text-xs">${a.ip || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (e) { c.innerHTML = `<p class="text-red-500">Error: ${e.message}</p>`; }
};

// ── Cargar zonas en modales de tickets/espacios ────────────
const llenarSelectZonas = async (selectId) => {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  try {
    const zonas = allZonas.length ? allZonas : await api(URLS.zonas);
    allZonas = zonas;
    sel.innerHTML = zonas.map(z => `<option value="${z.id}">${z.nombre}</option>`).join('');
  } catch { sel.innerHTML = '<option value="">Error cargando zonas</option>'; }
};

// Override del botón Nueva Zona para limpiar form
const originalOpenModal = openModal;
window.openModal = (id) => {
  if (id === 'modalZona') {
    document.getElementById('z_id').value = '';
    document.getElementById('z_nombre').value = '';
    document.getElementById('z_descripcion').value = '';
    document.getElementById('z_capacidad').value = '10';
    document.getElementById('z_tipo').value = 'GENERAL';
    document.getElementById('modalZonaTitle').textContent = 'Nueva Zona';
  }
  if (id === 'modalEspacio') {
    llenarSelectZonas('esp_zona');
    document.getElementById('esp_id').value = '';
    document.getElementById('esp_descripcion').value = '';
    document.getElementById('modalEspacioTitle').textContent = 'Nuevo Espacio';
  }
  if (id === 'modalTicket') {
    llenarSelectZonas('tk_zona').then(() => {
      loadEspaciosByZona();
    });
  }
  if (id === 'modalVehiculo') {
    document.getElementById('v_placa').value = '';
    toggleVehiculoFields();
  }
  if (id === 'modalUsuario') {
    ['u_firstName','u_middleName','u_lastName','u_dni','u_email','u_phone','u_address'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('u_nationality').value = 'Ecuatoriana';
  }
  originalOpenModal(id);
};

// ── Formato de fecha ───────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-EC', { hour12: false });
};

// ── Bootstrap ─────────────────────────────────────────────
(() => {
  // Re-adjuntar event listeners de modales al DOM ya creado
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  if (token) {
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('navUser').textContent = `👤 ${currentUser}`;
    showTab('dashboard');
  } else {
    document.getElementById('loginView').classList.remove('hidden');
    document.getElementById('appView').classList.add('hidden');
  }

  // Polling de respaldo cada 60s
  setInterval(() => {
    if (token && document.getElementById('tab-dashboard') &&
        !document.getElementById('tab-dashboard').classList.contains('hidden')) {
      cargarDashboard();
    }
  }, 60000);
})();
