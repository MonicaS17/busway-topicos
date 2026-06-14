const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
};