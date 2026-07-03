'use client';
import { useEffect, useState } from 'react';
import PanelSection from '@/components/dashboard/PanelSection';
import { api } from '@/lib/api';

const formatDate = (value) => value
  ? new Date(value).toLocaleString('es-PA', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

export default function ConductorRutasPage() {
  const [rutas, setRutas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getConductorRutas(), api.getConductorViajes()])
      .then(([rutasData, viajesData]) => {
        setRutas(rutasData.rutas);
        setViajes(viajesData.viajes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Cargando rutas y viajes...</div>;

  return (
    <PanelSection title="Rutas y viajes" description="Rutas asignadas e historial de recorridos realizados.">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-extrabold text-navy">Rutas asignadas</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy"><tr>
              {['Ruta', 'Escuela', 'Zona', 'Frecuencia', 'Puntos', 'Estado'].map((h) => <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rutas.map((ruta) => <tr key={ruta._id}>
                <td className="px-5 py-4 font-bold text-navy">{ruta.nombre}</td>
                <td className="px-5 py-4 text-slate-600">{ruta.escuela || '—'}</td>
                <td className="px-5 py-4 text-slate-600">{ruta.zona || '—'}</td>
                <td className="px-5 py-4 text-slate-600">{ruta.frecuencia || '—'}</td>
                <td className="px-5 py-4 text-slate-600">{ruta.puntos_trayectoria?.length || 0}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${ruta.estado === 'activa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{ruta.estado || 'Sin estado'}</span></td>
              </tr>)}
              {rutas.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No tienes rutas asignadas.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-sm font-extrabold text-navy">Historial de viajes</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy text-xs uppercase text-white"><tr>
              {['Ruta', 'Tipo', 'Salida', 'Llegada', 'A bordo', 'Asistencias', 'Estado'].map((h) => <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {viajes.map((viaje) => <tr key={viaje._id}>
                <td className="px-5 py-4 font-bold text-navy">{viaje.ruta_id?.nombre || 'Ruta eliminada'}</td>
                <td className="px-5 py-4 capitalize text-slate-600">{viaje.tipo_viaje || '—'}</td>
                <td className="px-5 py-4 text-slate-600">{formatDate(viaje.hora_salida)}</td>
                <td className="px-5 py-4 text-slate-600">{formatDate(viaje.hora_llegada)}</td>
                <td className="px-5 py-4 text-slate-600">{viaje.estudiantes_abordo?.length || 0}</td>
                <td className="px-5 py-4 text-slate-600">{viaje.asistencias?.length || 0}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{viaje.estado.replace('_', ' ')}</span></td>
              </tr>)}
              {viajes.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Todavía no hay viajes en el historial.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </PanelSection>
  );
}
