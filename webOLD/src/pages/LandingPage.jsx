/*
import React from 'react';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div style={styles.page}>
      <Navbar usuario={null} onLogout={() => {}} />

      {/* Hero */
      /*
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            <span style={styles.heroBus}>Bus</span>
            <span style={styles.heroWay}>Way</span>
          </h1>
          <p style={styles.heroSlogan}>tus hijos <span style={styles.heroAzul}>seguros</span> en cada ruta</p>
          <p style={styles.heroDesc}>
            Plataforma digital de transporte escolar para Panamá. Conectamos a padres y conductores
            para un servicio seguro, transparente y en tiempo real.
          </p>
          <div style={styles.heroBtns}>
            <a href="/login" style={styles.btnPrimario}>Iniciar sesión</a>
            <a href="#como-funciona" style={styles.btnSecundario}>¿Cómo funciona?</a>
          </div>
        </div>
        <div style={styles.heroIlustration}>
          <div style={styles.busIcon}>🚌</div>
        </div>
      </section>

      {/* Stats */
      /*
      <section style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statNum}>100%</span>
          <span style={styles.statLabel}>Seguro</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNum}>GPS</span>
          <span style={styles.statLabel}>Tiempo real</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNum}>QR</span>
          <span style={styles.statLabel}>Asistencia digital</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNum}>10</span>
          <span style={styles.statLabel}>Meses de servicio</span>
        </div>
      </section>

      {/* Cómo funciona */
      /*
      <section id="como-funciona" style={styles.section}>
        <h2 style={styles.sectionTitle}>¿Cómo funciona?</h2>
        <p style={styles.sectionDesc}>Tres pasos simples para un transporte escolar seguro</p>
        <div style={styles.cards}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>📱</div>
            <h3 style={styles.cardTitle}>Regístrate</h3>
            <p style={styles.cardDesc}>Descarga la app, crea tu cuenta como padre o conductor y verifica tu identidad con tu cédula.</p>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>🤝</div>
            <h3 style={styles.cardTitle}>Conéctate</h3>
            <p style={styles.cardDesc}>Los padres buscan conductores en el marketplace filtrado por escuela y zona. El conductor acepta la solicitud.</p>
          </div>
          <div style={styles.card}>
            <div style={styles.cardIcon}>🛡️</div>
            <h3 style={styles.cardTitle}>Monitorea</h3>
            <p style={styles.cardDesc}>Sigue la ruta en tiempo real, recibe notificaciones de abordaje y llegada, y gestiona pagos automáticos.</p>
          </div>
        </div>
      </section>

      {/* Para quién */
      /*
      <section style={{ ...styles.section, backgroundColor: '#f8f9fa' }}>
        <h2 style={styles.sectionTitle}>Para todos</h2>
        <div style={styles.roles}>
          <div style={styles.roleCard}>
            <div style={styles.roleIcon}>👨‍👧</div>
            <h3 style={styles.roleTitle}>Padres de familia</h3>
            <ul style={styles.roleList}>
              <li>Seguimiento GPS en tiempo real</li>
              <li>Notificaciones de asistencia</li>
              <li>Pagos automáticos mensuales</li>
              <li>QR único por estudiante</li>
              <li>Historial de viajes</li>
            </ul>
          </div>
          <div style={{ ...styles.roleCard, backgroundColor: '#0D1B3E' }}>
            <div style={styles.roleIcon}>🚌</div>
            <h3 style={{ ...styles.roleTitle, color: '#fff' }}>Conductores</h3>
            <ul style={{ ...styles.roleList, color: '#B5D4F4' }}>
              <li>Perfil verificado por la ATTT</li>
              <li>Gestión de rutas y paradas</li>
              <li>Control de asistencia con QR</li>
              <li>Cobros automáticos garantizados</li>
              <li>Marketplace de clientes</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */
      /*
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>¿Listo para empezar?</h2>
        <p style={styles.ctaDesc}>Descarga la app y registrate hoy</p>
        <div style={styles.ctaBtns}>
          <button style={styles.btnStore}>📱 Play Store</button>
          <button style={styles.btnStore}>🍎 App Store</button>
        </div>
      </section>

      {/* Footer */
      /*
      <footer style={styles.footer}>
        <div style={styles.footerLogo}>
          <span style={{ color: '#fff' }}>Bus</span>
          <span style={{ color: '#00AEEF' }}>Way</span>
        </div>
        <p style={styles.footerText}>© 2026 BusWay · Universidad Tecnológica de Panamá</p>
        <p style={styles.footerText}>Grupo 1GS141</p>
      </footer>
    </div>
  );
}

const styles = {
  page: { fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 },
  hero: {
    background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3A6E 100%)',
    padding: '80px 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '500px',
  },
  heroContent: { maxWidth: 600 },
  heroTitle: { fontSize: 72, fontWeight: 'bold', margin: '0 0 8px' },
  heroBus: { color: '#fff' },
  heroWay: { color: '#00AEEF' },
  heroSlogan: { color: '#B5D4F4', fontSize: 20, margin: '0 0 20px' },
  heroAzul: { color: '#00AEEF', fontWeight: 'bold' },
  heroDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 480 },
  heroBtns: { display: 'flex', gap: 16 },
  btnPrimario: {
    backgroundColor: '#FFD700', color: '#0D1B3E',
    padding: '14px 32px', borderRadius: 10,
    textDecoration: 'none', fontWeight: '700', fontSize: 15,
  },
  btnSecundario: {
    backgroundColor: 'transparent', color: '#fff',
    padding: '14px 32px', borderRadius: 10,
    textDecoration: 'none', fontWeight: '600', fontSize: 15,
    border: '1.5px solid rgba(255,255,255,0.4)',
  },
  heroIlustration: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  busIcon: { fontSize: 160 },
  stats: {
    backgroundColor: '#FFD700',
    padding: '32px 40px',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { textAlign: 'center' },
  statNum: { display: 'block', fontSize: 32, fontWeight: 'bold', color: '#0D1B3E' },
  statLabel: { fontSize: 14, color: '#333' },
  section: { padding: '80px 40px', textAlign: 'center' },
  sectionTitle: { fontSize: 36, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 12px' },
  sectionDesc: { fontSize: 16, color: '#666', margin: '0 0 48px' },
  cards: { display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' },
  card: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 32, maxWidth: 280, textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #eee',
  },
  cardIcon: { fontSize: 48, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 12px' },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 1.6 },
  roles: { display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' },
  roleCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 32, minWidth: 280, maxWidth: 340,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #eee', textAlign: 'left',
  },
  roleIcon: { fontSize: 48, marginBottom: 16 },
  roleTitle: { fontSize: 20, fontWeight: 'bold', color: '#0D1B3E', margin: '0 0 16px' },
  roleList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10, color: '#555', fontSize: 14 },
  cta: {
    background: 'linear-gradient(135deg, #0D1B3E 0%, #1A3A6E 100%)',
    padding: '80px 40px', textAlign: 'center',
  },
  ctaTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', margin: '0 0 12px' },
  ctaDesc: { fontSize: 16, color: '#B5D4F4', margin: '0 0 32px' },
  ctaBtns: { display: 'flex', gap: 16, justifyContent: 'center' },
  btnStore: {
    backgroundColor: '#fff', color: '#0D1B3E',
    padding: '14px 32px', borderRadius: 10,
    textDecoration: 'none', fontWeight: '700', fontSize: 15,
  },
  footer: {
    backgroundColor: '#060F1F', padding: '32px 40px',
    textAlign: 'center',
  },
  footerLogo: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  footerText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '4px 0' },
};
*/