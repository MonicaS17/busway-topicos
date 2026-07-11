'use client';
import { useEffect, useState } from 'react';
import PanelSection from '@/components/dashboard/PanelSection';
import { FiEdit, FiTrash2, FiPlus, FiX, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

import { api } from '@/lib/api';

const formatDate = (value) => value
  ? new Date(value).toLocaleString('es-PA', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ConductorRutasPage() {
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [editingRuta, setEditingRuta] = useState(null);
  const [nombreRuta, setNombreRuta] = useState('');
  const [escuelaId, setEscuelaId] = useState('');
  const [zona, setZona] = useState('');
  const [horarioSalida, setHorarioSalida] = useState('');
  const [horarioLlegada, setHorarioLlegada] = useState('');
  const [frecuencia, setFrecuencia] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = () => {
    Promise.all([api.getConductorRutas(), api.getConductorViajes(), api.getEscuelas()])
      .then(([rutasData, viajesData, escuelasData]) => {
        setRutas(rutasData.rutas || []);
        setViajes(Array.isArray(viajesData) ? viajesData : (viajesData.viajes || []));
        setEscuelas(escuelasData.escuelas || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingRuta(null);
    setNombreRuta('');
    setEscuelaId(escuelas[0]?._id || '');
    setZona('');
    setHorarioSalida('6:00 AM');
    setHorarioLlegada('6:50 AM');
    setFrecuencia(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (ruta) => {
    setEditingRuta(ruta);
    setNombreRuta(ruta.nombre_ruta || ruta.nombre || '');
    setEscuelaId(ruta.escuela_id || '');
    setZona(ruta.zona || '');
    setHorarioSalida(ruta.horario_salida || '6:00 AM');
    setHorarioLlegada(ruta.horario_llegada || '6:50 AM');
    setFrecuencia(Array.isArray(ruta.frecuencia) ? ruta.frecuencia : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la ruta "${name}"?`)) return;
    try {
      await api.eliminarRutaConductor(id);
      loadData();
    } catch (err) {
      alert(err.message || 'No se pudo eliminar la ruta');
    }
  };

  const handleToggleDia = (dia) => {
    setFrecuencia(prev => 
      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreRuta.trim()) return setFormError('El nombre de la ruta es obligatorio');
    if (!escuelaId) return setFormError('Debes seleccionar una escuela');
    if (!zona.trim()) return setFormError('La zona o comunidad es obligatoria');
    if (!horarioSalida.trim() || !horarioLlegada.trim()) return setFormError('Los horarios son obligatorios');
    if (frecuencia.length === 0) return setFormError('Debes seleccionar al menos un día de la frecuencia');

    setSubmitting(true);
    setFormError('');

    const payload = {
      escuela_id: escuelaId,
      nombre_ruta: nombreRuta.trim(),
      zona: zona.trim(),
      horario_salida: horarioSalida.trim(),
      horario_llegada: horarioLlegada.trim(),
      frecuencia
    };

    try {
      if (editingRuta) {
        await api.actualizarRutaConductor(editingRuta._id, payload);
      } else {
        await api.crearRutaConductor(payload);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Ocurrió un error al guardar la ruta');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Cargando rutas y viajes...</div>;

  return (
    <PanelSection title="Rutas y viajes" description="Rutas asignadas e historial de recorridos realizados.">
      <div className="mb-4">
        <Link
          href="/dashboard/conductor"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <FiArrowLeft size={14} /> Regresar al inicio
        </Link>
      </div>
      
      {/* SECTION 1: RUTAS */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-extrabold text-navy">Rutas asignadas</h2>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-md bg-busway-yellow px-3 py-1.5 text-xs font-extrabold text-navy hover:bg-yellow-400 transition"
          >
            <FiPlus size={14} /> Nueva ruta
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy">
              <tr>
                {['Ruta', 'Escuela', 'Zona', 'Frecuencia', 'Horario', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rutas.map((ruta) => (
                <tr key={ruta._id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-bold text-navy">{ruta.nombre_ruta || ruta.nombre}</td>
                  <td className="px-5 py-4 text-slate-600">{ruta.escuela || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{ruta.zona || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">
                    {Array.isArray(ruta.frecuencia) ? ruta.frecuencia.join(', ') : String(ruta.frecuencia || '—')}
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {ruta.horario_salida && ruta.horario_llegada 
                      ? `${ruta.horario_salida} — ${ruta.horario_llegada}` 
                      : ruta.horario || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${ruta.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {ruta.estado || 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEdit(ruta)}
                        className="rounded bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 transition"
                        title="Editar Ruta"
                      >
                        <FiEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ruta._id, ruta.nombre_ruta || ruta.nombre)}
                        className="rounded bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                        title="Eliminar Ruta"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rutas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">No tienes rutas creadas aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: VIAJES */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-extrabold text-navy">Historial de viajes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-xs uppercase text-white">
              <tr>
                {['Ruta', 'Tipo', 'Salida', 'Llegada', 'A bordo', 'Asistencias', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viajes.map((viaje) => (
                <tr key={viaje._id}>
                  <td className="px-5 py-4 font-bold text-navy">{viaje.ruta_id?.nombre || 'Ruta eliminada'}</td>
                  <td className="px-5 py-4 capitalize text-slate-600">{viaje.tipo_viaje || '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(viaje.hora_salida)}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(viaje.hora_llegada)}</td>
                  <td className="px-5 py-4 text-slate-600">{viaje.estudiantes_abordo?.length || 0}</td>
                  <td className="px-5 py-4 text-slate-600">{viaje.asistencias?.length || 0}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {viaje.estado?.replace('_', ' ') || 'completado'}
                    </span>
                  </td>
                </tr>
              ))}
              {viajes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">Todavía no hay viajes registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-navy">
                {editingRuta ? 'Editar Ruta' : 'Crear Nueva Ruta'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-navy">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formError && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100">{formError}</p>}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Ruta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ruta Principal Mañana"
                  value={nombreRuta}
                  onChange={(e) => setNombreRuta(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escuela destino</label>
                <select
                  required
                  value={escuelaId}
                  onChange={(e) => setEscuelaId(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy bg-white focus:border-busway-blue focus:outline-none"
                >
                  <option value="" disabled>Selecciona una escuela</option>
                  {escuelas.map((esc) => (
                    <option key={esc._id} value={esc._id}>{esc.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zona / Comunidad</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Brisas del Golf, Villa Lucre"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horario de Salida</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 6:00 AM"
                    value={horarioSalida}
                    onChange={(e) => setHorarioSalida(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horario de Llegada</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 6:50 AM"
                    value={horarioLlegada}
                    onChange={(e) => setHorarioLlegada(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Frecuencia (Días)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS_SEMANA.map((dia) => {
                    const selected = frecuencia.includes(dia);
                    return (
                      <button
                        type="button"
                        key={dia}
                        onClick={() => handleToggleDia(dia)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selected ? 'bg-navy text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-md bg-navy py-2.5 text-sm font-extrabold text-white hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Ruta'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelSection>
  );
}
