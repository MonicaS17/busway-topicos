'use client';
import { useState, useEffect } from 'react';
import PanelSection, { DataCard } from '@/components/dashboard/PanelSection';
import { api } from '@/lib/api';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getPerfil(), api.getPadreHijos()])
      .then(([perfilData, hijosData]) => {
        setUsuario(perfilData.usuario);
        setHijos(hijosData.hijos || []);

        setNombre(perfilData.usuario?.nombre || '');
        setApellido(perfilData.usuario?.apellido || '');
        setFotoPerfil(perfilData.usuario?.foto_perfil || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let finalPhotoURL = fotoPerfil;
      if (fotoPerfil && fotoPerfil.startsWith('data:image/')) {
        const CLOUDINARY_CLOUD_NAME = 'dugkhwso5';
        const CLOUDINARY_UPLOAD_PRESET = 'busway_perfiles';

        const formData = new FormData();
        formData.append('file', fotoPerfil);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        const data = await response.json();
        if (!data.secure_url) {
          throw new Error('No se pudo subir la imagen a Cloudinary');
        }
        finalPhotoURL = data.secure_url;
      }

      const res = await api.actualizarPerfil({
        nombre: String(nombre || '').trim(),
        apellido: String(apellido || '').trim(),
        foto_perfil: finalPhotoURL || null
      });

      // Update localStorage so sidebar updates immediately
      const rawUser = localStorage.getItem('busway_usuario');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const updated = {
          ...u,
          nombre: res.usuario.nombre,
          apellido: res.usuario.apellido,
          foto_perfil: res.usuario.foto_perfil
        };
        localStorage.setItem('busway_usuario', JSON.stringify(updated));
      }

      // Dispatch custom event to notify Sidebar
      window.dispatchEvent(new Event('busway_profile_updated'));

      setUsuario(res.usuario);
      setEditing(false);
      loadData();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-slate-500">Cargando perfil...</p>
      </div>
    );
  }

  const fullName = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Padre BusWay';
  const initials = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
    : 'PB';
  const photoURL = usuario?.foto_perfil ?? null;

  const parentInfo = [
    ['Nombre', fullName],
    ['Correo electrónico', usuario?.correo],
    ['Cédula', usuario?.cedula],
  ];

  const formContent = (
    <>
      {error && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        {/* Card 1: Datos Personales */}
        <DataCard title="Datos personales">
          <div className="space-y-5">
            <ProfilePhoto initials={initials} name={fullName} label="Padre de familia" photoURL={photoURL} />
            
            {!editing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {parentInfo.map(([label, value]) => (
                  <ReadOnlyField key={label} label={label} value={value} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellido</label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-navy focus:border-busway-blue focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subir Foto de Perfil</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFotoPerfil(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-extrabold file:bg-navy file:text-white hover:file:bg-slate-800"
                  />
                  {fotoPerfil && fotoPerfil.startsWith('data:image/') && (
                    <p className="mt-2 text-xs text-emerald-600 font-bold">✓ Imagen lista para subir</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DataCard>

        {/* Card 2: Hijos Registrados */}
        <DataCard title="Hijos registrados">
          <div className="grid gap-4">
            <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
              <p className="text-xs font-bold uppercase text-slate-500">Total registrados</p>
              <p className="mt-1 text-4xl font-extrabold text-navy">{hijos.length}</p>
            </div>
            <div className="space-y-4 text-sm">
              {hijos.length === 0 ? (
                <p className="text-sm text-slate-400">No tienes hijos registrados aún.</p>
              ) : (
                hijos.map((h) => (
                  <div key={h._id} className="rounded-md border border-slate-200 p-4 bg-white hover:shadow-sm transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <p className="text-base font-extrabold text-navy">{h.nombre}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${h.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {h.estado}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      {h.ruta_id ? (
                        <div className="rounded border border-slate-100 bg-slate-50/50 p-3">
                          <p className="text-xs font-extrabold text-slate-400 uppercase">Ruta Escolar</p>
                          <p className="mt-0.5 text-sm font-extrabold text-navy">{h.ruta_id.nombre || h.ruta_id.nombre_ruta}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{h.ruta_id.escuela} · Zona: {h.ruta_id.zona}</p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-red-500">⚠ Sin ruta asignada</p>
                      )}

                      {h.conductor_id ? (
                        <div className="rounded border border-slate-100 bg-slate-50/50 p-3">
                          <p className="text-xs font-extrabold text-slate-400 uppercase">Conductor Asignado</p>
                          <p className="mt-0.5 text-sm font-extrabold text-navy">{h.conductor_id.nombre} {h.conductor_id.apellido}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Contacto: {h.conductor_id.correo}</p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-400">Sin conductor asignado</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DataCard>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md bg-busway-yellow px-6 py-2.5 text-sm font-extrabold text-navy hover:bg-yellow-400 transition shadow-sm"
          >
            Editar Perfil
          </button>
        ) : (
          <>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-navy px-6 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
                setNombre(usuario?.nombre || '');
                setApellido(usuario?.apellido || '');
                setFotoPerfil(usuario?.foto_perfil || '');
              }}
              className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </>
  );

  return (
    <PanelSection title="Perfil" description="Información personal y cantidad de hijos registrados.">
      <div className="mb-4">
        <Link
          href="/dashboard/padre"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <FiArrowLeft size={14} /> Regresar al inicio
        </Link>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-6">
          {formContent}
        </form>
      ) : (
        <div className="space-y-6">
          {formContent}
        </div>
      )}
    </PanelSection>
  );
}
