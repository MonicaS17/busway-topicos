'use client';
import { useState, useEffect } from 'react';
import { FiHome, FiPlus, FiSearch, FiTrash2, FiMapPin } from 'react-icons/fi';
import { api } from '@/lib/api';

const PROVINCIAS = [
  'Panamá', 'Panamá Oeste', 'Colón', 'Coclé',
  'Veraguas', 'Herrera', 'Los Santos', 'Chiriquí',
  'Bocas del Toro', 'Darién', 'Emberá', 'Guna Yala',
];

const DISTRITOS = {
  'Panamá':       ['Panamá', 'San Miguelito', 'Chepo', 'Balboa', 'Chimán', 'Taboga'],
  'Panamá Oeste': ['Arraiján', 'La Chorrera', 'Capira', 'Chame', 'San Carlos', 'Bejuco'],
  'Colón':        ['Colón', 'Portobelo', 'Santa Isabel', 'Donoso', 'Chagres', 'Omar Torrijos'],
  'Coclé':        ['Penonomé', 'Aguadulce', 'Natá', 'Olá', 'La Pintada', 'Anton'],
  'Veraguas':     ['Santiago', 'Soná', 'Calobre', 'Cañazas', 'La Mesa', 'Atalaya'],
  'Herrera':      ['Chitré', 'Ocú', 'Parita', 'Pesé', 'Santa María', 'Las Minas'],
  'Los Santos':   ['Las Tablas', 'Guararé', 'Los Santos', 'Macaracas', 'Pedasí', 'Pocrí'],
  'Chiriquí':     ['David', 'Boquete', 'Bugaba', 'Alanje', 'Barú', 'Dolega'],
  'Bocas del Toro': ['Bocas del Toro', 'Changuinola', 'Chiriquí Grande'],
  'Darién':       ['La Palma', 'Chepigana', 'Pinogana'],
  'Emberá':       ['Cémaco', 'Sambú'],
  'Guna Yala':    ['Guna Yala'],
};

export default function EscuelasPage() {
  const [escuelas, setEscuelas]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [guardando, setGuardando]   = useState(false);
  const [form, setForm] = useState({
    nombre:    '',
    provincia: '',
    distrito:  '',
    direccion: '',
  });

  useEffect(() => {
    api.getEscuelas()
      .then((data) => setEscuelas(data.escuelas))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const distritosDisp = DISTRITOS[form.provincia] ?? [];

  const filtered = escuelas.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase())   ||
    e.distrito?.toLowerCase().includes(search.toLowerCase()) ||
    e.provincia?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => setForm({ nombre: '', provincia: '', distrito: '', direccion: '' });

  const handleAdd = async () => {
    if (!form.nombre || !form.provincia || !form.distrito) return;
    setGuardando(true);
    try {
      const data = await api.crearEscuela(form);
      setEscuelas([data.escuela, ...escuelas]);
      resetForm();
      setShowModal(false);
    } catch (err) {
      alert('Error al crear escuela: ' + err.message);
    } finally {
      setGuardando(false);
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

  const puedeGuardar = form.nombre && form.provincia && form.distrito;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando escuelas...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">

      {/* Encabezado */}
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-navy">
            <FiHome size={23} />
            Escuelas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra instituciones educativas, rutas y conductores asociados.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
          {escuelas.length} registradas
        </span>
      </div>

      {/* Botón agregar */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="mb-5 flex h-14 w-full items-center justify-center gap-2 rounded-md bg-busway-yellow text-sm font-extrabold text-navy shadow-sm hover:bg-yellow-400 transition"
      >
        <FiPlus size={18} />
        Agregar escuela
      </button>

      {/* Buscador */}
      <div className="relative mb-5">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Buscar por nombre, provincia o distrito..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-busway-blue"
        />
      </div>

      {/* Grid de escuelas */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((e) => (
          <article key={e._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold text-navy truncate">{e.nombre}</h2>

                {/* Ubicación */}
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                  <FiMapPin size={13} className="shrink-0 text-busway-blue" />
                  <span className="truncate">
                    {[e.provincia, e.distrito].filter(Boolean).join(' · ')}
                  </span>
                </div>

                {/* Dirección si existe */}
                {e.direccion && (
                  <p className="mt-1 text-xs text-slate-400 truncate">{e.direccion}</p>
                )}

                <p className="mt-3 text-sm font-semibold text-slate-400">
                  {e.rutas} rutas · {e.conductores} conductores
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  e.estado === 'Activa'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}>
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
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No se encontraron escuelas.
          </div>
        )}
      </div>

      {/* Modal agregar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-extrabold text-navy">Nueva escuela</h2>
            <p className="mt-1 text-sm text-slate-500">Completa la información de la institución.</p>

            <div className="mt-5 space-y-4">

              {/* Nombre */}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Nombre <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Colegio San Agustín"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue"
                />
              </label>

              {/* Provincia */}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Provincia <span className="text-red-500">*</span>
                </span>
                <select
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value, distrito: '' })}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue bg-white"
                >
                  <option value="">Selecciona una provincia</option>
                  {PROVINCIAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {/* Distrito */}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Distrito <span className="text-red-500">*</span>
                </span>
                <select
                  value={form.distrito}
                  onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                  disabled={!form.provincia}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {form.provincia ? 'Selecciona un distrito' : 'Primero selecciona una provincia'}
                  </option>
                  {distritosDisp.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>

              {/* Dirección adicional */}
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Dirección <span className="text-slate-400 font-normal">(opcional)</span>
                </span>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej. Calle 50, frente al parque"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-busway-blue"
                />
              </label>

            </div>

            {/* Botones */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => { resetForm(); setShowModal(false); }}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!puedeGuardar || guardando}
                className="flex-1 rounded-lg bg-busway-yellow py-2.5 text-sm font-extrabold text-navy hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}