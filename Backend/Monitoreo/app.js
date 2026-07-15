const API_BASE = window.API_BASE || 'http://localhost:8000';

const API_ZONAS = `${API_BASE}/api/zonas`;
const API_ESPACIOS = `${API_BASE}/api/espacios`;
const API_TICKETS = `${API_BASE}/tickets`;
const API_USERS = `${API_BASE}/api/users`;
const API_ESPACIOS_SSE = `${API_BASE}/api/espacios/sse`;

let eventSource = null;

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');

const zonasContainer = document.getElementById('zonasContainer');
const totalSpan = document.getElementById('totalEspacios');
const lastUpdateSpan = document.getElementById('lastUpdate');
const indicator = document.getElementById('indicator');
const statusText = document.getElementById('statusText');
const rolActivoSpan = document.getElementById('rolActivo');

const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleString('es-ES', { hour12: false });
};

const setConnectionStatus = (connected) => {
    if (!indicator || !statusText) return;

    if (connected) {
        indicator.className = 'w-3 h-3 bg-green-500 rounded-full inline-block';
        statusText.textContent = 'Conectado';
    } else {
        indicator.className = 'w-3 h-3 bg-red-500 rounded-full inline-block';
        statusText.textContent = 'Desconectado';
    }
};

const obtenerToken = () => localStorage.getItem('token');

const headersConAuth = (contentType = true) => {
    const headers = {};
    if (contentType) {
        headers['Content-Type'] = 'application/json';
    }
    const token = obtenerToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

window.iniciarSesion = async () => {
    const rol = document.getElementById('rolLogin').value;
    const username = document.getElementById('usernameLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();

    if (!username || !password) {
        alert('Ingrese usuario y contraseña');
        return;
    }

    if (rol === 'VISITANTE') {
        alert('Con JWT activado, el modo visitante no está disponible. Inicie sesión con un usuario registrado.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error(`Error de login: ${response.status}`);
        }

        const data = await response.json();

        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('rol', data.roles?.includes('ROLE_ADMIN') ? 'ADMIN' : 'USER');
        localStorage.setItem('username', data.username);

        // Buscar el DNI del usuario autenticado para las reservas
        try {
            const usuarios = await fetchJson(`${API_BASE}/api/users`);
            const usuario = usuarios.find(u => u.username === data.username);
            localStorage.setItem('dni', usuario?.person?.dni || username);
        } catch (e) {
            console.warn('No se pudo obtener DNI del usuario, usando username como fallback');
            localStorage.setItem('dni', username);
        }

        await mostrarDashboard();

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('No se pudo iniciar sesión. Verifique usuario, contraseña y que el backend esté activo.');
    }
};

window.cerrarSesion = () => {
    desconectarSSE();
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('username');
    localStorage.removeItem('dni');
    localStorage.removeItem('userId');

    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
};

const conectarSSE = () => {
    if (eventSource) {
        eventSource.close();
    }

    const token = obtenerToken();
    const sseUrl = token ? `${API_ESPACIOS_SSE}?token=${token}` : API_ESPACIOS_SSE;

    eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('cambio-espacio', (event) => {
        try {
            const espacio = JSON.parse(event.data);
            actualizarCardEspacio(espacio);
            lastUpdateSpan.textContent = formatDate(new Date());
        } catch (error) {
            console.error('Error procesando evento SSE:', error);
        }
    });

    eventSource.onerror = (error) => {
        console.error('Error en SSE:', error);
        setConnectionStatus(false);
    };

    eventSource.onopen = () => {
        setConnectionStatus(true);
    };
};

const desconectarSSE = () => {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
};

const actualizarCardEspacio = (espacio) => {
    const card = document.querySelector(`[data-espacio-id="${espacio.id}"]`);
    if (!card) {
        // Si no existe la card, recargamos todo
        cargarDatos();
        return;
    }

    const estado = espacio.estado || 'DESCONOCIDO';
    const rol = localStorage.getItem('rol');

    const estadoBadge =
        estado === 'DISPONIBLE'
            ? 'bg-green-200 text-green-800'
            : estado === 'OCUPADO' || estado === 'RESERVADO'
                ? 'bg-red-200 text-red-800'
                : 'bg-yellow-200 text-yellow-800';

    const cardClass =
        estado === 'DISPONIBLE'
            ? 'bg-green-50 border-green-500'
            : estado === 'OCUPADO' || estado === 'RESERVADO'
                ? 'bg-red-50 border-red-500'
                : 'bg-yellow-50 border-yellow-500';

    card.className = `espacio-card ${cardClass} rounded-lg shadow p-4 flex flex-col border-l-4`;

    const badge = card.querySelector('.estado-badge');
    if (badge) {
        badge.className = `estado-badge px-2 py-1 text-xs font-semibold rounded-full ${estadoBadge}`;
        badge.textContent = estado;
    }

    const puedeReservar =
        estado === 'DISPONIBLE' &&
        (rol === 'ADMIN' || rol === 'Usuario' || rol === 'USUARIO' || rol === 'VISITANTE');

    const botonContainer = card.querySelector('.boton-container');
    if (botonContainer) {
        botonContainer.innerHTML = puedeReservar
            ? `<button onclick="reservarEspacio('${espacio.id}', '${espacio.nombreZona}')" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded">Reservar</button>`
            : `<button disabled class="mt-4 bg-gray-400 text-white text-sm font-semibold py-2 px-3 rounded cursor-not-allowed">No disponible</button>`;
    }
};

const mostrarDashboard = async () => {
    const rol = localStorage.getItem('rol');

    if (!rol) {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        return;
    }

    rolActivoSpan.textContent = rol;

    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    await cargarDatos();
    conectarSSE();
};

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headersConAuth(options.headers?.['Content-Type'] === undefined),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
    }

    return await response.json();
};

