'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import { FiCreditCard, FiTruck, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function ConductorDashboard() {
  const [perfil, setPerfil] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [rutas, setRutas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getConductorPerfil(), api.getConductorEstudiantes(), api.getConductorRutas(), api.getConductorPagos()])
      .then(([perfilData, estudiantesData, rutasData, pagosData]) => {
        setPerfil(perfilData);
        setEstudiantes(estudiantesData.estudiantes);
        setRutas(rutasData.rutas);
        setPagos(pagosData.pagos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const nombre = perfil?.usuario
    ? `${perfil.usuario.nombre} ${perfil.usuario.apellido}`
    : 'Conductor';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">Hola, {nombre} 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Consulta rutas, escuelas, estudiantes, perfil y pagos recibidos.</p>
        </div>
        <Link
          href="/dashboard/conductor/perfil"
          className="rounded-md bg-busway-yellow px-5 py-2.5 text-sm font-extrabold text-navy"
        >
          Ver perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Rutas registradas" value={String(rutas.length)} icon={<FiTruck />} />
        <StatsCard title="Escuelas" value={String(new Set(rutas.map((ruta) => ruta.escuela).filter(Boolean)).size)} icon={<FiTruck />} color="#071634" />
        <StatsCard title="Estudiantes" value={String(estudiantes.length)} icon={<FiUsers />} color="#168FE3" />
        <StatsCard title="Pagos exitosos" value={String(pagos.filter((p) => p.status === 'Exitoso').length)} icon={<FiCreditCard />} color="#FFC20A" />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-extrabold text-navy">Rutas y escuelas</h2>
          <Link
            href="/dashboard/conductor/viajes"
            className="rounded-md bg-navy px-4 py-2 text-xs font-extrabold text-white"
          >
            Ver rutas
          </Link>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {rutas.map((ruta) => (
            <article key={ruta._id} className="rounded-md border border-slate-200 p-4">
              <h3 className="text-sm font-extrabold text-navy">{ruta.nombre}</h3>
              <p className="mt-1 text-xs text-slate-500">{ruta.escuela || 'Sin escuela registrada'}{ruta.zona ? ` · ${ruta.zona}` : ''}</p>
              <p className="mt-3 text-sm font-bold text-busway-blue">{ruta.frecuencia || '—'}</p>
            </article>
          ))}
          {rutas.length === 0 && (
            <p className="text-sm text-slate-400">No tienes rutas asignadas aún.</p>
          )}
        </div>
      </section>
    </div>
  );
}
