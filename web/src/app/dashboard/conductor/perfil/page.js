'use client';
import { useState, useEffect } from 'react';
import PanelSection, { DataCard } from '@/components/dashboard/PanelSection';
import { api } from '@/lib/api';

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-navy">{value || '—'}</p>
    </div>
  );
}

function ProfilePhoto({ initials, name, label, photoURL }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-navy p-6 text-center text-white">
      <div className="h-32 w-32 shrink-0 rounded-full ring-4 ring-white/10 overflow-hidden shadow-sm">
        {photoURL ? (
          <img
            src={photoURL}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-busway-yellow text-4xl font-extrabold text-navy">
            {initials}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-xs font-bold uppercase text-white/60">{label}</p>
        <h2 className="mt-1 text-2xl font-extrabold">{name}</h2>
        <p className="mt-1 text-sm font-medium text-white/70">Dueño de la cuenta</p>
      </div>
    </div>
  );
}

export default function ConductorPerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('busway_usuario');
      if (raw) setUsuario(JSON.parse(raw));
    } catch {}

    api.getConductorPerfil()
      .then((data) => setVehiculo(data.vehiculo))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Conductor BusWay';
  const initials = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
    : 'CB';
  const photoURL = usuario?.foto_perfil ?? null;

  const driverInfo = [
    ['Nombre', nombre],
    ['Correo electrónico', usuario?.correo],
    ['Cédula', usuario?.cedula],
    ['Estado', usuario?.estado],
  ];

  const busInfo = vehiculo ? [
    ['Placa', vehiculo.placa],
    ['Marca', vehiculo.marca],
    ['Modelo', vehiculo.modelo],
    ['Año', vehiculo.anio],
    ['Asientos', vehiculo.num_asientos],
    ['Verificación', vehiculo.estado_verificacion],
  ] : [];

  return (
    <PanelSection title="Perfil" description="Consulta tus datos, bus asignado y cupos disponibles.">
      <div className="grid gap-5 lg:grid-cols-2">
        <DataCard title="Datos del conductor">
          <div className="space-y-5">
            <ProfilePhoto initials={initials} name={nombre} label="Conductor" photoURL={photoURL} />
            <div className="grid gap-3 sm:grid-cols-2">
              {driverInfo.map(([label, value]) => (
                <ReadOnlyField key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </DataCard>

        <DataCard title="Bus y vehículo">
          {vehiculo ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {busInfo.map(([label, value]) => (
                <ReadOnlyField key={label} label={label} value={String(value)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No tienes vehículo registrado aún.</p>
          )}
        </DataCard>
      </div>
    </PanelSection>
  );
}