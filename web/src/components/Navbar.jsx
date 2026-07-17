'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/funciones', label: 'Funciones web' },
  { href: '/como-funciona', label: 'App Móvil' },
  { href: '/descargar', label: 'Descargar' },
  { href: '/contacto', label: 'Contacto' },
];

function LogoMark() {
  return (
    <span className="mb-3 flex items-center gap-4">
      <span className="relative h-12 w-12 overflow-hidden rounded-full block">
        <Image src="/logo.jpg" alt="BusWay" fill sizes="48px" className="w-full h-full object-cover" />
      </span>

      <span className="flex flex-col justify-center">
        <span className="text-xl font-extrabold text-navy block">
          Bus<span className="text-busway-blue">Way</span>
        </span>

        <span className="text-xs font-bold text-navy block">
          tus hijos <span className="text-busway-blue">seguros</span> en cada ruta
        </span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'text-sm font-bold transition',
                  active ? 'text-busway-blue' : 'text-slate-600 hover:text-navy',
                ].join(' ')}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="rounded-md bg-busway-yellow px-5 py-2.5 text-sm font-extrabold text-navy shadow-sm transition hover:bg-yellow-400"
          >
            Iniciar sesion
          </Link>
          {isDashboard && (
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-navy"
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
            >
              <FiLogOut size={18} />
            </Link>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-md text-navy md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
          type="button"
        >
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-slate-200 bg-white px-5 py-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-2 rounded-md bg-busway-yellow px-5 py-2.5 text-center text-sm font-extrabold text-navy"
          >
            Iniciar sesion
          </Link>
        </div>
      )}
    </nav>
  );
}
