'use client';
import { useState, useEffect } from 'react';
import PanelSection from '@/components/dashboard/PanelSection';
import { FiDownload } from 'react-icons/fi';
import { api } from '@/lib/api';
import { exportToExcel, exportToPdf } from '@/lib/exportReports';

export default function PadrePagosPage() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPadrePagos()
      .then((data) => setPagos(data.pagos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando pagos...</p>
      </div>
    );
  }

  const report = {
    title: 'Historial de pagos del padre',
    columns: ['Fecha', 'Conductor', 'Monto', 'Tarifa', 'Membresía', 'Mes', 'Estado'],
    rows: pagos.map((p) => [
      p.fecha, p.conductor, p.monto, `$${p.tarifaConductor.toFixed(2)}`,
      `$${p.membresia.toFixed(2)}`, p.mesContrato, p.estado,
    ]),
    fileName: 'busway-mis-pagos',
  };

  return (
    <PanelSection title="Registro de pagos" description="Historial de pagos realizados con fecha, monto, desglose y estado.">
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
                <FiDownload size={14} />
                Descargar {format}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy">
              <tr>
                {['Fecha', 'Conductor', 'Monto', 'Mes', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No tienes pagos registrados aún.
                  </td>
                </tr>
              ) : (
                pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-600">{p.fecha}</td>
                    <td className="px-5 py-4 text-slate-600">{p.conductor}</td>
                    <td className="px-5 py-4 font-extrabold text-navy">{p.monto}</td>
                    <td className="px-5 py-4 text-slate-600">{p.mesContrato}</td>
                    <td className="px-5 py-4">
                      <span className={[
                        'rounded-full px-3 py-1 text-xs font-bold',
                        p.estado === 'Exitoso' || p.estado === 'Pagado'
                          ? 'bg-emerald-50 text-emerald-700'
                          : p.estado === 'Pendiente'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700',
                      ].join(' ')}>
                        {p.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PanelSection>
  );
}
