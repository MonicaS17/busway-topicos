'use client';
import { useState, useEffect } from 'react';
import PanelSection from '@/components/dashboard/PanelSection';
import { api } from '@/lib/api';

export default function ConductorEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConductorEstudiantes()
      .then((data) => setEstudiantes(data.estudiantes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando estudiantes...</p>
      </div>
    );
  }

  return (
    <PanelSection title="Lista de estudiantes" description="Estudiantes que el conductor transporta actualmente.">
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-busway-yellow text-xs uppercase text-navy">
              <tr>
                {['Estudiante', 'Padre o acudiente', 'Contacto', 'Ruta', 'Escuela', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {estudiantes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    No tienes estudiantes registrados aún.
                  </td>
                </tr>
              ) : (
                estudiantes.map((est) => (
                  <tr key={est._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-700">{est.nombre}</td>
                    <td className="px-5 py-4 text-slate-600">{est.padre_id ? `${est.padre_id.nombre} ${est.padre_id.apellido}` : 'No disponible'}</td>
                    <td className="px-5 py-4 text-slate-600">{est.padre_id?.correo || '—'}</td>
                    <td className="px-5 py-4 text-slate-600">{est.ruta_id?.nombre || 'Sin asignar'}</td>
                    <td className="px-5 py-4 text-slate-600">{est.ruta_id?.escuela || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {est.estado}
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
