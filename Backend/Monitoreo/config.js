/**
 * Configuración del frontend.
 * Esta variable puede ser sobrescrita por el servidor de despliegue
 * (por ejemplo, mediante un ConfigMap en Kubernetes) sin recompilar la app.
 */
window.API_BASE = window.API_BASE || 'http://localhost:8000';
