'use client';
import { useState, useEffect } from 'react';
import { FiBarChart2, FiDownload } from 'react-icons/fi';
import { api } from '@/lib/api';
import { exportToExcel, exportToPdf } from '@/lib/exportReports';

export default function IngresosPage() {
  const [pagos, setPagos] = useState([]);
  const [totalMes, setTotalMes] = useState(0);
  const [totalAnio, setTotalAnio] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Todos');

  useEffect(() => {
    api.getPagos()
      .then((data) => {
        setPagos(data.pagos);
        setTotalMes(data.totalMes);
        setTotalAnio(data.totalAnio);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterStatus === 'Todos'
    ? pagos
    : pagos.filter((p) => p.status === filterStatus);

  const report = {
    title: 'Historial general de ingresos',
    columns: ['ID', 'Padre', 'Conductor', 'Monto', 'Mes', 'Fecha', 'Estado'],
    rows: filtered.map((p) => [
      String(p.id).slice(-6).toUpperCase(), p.padre, p.conductor, p.monto,
      p.mesContrato || '—', p.fecha, p.status,
    ]),
    fileName: 'busway-ingresos',
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando ingresos...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7">
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold text-navy">
          <FiBarChart2 size={23} />
          Ingresos
        </h1>
        <p className="mt-1 text-sm text-slate-500">Consulta pagos, cierres mensuales y exportaciones.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-5 text-center">
            <p className="text-xs font-bold text-slate-500">Este mes</p>
            <p className="mt-2 text-3xl font-extrabold text-navy">${totalMes.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-5 text-center">
            <p className="text-xs font-bold text-slate-500">Este año</p>
            <p className="mt-2 text-3xl font-extrabold text-navy">${totalAnio.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ['PDF', () => exportToPdf(report)],
            ['Excel', () => exportToExcel(report)],
          ].map(([format, action]) => (
            <button
              key={format}
              type="button"
              onClick={() => action().catch((error) => alert(error.message))}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-navy hover:border-busway-blue hover:bg-blue-50/50 transition"
            >
              <FiDownload size={15} />
              {format}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-extrabold text-navy">Pagos recientes</h2>
          <div className="flex gap-2">
            {['Todos', 'Exitoso', 'Pendiente', 'Fallido'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                  filterStatus === s ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-navy">
              <tr>
                {['ID', 'Padre', 'Conductor', 'Monto', 'Fecha', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-extrabold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{String(p.id).slice(-6).toUpperCase()}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{p.padre}</td>
                  <td className="px-5 py-4 text-slate-600">{p.conductor}</td>
                  <td className="px-5 py-4 font-extrabold text-navy">{p.monto}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{p.fecha}</td>
                  <td className="px-5 py-4">
                    <span className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      p.status === 'Exitoso'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700',
                    ].join(' ')}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    No hay pagos registrados.
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
