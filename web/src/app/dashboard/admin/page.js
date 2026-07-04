'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/dashboard/StatsCard';
import { FiAlertCircle, FiCheckCircle, FiFileText, FiTruck, FiUsers } from 'react-icons/fi';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    { title: 'Conductores activos', value: '...', icon: <FiTruck />, color: '#1E88E5', sub: '' },
    { title: 'Padres registrados', value: '...', icon: <FiUsers />, color: '#0D1B3D', sub: '' },
    { title: 'Ingresos del mes', value: '...', icon: <FiCheckCircle />, color: '#10B981', sub: 'Pagos confirmados' },
    { title: 'Cuentas bloqueadas', value: '...', icon: <FiAlertCircle />, color: '#EF4444', sub: 'Conductores y padres' },
  ]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    Promise.all([api.getUsuarios(), api.getPagos()])
      .then(([usuariosData, pagosData]) => {
        const usuarios = usuariosData.usuarios;
        const conductoresActivos = usuarios.filter((u) => u.tipo === 'conductor' && u.estado === 'activo').length;
        const padresRegistrados = usuarios.filter((u) => u.tipo === 'padre').length;
        const bloqueados = usuarios.filter((u) => ['conductor', 'padre'].includes(u.tipo) && u.estado === 'bloqueado');

        setStats([
          { title: 'Conductores activos', value: String(conductoresActivos), icon: <FiTruck />, color: '#1E88E5', sub: 'Total activos' },
          { title: 'Padres registrados', value: String(padresRegistrados), icon: <FiUsers />, color: '#0D1B3D', sub: 'Total registrados' },
          { title: 'Ingresos del mes', value: `$${pagosData.totalMes.toFixed(2)}`, icon: <FiCheckCircle />, color: '#10B981', sub: 'Pagos confirmados' },
          { title: 'Cuentas bloqueadas', value: String(bloqueados.length), icon: <FiAlertCircle />, color: '#EF4444', sub: 'Conductores y padres' },
        ]);

        setBlockedUsers(bloqueados.slice(0, 5).map((usuario) => ({
          id: usuario._id,
          name: `${usuario.nombre} ${usuario.apellido}`,
          detail: usuario.correo,
          status: usuario.tipo === 'conductor' ? 'Conductor bloqueado' : 'Padre bloqueado',
        })));
      })
      .catch(console.error);
  }, []);

  const quickLinks = [
    { href: '/dashboard/admin/usuarios', label: 'Gestionar usuarios', desc: 'Activa o bloquea cuentas.' },
    { href: '/dashboard/admin/escuelas', label: 'Administrar escuelas', desc: 'Rutas, conductores y estado.' },
    { href: '/dashboard/admin/ingresos', label: 'Revisar ingresos', desc: 'Pagos mensuales y exportación.' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-2 text-2xl font-extrabold text-navy">Inicio</h1>
          <p className="mt-1 text-sm text-slate-500">Resumen operativo de escuelas, usuarios e ingresos.</p>
        </div>
        <Link href="/dashboard/admin/usuarios" className="inline-flex items-center gap-2 rounded-md bg-busway-yellow px-4 py-2.5 text-sm font-extrabold text-navy shadow-sm transition hover:bg-yellow-400">
          <FiFileText size={16} /> Gestionar cuentas
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatsCard key={stat.title} {...stat} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-navy px-5 py-4"><h2 className="text-sm font-extrabold text-white">Cuentas bloqueadas</h2></div>
          <div className="divide-y divide-slate-100 p-4">
            {blockedUsers.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No hay cuentas bloqueadas.</p>
            ) : blockedUsers.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-navy"><FiUsers size={17} /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.detail}</p>
                  </div>
                </div>
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{user.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-navy">Accesos rápidos</h2>
          <div className="mt-4 space-y-3">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-lg border border-slate-200 px-4 py-3 transition hover:border-busway-blue hover:bg-blue-50/40">
                <p className="text-sm font-bold text-navy">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
