'use client';
import { useEffect, useState } from 'react';
import PanelSection from '@/components/dashboard/PanelSection';
import { FiDownload } from 'react-icons/fi';
import { api } from '@/lib/api';
import { exportToExcel, exportToPdf } from '@/lib/exportReports';

export default function ConductorPagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConductorPagos()
      .then((data) => setPagos(data.pagos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const report = {
    title: 'Historial de pagos recibidos',
    columns: ['Estudiantes', 'Padre', 'Monto total', 'Tarifa conductor', 'Membresía', 'Mes', 'Estado', 'Fecha'],
    rows: pagos.map((p) => [
      p.estudiantes, p.padre, p.monto, `$${p.tarifaConductor.toFixed(2)}`, `$${p.membresia.toFixed(2)}`,
      p.mesContrato, p.status, p.fecha,
    ]),
    fileName: 'busway-pagos-recibidos',
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Cargando pagos...</div>;
  }

  return (
    <PanelSection title="Pagos recibidos" description="Historial real de pagos asociados a tus acuerdos de transporte.">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-extrabold text-navy">Historial completo</h2>
          <div className="flex gap-2">
            {[
              ['PDF', () => exportToPdf(report)],
              ['Excel', () => exportToExcel(report)],
            ].map(([format, action]) => (
              <button
                key={format}
                type="button"
                onClick={() => action().catch((error) => alert(error.message))}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-navy hover:border-busway-blue"
              >
                <FiDownload size={14} /> Descargar {format}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy">
              <tr>
                {['Estudiantes', 'Padre', 'Monto', 'Tu tarifa', 'Membresía', 'Mes', 'Estado', 'Fecha'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-700">{p.estudiantes}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{p.padre}</td>
                  <td className="px-5 py-4 font-extrabold text-navy">{p.monto}</td>
                  <td className="px-5 py-4 text-slate-600">${p.tarifaConductor.toFixed(2)}</td>
                  <td className="px-5 py-4 text-slate-600">${p.membresia.toFixed(2)}</td>
                  <td className="px-5 py-4 text-slate-600">{p.mesContrato}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.status === 'Exitoso' ? 'bg-emerald-50 text-emerald-700' : p.status === 'Pendiente' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{p.fecha}</td>
                </tr>
              ))}
              {pagos.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">No hay pagos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PanelSection>
  );
}
