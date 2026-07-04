'use client';
import { useState, useEffect } from 'react';
import { FiSearch, FiShield, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('Todos');

  useEffect(() => {
    api.getUsuarios()
      .then((data) => {
        const mapeados = data.usuarios
          .filter((u) => ['conductor', 'padre'].includes(u.tipo))
          .map((u) => ({
          id: u._id,
          nombre: `${u.nombre} ${u.apellido}`,
          email: u.correo,
          rol: u.tipo === 'conductor' ? 'Conductor' : u.tipo === 'padre' ? 'Padre' : 'Admin',
          status: u.estado.charAt(0).toUpperCase() + u.estado.slice(1),
          fecha: new Date(u.fecha_registro).toLocaleDateString('es-PA'),
        }));
        setUsers(mapeados);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRol = filterRol === 'Todos' || u.rol === filterRol;
    return matchSearch && matchRol;
  });

  const toggleStatus = async (id, statusActual) => {
    const nuevoEstado = statusActual === 'Activo' ? 'bloqueado' : 'activo';
    try {
      await api.toggleEstadoUsuario(id, nuevoEstado);
      setUsers(users.map((u) =>
        u.id === id ? { ...u, status: nuevoEstado === 'activo' ? 'Activo' : 'Bloqueado' } : u
      ));
    } catch (err) {
      alert('Error al cambiar estado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-navy">
          <FiUsers size={23} />
          Usuarios
        </h1>
        <p className="mt-1 text-sm text-slate-500">Administra conductores y padres registrados.</p>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total', value: users.length, tone: 'text-navy' },
          { label: 'Activos', value: users.filter((u) => u.status === 'Activo').length, tone: 'text-emerald-600' },
          { label: 'Bloqueados', value: users.filter((u) => u.status === 'Bloqueado').length, tone: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-extrabold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar usuario"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-busway-blue"
            />
          </div>
          <div className="flex gap-2">
            {['Todos', 'Conductor', 'Padre'].map((rol) => (
              <button
                key={rol}
                type="button"
                onClick={() => setFilterRol(rol)}
                className={[
                  'rounded-lg px-3 py-2 text-xs font-bold transition',
                  filterRol === rol ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {rol}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-navy">
              <tr>
                {['Nombre', 'Correo', 'Rol', 'Estado', 'Registro', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-800">{u.nombre}</td>
                  <td className="px-5 py-4 text-slate-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      u.rol === 'Conductor' ? 'bg-blue-50 text-blue-700' : u.rol === 'Admin' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700',
                    ].join(' ')}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      u.status === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                    ].join(' ')}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">{u.fecha}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(u.id, u.status)}
                      className={[
                        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition',
                        u.status === 'Activo'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                      ].join(' ')}
                    >
                      <FiShield size={14} />
                      {u.status === 'Activo' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
