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

export default function PadrePerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [hijos, setHijos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPerfil(), api.getPadreHijos()])
      .then(([perfilData, hijosData]) => {
        setUsuario(perfilData.usuario);
        setHijos(hijosData.hijos);
      })
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

  const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Padre BusWay';
  const initials = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
    : 'PB';
  const photoURL = usuario?.foto_perfil ?? null;

  const parentInfo = [
    ['Nombre', nombre],
    ['Correo electrónico', usuario?.correo],
    ['Cédula', usuario?.cedula],
    ['Estado', usuario?.estado],
  ];

  return (
    <PanelSection title="Perfil" description="Información personal y cantidad de hijos registrados.">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <DataCard title="Datos personales">
          <div className="space-y-5">
            <ProfilePhoto initials={initials} name={nombre} label="Padre de familia" photoURL={photoURL} />
            <div className="grid gap-3 sm:grid-cols-2">
              {parentInfo.map(([label, value]) => (
                <ReadOnlyField key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </DataCard>

        <DataCard title="Hijos registrados">
          <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr] lg:grid-cols-1 xl:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold uppercase text-slate-500">Total registrados</p>
              <p className="mt-1 text-4xl font-extrabold text-navy">{hijos.length}</p>
            </div>
            <div className="space-y-3 text-sm">
              {hijos.length === 0 ? (
                <p className="text-sm text-slate-400">No tienes hijos registrados aún.</p>
              ) : (
                hijos.map((h) => (
                  <div key={h._id} className="rounded-md border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-extrabold text-navy">{h.nombre}</p>
                      <span className="rounded-full bg-busway-yellow px-2.5 py-1 text-[11px] font-extrabold text-navy">
                        {h.estado}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {h.conductor_id ? `Conductor: ${h.conductor_id.nombre} ${h.conductor_id.apellido}` : 'Sin conductor asignado'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DataCard>
      </div>
    </PanelSection>
  );
}
