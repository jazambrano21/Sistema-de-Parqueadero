const HOST = window.location.hostname;

const API_ZONAS = `http://${HOST}:8081/api/zonas`;
const API_ESPACIOS = `http://${HOST}:8081/api/espacios`;
const API_TICKETS = `http://${HOST}:3002/tickets`;
const API_USERS = `http://${HOST}:8082/api/users`;

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
    if (connected) {
        indicator.className = 'w-3 h-3 bg-green-500 rounded-full inline-block';
        statusText.textContent = 'Conectado';
    } else {
        indicator.className = 'w-3 h-3 bg-red-500 rounded-full inline-block';
        statusText.textContent = 'Desconectado';
    }
};

window iniciarSesion = async () => {
    const rol = document.getElementById('rolLogin').value;
    const username = document.getElementById('usernameLogin').value.trim();
    const password = document.getElementById('passwordLogin').value.trim();

    if (!username || !password) {
        alert('Ingrese usuario y contraseña');
        return;
    }

    // VISITANTE puede entrar sin estar registrado
    if (rol === 'VISITANTE') {
        localStorage.setItem('rol', 'VISITANTE');
        localStorage.setItem('username', username);
        localStorage.setItem('dni', password);

        mostrarDashboard();
        return;
    }

    try {
        const response = await fetch(API_USERS);

        if (!response.ok) {
            throw new Error(`Error al consultar usuarios: ${response.status}`);
        }

        const usuarios = await response.json();

        const usuarioEncontrado = usuarios.find((user) => {
            return user.username === username;
        });

        if (!usuarioEncontrado) {
            alert('Usuario no encontrado');
            return;
        }

        const dniUsuario = usuarioEncontrado.person?.dni;

        // Según tu backend, la contraseña temporal es el DNI
        if (password !== dniUsuario) {
            alert('Contraseña incorrecta. Para pruebas usa el DNI del usuario.');
            return;
        }

        localStorage.setItem('rol', rol);
        localStorage.setItem('username', usuarioEncontrado.username);
        localStorage.setItem('dni', dniUsuario);
        localStorage.setItem('userId', usuarioEncontrado.id);

        mostrarDashboard();

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        alert('No se pudo iniciar sesión. Revisa que ms-usuarios esté levantado.');
    }
};

const cerrarSesion = () => {
    localStorage.removeItem('rol');
    localStorage.removeItem('username');

    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
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
};

const fetchJson = async (url) => {
    const response = await fetch(url);

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

    const totalEspacios = espacios.length;
    totalSpan.textContent = `${totalEspacios} espacios`;

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
        (rol === 'ADMIN' || rol === 'USUARIO' || rol === 'VISITANTE');

    return `
        <div class="espacio-card ${cardClass} rounded-lg shadow p-4 flex flex-col border-l-4">
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
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${estadoBadge}">
                    ${estado}
                </span>

                <span class="text-xs text-gray-400">
                    ID: ${esp.id ? esp.id.slice(0, 8) : 'N/A'}
                </span>
            </div>

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
    `;
};

const reservarEspacio = async (idEspacio, nombreZona) => {
    try {
        const placa = document.getElementById('placaInput').value;
        const dni = document.getElementById('dniInput').value;

        if (!placa || !dni) {
            alert('Ingrese placa y DNI para reservar');
            return;
        }

        const confirmar = confirm(`¿Deseas reservar el espacio de la zona ${nombreZona}?`);

        if (!confirmar) {
            return;
        }

        const body = {
            placa: placa,
            dni: dni,
            idEspacio: idEspacio,
            nombreZona: nombreZona,
        };

        const response = await fetch(API_TICKETS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message || 'No se pudo reservar el espacio');
            return;
        }

        const ticket = await response.json();

        console.log('Ticket creado:', ticket);

        alert('Espacio reservado correctamente. Se marcará como ocupado.');

        await cargarDatos();

    } catch (error) {
        console.error('Error al reservar espacio:', error);
        alert('Error al reservar espacio');
    }
};

(async () => {
    await mostrarDashboard();

    setInterval(() => {
        if (localStorage.getItem('rol')) {
            cargarDatos();
        }
    }, 5000);
})();