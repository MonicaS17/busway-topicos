'use client';
import { useEffect, useMemo, useState } from 'react';
import { FiClock, FiDownload, FiSearch } from 'react-icons/fi';
import { api } from '@/lib/api';
import { exportToExcel, exportToPdf } from '@/lib/exportReports';

export default function HistorialAdminPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLogs()
      .then((data) => setLogs(data.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return logs;
    return logs.filter((log) => [
      log.tipo, log.descripcion, log.usuario_id?.nombre,
      log.usuario_id?.apellido, log.usuario_id?.correo,
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }, [logs, search]);

  const report = {
    title: 'Historial de actividad del sistema',
    columns: ['Fecha', 'Tipo', 'Usuario', 'Rol', 'Descripción'],
    rows: filtered.map((log) => [
      new Date(log.fecha).toLocaleString('es-PA'),
      log.tipo,
      log.usuario_id ? `${log.usuario_id.nombre} ${log.usuario_id.apellido}` : 'Sistema',
      log.usuario_id?.tipo || '—',
      log.descripcion,
    ]),
    fileName: 'busway-historial-actividad',
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-slate-500">Cargando historial...</div>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-navy"><FiClock size={23} /> Historial</h1>
          <p className="mt-1 text-sm text-slate-500">Eventos y acciones relevantes registrados por el sistema.</p>
        </div>
        <div className="flex gap-2">
          {[
            ['PDF', () => exportToPdf(report)],
            ['Excel', () => exportToExcel(report)],
          ].map(([format, action]) => (
            <button key={format} type="button" onClick={() => action().catch((error) => alert(error.message))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy hover:border-busway-blue">
              <FiDownload size={14} /> {format}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo, usuario o descripción" className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-busway-blue" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy"><tr>
              {['Fecha', 'Tipo', 'Usuario', 'Descripción'].map((title) => <th key={title} className="px-5 py-3 text-left font-bold">{title}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(log.fecha).toLocaleString('es-PA')}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{log.tipo}</span></td>
                  <td className="px-5 py-4 font-semibold text-slate-700">{log.usuario_id ? `${log.usuario_id.nombre} ${log.usuario_id.apellido}` : 'Sistema'}</td>
                  <td className="px-5 py-4 text-slate-600">{log.descripcion}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No hay eventos que coincidan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
