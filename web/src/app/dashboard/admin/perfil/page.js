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
        <p className="mt-1 text-sm font-medium text-white/70">Administrador del sistema</p>
      </div>
    </div>
  );
}

export default function AdminPerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    api.getPerfil()
      .then((data) => {
        setUsuario(data.usuario);
        setNombre(data.usuario?.nombre || '');
        setApellido(data.usuario?.apellido || '');
        setFotoPerfil(data.usuario?.foto_perfil || '');
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
      
      // Update local storage so sidebar updates immediately
      const rawUser = localStorage.getItem('busway_usuario');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const updated = { ...u, nombre: res.usuario.nombre, apellido: res.usuario.apellido, foto_perfil: res.usuario.foto_perfil };
        localStorage.setItem('busway_usuario', JSON.stringify(updated));
      }
      
      // Dispatch custom event to notify Sidebar
      window.dispatchEvent(new Event('busway_profile_updated'));
      
      setUsuario(res.usuario);
      setEditing(false);
      loadData();
    } catch (err) {
      setError(err.message || 'No se pudo guardar la información');
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

  const fullName = usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Administrador';
  const initials = usuario
    ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase()
    : 'AD';
  const photoURL = usuario?.foto_perfil ?? null;

  return (
    <PanelSection title="Perfil de Administrador" description="Administra tus datos personales y credenciales de acceso.">
      <div className="mb-4">
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy transition"
        >
          <FiArrowLeft size={14} /> Regresar al inicio
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <DataCard title="Detalle de Perfil">
          <div className="space-y-5">
            <ProfilePhoto initials={initials} name={fullName} label="Administrador" photoURL={photoURL} />
            
            {!editing ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ReadOnlyField label="Nombre" value={usuario?.nombre} />
                  <ReadOnlyField label="Apellido" value={usuario?.apellido} />
                </div>
                <ReadOnlyField label="Correo electrónico" value={usuario?.correo} />
                
                <button
                  onClick={() => setEditing(true)}
                  className="w-full rounded-md bg-busway-yellow py-2.5 text-sm font-extrabold text-navy hover:bg-yellow-400 transition shadow-sm"
                >
                  Editar Perfil
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {error && <p className="text-xs font-bold text-red-500">{error}</p>}
                
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
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Foto de Perfil</label>
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

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 rounded-md bg-navy py-2.5 text-sm font-extrabold text-white hover:bg-slate-800 transition disabled:opacity-50"
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
                    className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </DataCard>
      </div>
    </PanelSection>
  );
}
