'use client';
import { useState, useEffect } from 'react';
import { FiHome, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function EscuelasPage() {
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', distrito: '' });

  useEffect(() => {
    api.getEscuelas()
      .then((data) => setEscuelas(data.escuelas))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = escuelas.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    e.distrito.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.nombre || !form.distrito) return;
    try {
      const data = await api.crearEscuela(form);
      setEscuelas([data.escuela, ...escuelas]);
      setForm({ nombre: '', distrito: '' });
      setShowModal(false);
    } catch (err) {
      alert('Error al crear escuela: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta escuela?')) return;
    try {
      await api.eliminarEscuela(id);
      setEscuelas(escuelas.filter((e) => e._id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando escuelas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-navy">
            <FiHome size={23} />
            Escuelas
          </h1>
          <p className="mt-1 text-sm text-slate-500">Administra colegios, rutas y conductores asociados.</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mb-5 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-busway-yellow text-sm font-extrabold text-navy shadow-sm hover:bg-yellow-400 transition"
      >
        <FiPlus size={18} />
        Agregar escuela
      </button>

      <div className="relative mb-5">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre o distrito"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-busway-blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((e) => (
          <article key={e._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-navy">{e.nombre}</h2>
                <p className="mt-1 text-sm text-slate-500">{e.distrito}</p>
                <p className="mt-3 text-sm font-semibold text-slate-400">
                  {e.rutas} rutas · {e.conductores} conductores
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {e.estado}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(e._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  aria-label="Eliminar escuela"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No se encontraron escuelas.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold text-navy">Nueva escuela</h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Nombre</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">Distrito</span>
                <input
                  type="text"
                  value={form.distrito}
                  onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="flex-1 rounded-lg bg-busway-yellow py-2.5 text-sm font-extrabold text-navy hover:bg-yellow-400"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}