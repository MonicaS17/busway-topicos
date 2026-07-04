'use client';
import Sidebar from '@/components/dashboard/Sidebar';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function getRole(pathname) {
  if (pathname.includes('/admin')) return 'admin';
  if (pathname.includes('/conductor')) return 'conductor';
  return 'padre';
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const role = getRole(pathname);

  useEffect(() => {
    try {
      const usuario = JSON.parse(localStorage.getItem('busway_usuario'));
      if (!usuario?.tipo) return;
      const expected = usuario.tipo === 'administrador' ? 'admin' : usuario.tipo;
      if (role !== expected) router.replace(`/dashboard/${expected}`);
    } catch {
      router.replace('/login');
    }
  }, [role, router]);

  return (
    <div className="flex min-h-screen bg-busway-light">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
