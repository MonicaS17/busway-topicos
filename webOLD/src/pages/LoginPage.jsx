
/*
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

export default function LoginPage({ onLogin }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!correo || !contrasena) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setCargando(true);
      const userCredential = await signInWithEmailAndPassword(auth, correo, contrasena);
      const token = await userCredential.user.getIdToken();

      const response = await axios.post(`${API}/api/auth/login`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onLogin(response.data.usuario, token);

    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos');
      } else {
        setError('Ocurrió un error. Intenta de nuevo');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brand}>
          <span style={styles.brandBus}>Bus</span>
          <span style={styles.brandWay}>Way</span>
        </div>
        <p style={styles.brandSlogan}>tus hijos <span style={{ color: '#00AEEF' }}>seguros</span> en cada ruta</p>
        <div style={styles.features}>
          <div style={styles.feature}>✅ GPS en tiempo real</div>
          <div style={styles.feature}>✅ Control de asistencia con QR</div>
          <div style={styles.feature}>✅ Pagos automáticos seguros</div>
          <div style={styles.feature}>✅ Conductores verificados por ATTT</div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Iniciar sesión</h2>
          <p style={styles.subtitle}>Ingresa con tu cuenta de BusWay</p>

          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <label style={styles.label}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="correo@ejemplo.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
            />

            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
            />

            <button
              type="submit"
              style={{ ...styles.btnLogin, opacity: cargando ? 0.7 : 1 }}
              disabled={cargando}
            >
              {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={styles.nota}>
            ¿No tienes cuenta? Descarga la app móvil para registrarte.
          </p>

          <a href="/" style={styles.volver}>← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  left: {
    flex: 1,
    background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3A6E 100%)',
    padding: '60px 48px',
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center',
  },
  brand: { fontSize: 56, fontWeight: 'bold', marginBottom: 8 },
  brandBus: { color: '#fff' },
  brandWay: { color: '#00AEEF' },
  brandSlogan: { color: '#B5D4F4', fontSize: 18, marginBottom: 48 },
  features: { display: 'flex', flexDirection: 'column', gap: 16 },
  feature: { color: '#fff', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 },
  right: {
    width: 480,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8f9fa', padding: 40,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 40, width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 6px' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 24px' },
  errorBox: {
    backgroundColor: '#FEE2E2', color: '#7A1F1F',
    padding: '12px 16px', borderRadius: 10,
    fontSize: 14, marginBottom: 16,
    border: '1px solid #F09595',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#555', marginTop: 10, fontWeight: '500' },
  input: {
    padding: '12px 16px', borderRadius: 10,
    border: '1.5px solid #ddd', fontSize: 15,
    outline: 'none', backgroundColor: '#f9f9f9',
  },
  btnLogin: {
    backgroundColor: '#FFD700', color: '#0D1B3E',
    padding: '14px', borderRadius: 10,
    border: 'none', fontWeight: '700',
    fontSize: 15, cursor: 'pointer', marginTop: 16,
  },
  nota: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 20 },
  volver: { display: 'block', textAlign: 'center', color: '#0D1B3E', fontSize: 13, marginTop: 12, textDecoration: 'none' },
};
*/