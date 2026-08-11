// src/layout/AppLayout.jsx
import { useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sistema/Sidebar';
import { syncCurrentUser } from '../modules/auth/services/authService';
import './AppLayout.css';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);
  const outletContext = useMemo(() => ({ authRevision }), [authRevision]);

  const toggleSidebar = () => {
    setSidebarOpen((current) => !current);
  };

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const handleUserUpdated = () => setAuthRevision((current) => current + 1);
    window.addEventListener("userUpdated", handleUserUpdated);
    return () => window.removeEventListener("userUpdated", handleUserUpdated);
  }, []);

  useEffect(() => {
    const synchronize = () => {
      syncCurrentUser().catch((error) => {
        console.warn("No se pudo sincronizar la sesion activa:", error);
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        synchronize();
      }
    };

    synchronize();
    window.addEventListener("focus", synchronize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const intervalId = window.setInterval(synchronize, 60_000);

    return () => {
      window.removeEventListener("focus", synchronize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className={`app-layout ${sidebarOpen ? "" : "sidebar-is-compact"}`}>
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        closeSidebar={() => setSidebarOpen(false)}
      />
      <button
        type="button"
        className="mobile-menu-button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Cerrar menú principal" : "Abrir menú principal"}
        aria-controls="app-sidebar"
        aria-expanded={sidebarOpen}
      >
        <i className={`bi ${sidebarOpen ? "bi-x-lg" : "bi-list"}`} aria-hidden="true"></i>
      </button>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú principal"
          tabIndex={-1}
        />
      )}
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet context={outletContext} />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
