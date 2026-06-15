import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardConductor from './pages/DashboardConductor';
import DashboardPadre from './pages/DashboardPadre';

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [, setToken] = useState(null);

  const handleLogin = (usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    setUsuario(null);
    setToken(null);
  };

  const getDashboard = () => {
    if (!usuario) return <Navigate to="/login" />;
    if (usuario.tipo === 'administrador') return <DashboardAdmin usuario={usuario} onLogout={handleLogout} />;
    if (usuario.tipo === 'conductor') return <DashboardConductor usuario={usuario} onLogout={handleLogout} />;
    if (usuario.tipo === 'padre') return <DashboardPadre usuario={usuario} onLogout={handleLogout} />;
    return <Navigate to="/login" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={
          usuario ? <Navigate to="/dashboard" /> :
          <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={getDashboard()} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}