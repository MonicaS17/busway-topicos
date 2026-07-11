const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('busway_token');

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error en la solicitud');
  }

  return res.json();
}

export const api = {
  getUsuarios: () => apiFetch('/api/auth/usuarios'),
  toggleEstadoUsuario: (id, estado) =>
    apiFetch(`/api/auth/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
  getEscuelas: () => apiFetch('/api/escuelas'),
  crearEscuela: (data) =>
    apiFetch('/api/escuelas', { method: 'POST', body: JSON.stringify(data) }),
  eliminarEscuela: (id) =>
    apiFetch(`/api/escuelas/${id}`, { method: 'DELETE' }),
  getPagos: () => apiFetch('/api/pagos'),
  getLogs: () => apiFetch('/api/admin/logs'),
  getPerfil: () => apiFetch('/api/auth/perfil'),
  // Conductor
  getConductorPerfil: () => apiFetch('/api/conductor/perfil'),
  getConductorEstudiantes: () => apiFetch('/api/conductor/estudiantes'),
  getConductorRutas: () => apiFetch('/api/conductor/rutas'),
  getConductorViajes: () => apiFetch('/api/viajes/historial'),
  getConductorPagos: () => apiFetch('/api/pagos/recibidos'),
  getPadreHijos: () => apiFetch('/api/padre/mis-hijos'),
  getPadrePagos: () => apiFetch('/api/pagos/mis-pagos'),
  actualizarPerfil: (data) =>
    apiFetch('/api/auth/perfil/actualizar', { method: 'PATCH', body: JSON.stringify(data) }),
  crearRutaConductor: (data) =>
    apiFetch('/api/conductor/ruta', { method: 'POST', body: JSON.stringify(data) }),
  actualizarRutaConductor: (id, data) =>
    apiFetch(`/api/conductor/ruta/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  eliminarRutaConductor: (id) =>
    apiFetch(`/api/conductor/ruta/${id}`, { method: 'DELETE' }),

};
