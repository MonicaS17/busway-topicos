/*
import React from 'react';
import Navbar from '../components/Navbar';

export default function DashboardConductor({ usuario, onLogout }) {
  return (
    <div style={styles.page}>
      <Navbar usuario={usuario} onLogout={onLogout} />

      <div style={styles.container}>
        {/* Bienvenida */
        /*
        <div style={styles.welcome}>
          <h1 style={styles.welcomeTitle}>Panel del Conductor</h1>
          <p style={styles.welcomeDesc}>Bienvenido, {usuario.nombre}. Aquí puedes ver tu información y estudiantes.</p>
        </div>

        {/* Stats */
        /*
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>👨‍👧</span>
            <span style={styles.statNum}>12</span>
            <span style={styles.statLabel}>Estudiantes activos</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>💰</span>
            <span style={styles.statNum}>$600</span>
            <span style={styles.statLabel}>Ingreso mensual</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>⭐</span>
            <span style={styles.statNum}>4.8</span>
            <span style={styles.statLabel}>Calificación</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🚌</span>
            <span style={styles.statNum}>20</span>
            <span style={styles.statLabel}>Capacidad del bus</span>
          </div>
        </div>

        {/* Lista de estudiantes */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>👨‍👧 Lista de estudiantes</h2>
          <div style={styles.tabla}>
            <div style={{ ...styles.tablaHeader, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <span>Estudiante</span>
              <span>Escuela</span>
              <span>Padre</span>
              <span>Estado</span>
            </div>
            {[
              { nombre: 'Carlos Gómez', escuela: 'Colegio San Agustín', padre: 'María Gómez', estado: 'activo' },
              { nombre: 'Ana López', escuela: 'Colegio San Agustín', padre: 'Pedro López', estado: 'activo' },
              { nombre: 'Luis Martínez', escuela: 'Colegio La Salle', padre: 'Rosa Martínez', estado: 'activo' },
              { nombre: 'Sofía Torres', escuela: 'Colegio La Salle', padre: 'Juan Torres', estado: 'inactivo' },
            ].map((e, i) => (
              <div key={i} style={{ ...styles.tablaFila, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <span style={styles.tablaTexto}>{e.nombre}</span>
                <span style={styles.tablaTexto}>{e.escuela}</span>
                <span style={styles.tablaTexto}>{e.padre}</span>
                <span style={{ ...styles.badge, backgroundColor: e.estado === 'activo' ? '#E1F5EE' : '#FEE2E2', color: e.estado === 'activo' ? '#085041' : '#7A1F1F' }}>
                  {e.estado}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Historial de pagos */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Historial de pagos recibidos</h2>
          <div style={styles.tabla}>
            <div style={{ ...styles.tablaHeader, gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <span>Mes</span>
              <span>Estudiantes</span>
              <span>Monto recibido</span>
              <span>Estado</span>
            </div>
            {[
              { mes: 'Mayo 2026', estudiantes: 12, monto: '$600.00', estado: 'exitoso' },
              { mes: 'Abril 2026', estudiantes: 12, monto: '$600.00', estado: 'exitoso' },
              { mes: 'Marzo 2026', estudiantes: 11, monto: '$550.00', estado: 'exitoso' },
            ].map((p, i) => (
              <div key={i} style={{ ...styles.tablaFila, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <span style={styles.tablaTexto}>{p.mes}</span>
                <span style={styles.tablaTexto}>{p.estudiantes}</span>
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
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  statIcon: { fontSize: 32 },
  statNum: { fontSize: 32, fontWeight: 'bold', color: '#0D1B3E' },
  statLabel: { fontSize: 13, color: '#888', textAlign: 'center' },
  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 20px' },
  tabla: { display: 'flex', flexDirection: 'column', gap: 0 },
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
  badge: {
    padding: '4px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: '500',
    display: 'inline-block', textAlign: 'center',
  },
};
*/