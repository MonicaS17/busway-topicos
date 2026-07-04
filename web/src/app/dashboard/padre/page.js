'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import { FiCreditCard, FiDownload, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function PadreDashboard() {
  const [hijos, setHijos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPerfil(), api.getPadreHijos(), api.getPadrePagos()])
      .then(([perfilData, hijosData, pagosData]) => {
        setUsuario(perfilData.usuario);
        setHijos(hijosData.hijos);
        setPagos(pagosData.pagos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ultimoPago = pagos[0];
  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Padre';

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
          <p className="mt-1 text-sm text-slate-500">Consulta tu perfil, hijos registrados e historial de pagos.</p>
        </div>
        <Link
          href="/dashboard/padre/perfil"
          className="rounded-md bg-busway-yellow px-5 py-2.5 text-sm font-extrabold text-navy"
        >
          Ver perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Hijos registrados" value={String(hijos.length)} icon={<FiUsers />} />
        <StatsCard title="Pagos realizados" value={String(pagos.length)} icon={<FiCreditCard />} color="#071634" />
        <StatsCard
          title="Último pago"
          value={ultimoPago?.monto || '$0.00'}
          icon={<FiDownload />}
          color="#FFC20A"
          sub={ultimoPago?.fecha || '—'}
        />
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-navy">Pagos recientes</h2>
            <p className="mt-1 text-xs text-slate-500">El historial completo está disponible en la sección Pagos.</p>
          </div>
          <Link
            href="/dashboard/padre/pagos"
            className="rounded-md bg-navy px-4 py-2 text-xs font-extrabold text-white"
          >
            Ver historial
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy">
              <tr>
                {['Fecha', 'Monto', 'Detalle', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.slice(0, 3).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-slate-600">{p.fecha}</td>
                  <td className="px-5 py-4 font-extrabold text-navy">{p.monto}</td>
                  <td className="px-5 py-4 text-slate-600">Mes {p.mesContrato} · {p.conductor}</td>
                  <td className="px-5 py-4">
                    <span className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      p.estado === 'Exitoso'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.estado === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700',
                    ].join(' ')}>
                      {p.estado}
                    </span>
                  </td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                    No tienes pagos registrados aún.
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
