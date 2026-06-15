/* 
import React from 'react';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar({ usuario, onLogout }) {
  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <span style={styles.logoBus}>Bus</span>
        <span style={styles.logoWay}>Way</span>
      </div>

      <div style={styles.right}>
        {usuario ? (
          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {usuario.nombre} {usuario.apellido}
            </span>
            <span style={styles.userRole}>
              {usuario.tipo === 'administrador' ? '⚙️ Admin' :
               usuario.tipo === 'conductor' ? '🚌 Conductor' : '👨‍👧 Padre'}
            </span>
            <button style={styles.btnLogout} onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <a href="/login" style={styles.btnLogin}>
            Iniciar sesión
          </a>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: '#0D1B3E',
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoBus: {
    color: '#fff',
  },
  logoWay: {
    color: '#00AEEF',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userRole: {
    color: '#00AEEF',
    fontSize: 12,
    backgroundColor: 'rgba(0,174,239,0.15)',
    padding: '4px 10px',
    borderRadius: 20,
  },
  btnLogout: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
  },
  btnLogin: {
    backgroundColor: '#FFD700',
    color: '#0D1B3E',
    padding: '10px 24px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: 14,
  },
};
*/