/*
import React from 'react';
import Navbar from '../components/Navbar';

export default function DashboardAdmin({ usuario, onLogout }) {
  return (
    <div style={styles.page}>
      <Navbar usuario={usuario} onLogout={onLogout} />

      <div style={styles.container}>
        {/* Bienvenida */
        /*
        <div style={styles.welcome}>
          <h1 style={styles.welcomeTitle}>Panel de Administración</h1>
          <p style={styles.welcomeDesc}>Bienvenido, {usuario.nombre}. Aquí puedes gestionar toda la plataforma.</p>
        </div>

        {/* Stats */
        /*
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>👥</span>
            <span style={styles.statNum}>124</span>
            <span style={styles.statLabel}>Usuarios totales</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>👨‍👧</span>
            <span style={styles.statNum}>89</span>
            <span style={styles.statLabel}>Padres registrados</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🚌</span>
            <span style={styles.statNum}>35</span>
            <span style={styles.statLabel}>Conductores activos</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🏫</span>
            <span style={styles.statNum}>12</span>
            <span style={styles.statLabel}>Escuelas registradas</span>
          </div>
        </div>

        {/* Ingresos */
        /*
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>💰 Ingresos</h2>
            <div style={styles.sectionBtns}>
              <button style={styles.btnDescarga}>📄 PDF</button>
              <button style={styles.btnDescarga}>📊 Excel</button>
            </div>
          </div>
          <div style={styles.ingresosGrid}>
            <div style={styles.ingresoCard}>
              <span style={styles.ingresoLabel}>Ingresos del mes</span>
              <span style={styles.ingresoNum}>$534.11</span>
              <span style={styles.ingresoSub}>89 acuerdos activos × $5.99</span>
            </div>
            <div style={styles.ingresoCard}>
              <span style={styles.ingresoLabel}>Ingresos del año</span>
              <span style={styles.ingresoNum}>$3,204.66</span>
              <span style={styles.ingresoSub}>Acumulado 2026</span>
            </div>
          </div>
        </div>

        {/* Escuelas */
        /*
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🏫 Escuelas</h2>
            <button style={styles.btnPrimario}>+ Nueva escuela</button>
          </div>
          <div style={styles.tabla}>
            <div style={styles.tablaHeader}>
              <span>Nombre</span>
              <span>Zona</span>
              <span>Dirección</span>
              <span>Estado</span>
            </div>
            {[
              { nombre: 'Colegio San Agustín', zona: 'Norte', dir: 'Ave. Central, Panamá', activa: true },
              { nombre: 'Colegio La Salle', zona: 'Sur', dir: 'Calle 50, Bella Vista', activa: true },
              { nombre: 'Instituto Nacional', zona: 'Centro', dir: 'Casco Antiguo', activa: false },
            ].map((e, i) => (
              <div key={i} style={styles.tablaFila}>
                <span style={styles.tablaTexto}>{e.nombre}</span>
                <span style={styles.tablaTexto}>{e.zona}</span>
                <span style={styles.tablaTexto}>{e.dir}</span>
                <span style={{ ...styles.badge, backgroundColor: e.activa ? '#E1F5EE' : '#FEE2E2', color: e.activa ? '#085041' : '#7A1F1F' }}>
                  {e.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Período escolar */
        /*
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📅 Período escolar</h2>
          <div style={styles.periodoCard}>
            <div style={styles.periodoItem}>
              <label style={styles.periodoLabel}>Inicio del período</label>
              <input type="date" style={styles.periodoInput} defaultValue="2026-03-03" />
            </div>
            <div style={styles.periodoItem}>
              <label style={styles.periodoLabel}>Fin del período</label>
              <input type="date" style={styles.periodoInput} defaultValue="2026-12-05" />
            </div>
            <button style={styles.btnPrimario}>Guardar período</button>
          </div>
        </div>

        {/* Usuarios */
        /*
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>👥 Usuarios</h2>
            <button style={styles.btnPrimario}>+ Nuevo admin</button>
          </div>
          <div style={styles.tabla}>
            <div style={styles.tablaHeader}>
              <span>Nombre</span>
              <span>Correo</span>
              <span>Tipo</span>
              <span>Estado</span>
              <span>Acción</span>
            </div>
            {[
              { nombre: 'Juan Pérez', correo: 'juan@busway.app', tipo: 'conductor', estado: 'activo' },
              { nombre: 'María Gómez', correo: 'maria@busway.app', tipo: 'padre', estado: 'activo' },
              { nombre: 'Carlos López', correo: 'carlos@busway.app', tipo: 'conductor', estado: 'bloqueado' },
            ].map((u, i) => (
              <div key={i} style={styles.tablaFila}>
                <span style={styles.tablaTexto}>{u.nombre}</span>
                <span style={styles.tablaTexto}>{u.correo}</span>
                <span style={styles.tablaTexto}>{u.tipo}</span>
                <span style={{ ...styles.badge, backgroundColor: u.estado === 'activo' ? '#E1F5EE' : '#FEE2E2', color: u.estado === 'activo' ? '#085041' : '#7A1F1F' }}>
                  {u.estado}
                </span>
                <button style={{ ...styles.btnAccion, backgroundColor: u.estado === 'activo' ? '#FEE2E2' : '#E1F5EE', color: u.estado === 'activo' ? '#7A1F1F' : '#085041' }}>
                  {u.estado === 'activo' ? 'Bloquear' : 'Activar'}
                </button>
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
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0D1B3E', margin: 0 },
  sectionBtns: { display: 'flex', gap: 8 },
  btnDescarga: {
    backgroundColor: '#f0f0f0', color: '#333',
    border: 'none', padding: '8px 16px',
    borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
  btnPrimario: {
    backgroundColor: '#FFD700', color: '#0D1B3E',
    border: 'none', padding: '10px 20px',
    borderRadius: 8, cursor: 'pointer',
    fontWeight: '600', fontSize: 14,
  },
  ingresosGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  ingresoCard: {
    backgroundColor: '#f8f9fa', borderRadius: 12, padding: 24,
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  ingresoLabel: { fontSize: 13, color: '#888' },
  ingresoNum: { fontSize: 36, fontWeight: 'bold', color: '#0D1B3E' },
  ingresoSub: { fontSize: 12, color: '#aaa' },
  tabla: { display: 'flex', flexDirection: 'column', gap: 0 },
  tablaHeader: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    padding: '10px 16px', backgroundColor: '#f8f9fa',
    borderRadius: 8, fontSize: 12, fontWeight: '600',
    color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: 4,
  },
  tablaFila: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    padding: '14px 16px', alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
  },
  tablaTexto: { fontSize: 14, color: '#333' },
  badge: {
    padding: '4px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: '500',
    display: 'inline-block', textAlign: 'center',
  },
  btnAccion: {
    border: 'none', padding: '6px 12px',
    borderRadius: 8, cursor: 'pointer',
    fontSize: 12, fontWeight: '500',
  },
  periodoCard: {
    display: 'flex', gap: 20, alignItems: 'flex-end',
    backgroundColor: '#f8f9fa', borderRadius: 12, padding: 20,
  },
  periodoItem: { display: 'flex', flexDirection: 'column', gap: 6 },
  periodoLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  periodoInput: {
    padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #ddd', fontSize: 14,
  },
};
*/