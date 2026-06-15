/*
import React from 'react';
import Navbar from '../components/Navbar';

export default function DashboardPadre({ usuario, onLogout }) {
  return (
    <div style={styles.page}>
      <Navbar usuario={usuario} onLogout={onLogout} />

      <div style={styles.container}>
        {/* Bienvenida */
        /*
        <div style={styles.welcome}>
          <h1 style={styles.welcomeTitle}>Panel del Padre</h1>
          <p style={styles.welcomeDesc}>Bienvenido, {usuario.nombre}. Aquí puedes ver la información de tus hijos y pagos.</p>
        </div>

        {/* Hijos */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👨‍👧 Mis hijos</h2>
          <div style={styles.hijosGrid}>
            {[
              { nombre: 'Carlos Gómez', escuela: 'Colegio San Agustín', qr: true },
              { nombre: 'Sofía Gómez', escuela: 'Colegio San Agustín', qr: true },
            ].map((h, i) => (
              <div key={i} style={styles.hijoCard}>
                <div style={styles.hijoAvatar}>
                  {h.nombre.charAt(0)}
                </div>
                <div style={styles.hijoInfo}>
                  <span style={styles.hijoNombre}>{h.nombre}</span>
                  <span style={styles.hijoEscuela}>{h.escuela}</span>
                </div>
                <button style={styles.btnQr}>📱 Ver QR</button>
              </div>
            ))}
          </div>
        </div>

        {/* Info del bus */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🚌 Mi conductor</h2>
          <div style={styles.busCard}>
            <div style={styles.busInfo}>
              <div style={styles.busAvatar}>JP</div>
              <div>
                <p style={styles.busNombre}>Juan Pérez</p>
                <p style={styles.busDetalle}>Toyota Coaster · Placa BC-1234</p>
                <p style={styles.busDetalle}>📞 6500-1234</p>
                <div style={styles.busRating}>
                  ⭐⭐⭐⭐⭐ <span style={styles.busRatingNum}>4.8</span>
                </div>
              </div>
            </div>
            <div style={styles.busEstado}>
              <span style={styles.badge}>✅ Activo</span>
              <p style={styles.busContrato}>Mes 3 de 10</p>
            </div>
          </div>
        </div>

        {/* Historial de pagos */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💳 Historial de pagos</h2>
          <div style={styles.tabla}>
            <div style={{ ...styles.tablaHeader, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <span>Mes</span>
              <span>Conductor</span>
              <span>Monto total</span>
              <span>Estado</span>
            </div>
            {[
              { mes: 'Mayo 2026', conductor: 'Juan Pérez', monto: '$55.99', estado: 'exitoso' },
              { mes: 'Abril 2026', conductor: 'Juan Pérez', monto: '$55.99', estado: 'exitoso' },
              { mes: 'Marzo 2026', conductor: 'Juan Pérez', monto: '$55.99', estado: 'exitoso' },
            ].map((p, i) => (
              <div key={i} style={{ ...styles.tablaFila, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <span style={styles.tablaTexto}>{p.mes}</span>
                <span style={styles.tablaTexto}>{p.conductor}</span>
                <span style={{ ...styles.tablaTexto, fontWeight: '600', color: '#0D1B3E' }}>{p.monto}</span>
                <span style={{ ...styles.badge, backgroundColor: '#E1F5EE', color: '#085041' }}>
                  {p.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  container: { maxWidth: 1100, margin: '0 auto', padding: '40px 24px' },
  welcome: { marginBottom: 32 },
  welcomeTitle: { fontSize: 28, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 8px' },
  welcomeDesc: { fontSize: 15, color: '#666' },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 20px' },
  hijosGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  hijoCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 20px', backgroundColor: '#f8f9fa',
    borderRadius: 12, border: '1px solid #eee',
  },
  hijoAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#0D1B3E', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 'bold',
  },
  hijoInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  hijoNombre: { fontSize: 15, fontWeight: '600', color: '#0D1B3E' },
  hijoEscuela: { fontSize: 13, color: '#888' },
  btnQr: {
    backgroundColor: '#0D1B3E', color: '#fff',
    border: 'none', padding: '8px 16px',
    borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
  busCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px', backgroundColor: '#f8f9fa',
    borderRadius: 12, border: '1px solid #eee',
  },
  busInfo: { display: 'flex', alignItems: 'center', gap: 16 },
  busAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0D1B3E', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, fontWeight: 'bold',
  },
  busNombre: { fontSize: 16, fontWeight: '600', color: '#0D1B3E', margin: '0 0 4px' },
  busDetalle: { fontSize: 13, color: '#888', margin: '2px 0' },
  busRating: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  busRatingNum: { fontSize: 14, fontWeight: '600', color: '#0D1B3E' },
  busEstado: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  busContrato: { fontSize: 13, color: '#888', margin: 0 },
  badge: {
    padding: '6px 14px', borderRadius: 20,
    fontSize: 13, fontWeight: '500',
    backgroundColor: '#E1F5EE', color: '#085041',
    display: 'inline-block',
  },
  tabla: { display: 'flex', flexDirection: 'column' },
  tablaHeader: {
    display: 'grid',
    padding: '10px 16px', backgroundColor: '#f8f9fa',
    borderRadius: 8, fontSize: 12, fontWeight: '600',
    color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: 4,
  },
  tablaFila: {
    display: 'grid',
    padding: '14px 16px', alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
  },
  tablaTexto: { fontSize: 14, color: '#333' },
};
*/