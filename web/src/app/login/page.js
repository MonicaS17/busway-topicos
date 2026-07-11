'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiLock, FiMail, FiEye, FiEyeOff } from 'react-icons/fi';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [correoRecuperacion, setCorreoRecuperacion] = useState('');
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');
  const [errorRecuperacion, setErrorRecuperacion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const credencial = await signInWithEmailAndPassword(auth, form.email, form.password);
      const token = await credencial.user.getIdToken();

      localStorage.setItem('busway_token', token);
      
      // Establecer la cookie de sesion de manera segura (HttpOnly, Secure) en el servidor Next.js
      await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        setLoading(false);
        return;
      }

      localStorage.setItem('busway_usuario', JSON.stringify(data.usuario));

      const rol = data.usuario.tipo;
      if (rol === 'administrador') router.push('/dashboard/admin');
      else if (rol === 'conductor') router.push('/dashboard/conductor');
      else if (rol === 'padre') router.push('/dashboard/padre');
      else setError('Rol no reconocido. Contacta al administrador.');

    } catch (err) {
      const mensajes = {
        'auth/invalid-credential': 'Correo o contraseña incorrectos',
        'auth/user-not-found': 'No existe una cuenta con este correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      };
      setError(mensajes[err.code] || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarContrasena = async (e) => {
    e.preventDefault();
    const correo = correoRecuperacion.trim().toLowerCase();
    if (!correo) {
      setErrorRecuperacion('Ingresa tu correo electrónico.');
      return;
    }
    setEnviandoRecuperacion(true);
    setMensajeRecuperacion('');
    setErrorRecuperacion('');

    try {
      auth.languageCode = 'es';
      await sendPasswordResetEmail(auth, correo);
      setMensajeRecuperacion('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.');
      setCorreoRecuperacion('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setMensajeRecuperacion('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
      } else {
        const mensajes = {
          'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
          'auth/missing-email': 'Ingresa tu correo electrónico.',
          'auth/too-many-requests': 'Se realizaron demasiados intentos. Espera unos minutos.',
          'auth/network-request-failed': 'No se pudo conectar con Firebase. Verifica tu conexión.',
          'auth/unauthorized-continue-uri': 'El dominio de la web no está autorizado en Firebase.',
        };
        setErrorRecuperacion(mensajes[err.code] || 'No se pudo enviar el correo de recuperación. Intenta nuevamente.');
      }
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  const abrirRecuperacion = () => {
    setCorreoRecuperacion(form.email.trim().toLowerCase());
    setMensajeRecuperacion('');
    setErrorRecuperacion('');
    setModalVisible(true);
  };

  const cerrarRecuperacion = () => {
    setModalVisible(false);
    setCorreoRecuperacion('');
    setMensajeRecuperacion('');
    setErrorRecuperacion('');
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-2">
        <section className="flex bg-navy px-10 py-10 text-white md:px-16">
          <div className="flex w-full flex-col items-center justify-center text-center">
            <span className="relative block h-44 w-44 overflow-hidden rounded-full border-4 border-busway-blue md:h-72 md:w-72">
              <Image src="/logo.jpg" alt="BusWay" fill sizes="288px" className="object-cover" priority />
            </span>
            <h1 className="mt-5 text-6xl font-black tracking-tight">
              Bus<span className="text-busway-blue">Way</span>
            </h1>
            <p className="mt-4 max-w-md text-xl font-medium leading-8 text-white/75">
              Tus hijos <span className="text-busway-blue">seguros</span> en cada ruta
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-8 py-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <p className="text-sm font-extrabold uppercase tracking-wider text-busway-blue">Bienvenido</p>
              <h2 className="mt-2 text-4xl font-black text-navy">Inicio de sesión</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ingresa tus credenciales para acceder a BusWay.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-navy">
                  Correo electrónico
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-busway-blue focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wide text-navy">
                  Contraseña
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-4 pl-12 pr-12 text-sm outline-none transition focus:border-busway-blue focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy transition"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-busway-yellow py-4 text-sm font-extrabold text-navy shadow-md transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Ingresando...' : 'Iniciar sesión'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={abrirRecuperacion}
                  className="text-sm font-semibold text-navy transition hover:text-busway-blue"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      {/* Modal recuperación */}
      {modalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="text-xl font-extrabold text-navy">Recuperar contraseña</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {mensajeRecuperacion && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {mensajeRecuperacion}
              </div>
            )}

            {errorRecuperacion && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorRecuperacion}
              </div>
            )}

            {!mensajeRecuperacion && (
              <form onSubmit={handleRecuperarContrasena} className="mt-5 space-y-4">
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={correoRecuperacion}
                    onChange={(e) => setCorreoRecuperacion(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-busway-blue focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={enviandoRecuperacion || !correoRecuperacion.trim()}
                  className="w-full rounded-xl bg-busway-yellow py-4 text-sm font-extrabold text-navy transition hover:bg-yellow-400 disabled:opacity-60"
                >
                  {enviandoRecuperacion ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={cerrarRecuperacion}
              className="mt-4 w-full py-3 text-sm font-semibold text-slate-400 transition hover:text-navy"
            >
              {mensajeRecuperacion ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
