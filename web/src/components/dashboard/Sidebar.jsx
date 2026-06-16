'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FiBarChart2, FiCreditCard, FiGrid,
  FiHome, FiLogOut, FiMenu, FiTruck, FiUser, FiUsers, FiX,
} from 'react-icons/fi';

const adminLinks = [
  { href: '/dashboard/admin', label: 'Inicio', icon: FiGrid },
  { href: '/dashboard/admin/usuarios', label: 'Usuarios', icon: FiUsers },
  { href: '/dashboard/admin/escuelas', label: 'Escuelas', icon: FiHome },
  { href: '/dashboard/admin/ingresos', label: 'Ingresos', icon: FiBarChart2 },
];

const conductorLinks = [
  { href: '/dashboard/conductor', label: 'Inicio', icon: FiGrid },
  { href: '/dashboard/conductor/viajes', label: 'Rutas', icon: FiTruck },
  { href: '/dashboard/conductor/estudiantes', label: 'Estudiantes', icon: FiUsers },
  { href: '/dashboard/conductor/pagos', label: 'Pagos', icon: FiCreditCard },
  { href: '/dashboard/conductor/perfil', label: 'Perfil', icon: FiUser },
];

const padreLinks = [
  { href: '/dashboard/padre', label: 'Inicio', icon: FiGrid },
  { href: '/dashboard/padre/pagos', label: 'Pagos', icon: FiCreditCard },
  { href: '/dashboard/padre/perfil', label: 'Perfil', icon: FiUser },
];

export default function Sidebar({ role = 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [profile, setProfile] = useState({ name: '...', label: '', initials: '..', photoURL: null });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('busway_usuario');
      if (!raw) return;
      const u = JSON.parse(raw);
      const nombre = `${u.nombre} ${u.apellido}`;
      const initials = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
      const label =
        u.tipo === 'administrador' ? 'Administrador' :
        u.tipo === 'conductor' ? 'Conductor' : 'Padre de familia';
      setProfile({ name: nombre, label, initials, photoURL: u.foto_perfil ?? null });
    } catch {}
  }, []);

  const links =
    role === 'admin' ? adminLinks :
    role === 'conductor' ? conductorLinks :
    padreLinks;

  const handleLogout = () => {
    localStorage.removeItem('busway_token');
    localStorage.removeItem('busway_usuario');
    document.cookie = 'busway_token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <aside className={[
      'flex min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300',
      collapsed ? 'w-[72px]' : 'w-64',
    ].join(' ')}>

      {/* Header con logo y toggle */}
      <div className="flex items-center justify-between px-3 py-5">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <Image src="/logo.jpg" alt="BusWay" fill sizes="40px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tight text-navy">
                Bus<span className="text-busway-blue">Way</span>
              </h1>
              <p className="text-[10px] font-semibold text-navy leading-tight">
                tus hijos <span className="text-busway-blue">seguros</span>
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-navy',
            collapsed ? 'mx-auto' : '',
          ].join(' ')}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <FiMenu size={18} /> : <FiX size={18} />}
        </button>
      </div>

      {/* Perfil */}
      <div className={[
        'flex min-h-16 items-center gap-3 bg-navy px-3 py-3',
        collapsed ? 'justify-center' : 'justify-between',
      ].join(' ')}>
        <div className="flex min-w-0 items-center gap-2">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/15"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-busway-yellow text-sm font-extrabold text-navy shadow-sm ring-2 ring-white/15">
              {profile.initials}
            </span>
          )}
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-white">{profile.name}</span>
              <span className="block truncate text-xs font-semibold text-white/65">{profile.label}</span>
            </span>
          )}
        </div>

        {!collapsed && (
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/75 transition hover:bg-white/10 hover:text-busway-yellow"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <FiLogOut size={17} />
          </button>
        )}
      </div>

      {/* Logout cuando está colapsado */}
      {collapsed && (
        <button
          type="button"
          onClick={handleLogout}
          className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
          title="Cerrar sesión"
        >
          <FiLogOut size={17} />
        </button>
      )}

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={[
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition',
                collapsed ? 'justify-center' : '',
                active ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-navy',
              ].join(' ')}
            >
              <Icon size={17} className={active ? 'text-busway-yellow' : 'text-busway-blue'} />
              {!collapsed && link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}