const cargarDatos = async () => {
    try {
        const zonas = await fetchJson(API_ZONAS);
        const espacios = await fetchJson(API_ESPACIOS);

        renderizarZonasConEspacios(zonas, espacios);

        setConnectionStatus(true);
        lastUpdateSpan.textContent = formatDate(new Date());
    } catch (error) {
        console.error('Error al cargar datos:', error);
        setConnectionStatus(false);
    }
};

const agruparEspaciosPorZona = (zonas, espacios) => {
    return zonas.map((zona) => {
        const espaciosDeZona = espacios.filter((esp) => esp.idZona === zona.id);

        return {
            ...zona,
            espacios: espaciosDeZona,
        };
    });
};

const renderizarZonasConEspacios = (zonas, espacios) => {
    if (!zonasContainer) {
        console.error('No existe el contenedor zonasContainer en el HTML');
        return;
    }

    if (!zonas || zonas.length === 0) {
        zonasContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <p class="text-xl">No hay zonas registradas</p>
            </div>
        `;
        totalSpan.textContent = '0 espacios';
        return;
    }

    const zonasConEspacios = agruparEspaciosPorZona(zonas, espacios);
    totalSpan.textContent = `${espacios.length} espacios`;

    zonasContainer.innerHTML = zonasConEspacios.map((zona) => {
        return `
            <section class="mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">
                        Zona: ${zona.nombre || zona.codigo || zona.descripcion || 'Sin nombre'}
                    </h2>

                    <span class="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
                        ${zona.espacios.length} espacios
                    </span>
                </div>

                ${
                    zona.espacios.length === 0
                        ? `
                            <div class="bg-white rounded shadow p-4 text-gray-500">
                                Esta zona no tiene espacios registrados.
                            </div>
                        `
                        : `
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                ${zona.espacios.map((esp) => renderizarCardEspacio(esp)).join('')}
                            </div>
                        `
                }
            </section>
        `;
    }).join('');
};

const renderizarCardEspacio = (esp) => {
    const estado = esp.estado || 'DESCONOCIDO';
    const rol = localStorage.getItem('rol');

    const estadoBadge =
        estado === 'DISPONIBLE'
            ? 'bg-green-200 text-green-800'
            : estado === 'OCUPADO' || estado === 'RESERVADO'
                ? 'bg-red-200 text-red-800'
                : 'bg-yellow-200 text-yellow-800';

    const cardClass =
        estado === 'DISPONIBLE'
            ? 'bg-green-50 border-green-500'
            : estado === 'OCUPADO' || estado === 'RESERVADO'
                ? 'bg-red-50 border-red-500'
                : 'bg-yellow-50 border-yellow-500';

    const puedeReservar =
        estado === 'DISPONIBLE' &&
        (rol === 'ADMIN' || rol === 'Usuario' || rol === 'USUARIO' || rol === 'VISITANTE');

    return `
        <div data-espacio-id="${esp.id}" class="espacio-card ${cardClass} rounded-lg shadow p-4 flex flex-col border-l-4">
            <div class="font-bold text-lg text-gray-800">
                ${esp.nombre || 'Sin nombre'}
            </div>

            <div class="text-sm text-gray-600">
                Zona: ${esp.nombreZona || 'N/A'}
            </div>

            <div class="text-sm text-gray-600">
                Tipo: ${esp.tipo || 'N/A'}
            </div>

            <div class="text-sm text-gray-600">
                Descripción: ${esp.descripcion || 'N/A'}
            </div>

            <div class="mt-2 flex items-center justify-between">
                <span class="estado-badge px-2 py-1 text-xs font-semibold rounded-full ${estadoBadge}">
                    ${estado}
                </span>

                <span class="text-xs text-gray-400">
                    ID: ${esp.id ? esp.id.slice(0, 8) : 'N/A'}
                </span>
            </div>

            <div class="boton-container">
                ${
                    puedeReservar
                        ? `
                            <button 
                                onclick="reservarEspacio('${esp.id}', '${esp.nombreZona}')"
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-3 rounded">
                                Reservar
                            </button>
                        `
                        : `
                            <button 
                                disabled
                                class="mt-4 bg-gray-400 text-white text-sm font-semibold py-2 px-3 rounded cursor-not-allowed">
                                No disponible
                            </button>
                        `
                }
            </div>
        </div>
    `;
};

window.reservarEspacio = async (idEspacio, nombreZona) => {
    try {
        const placa = document.getElementById('placaInput').value.trim();
        const dni = localStorage.getItem('dni') || document.getElementById('dniInput').value.trim();

        if (!placa || !dni) {
            alert('Ingrese placa y DNI para reservar');
            return;
        }

        const confirmar = confirm(`¿Deseas reservar el espacio de la zona ${nombreZona}?`);

        if (!confirmar) {
            return;
        }

        const body = {
            placa,
            dni,
            idEspacio,
            nombreZona,
        };

        const ticket = await fetchJson(API_TICKETS, {
            method: 'POST',
            body: JSON.stringify(body),
        });

        console.log('Ticket creado:', ticket);

        alert('Espacio reservado correctamente. Se marcará como ocupado.');

        await cargarDatos();

    } catch (error) {
        console.error('Error al reservar espacio:', error);
        alert('Error al reservar espacio');
    }
};

(async () => {
    const rol = localStorage.getItem('rol');

    if (rol) {
        await mostrarDashboard();
    } else {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
    }

    // Polling de respaldo por si SSE falla o se pierde conexión
    setInterval(() => {
        if (localStorage.getItem('rol')) {
            cargarDatos();
        }
    }, 30000);
})();