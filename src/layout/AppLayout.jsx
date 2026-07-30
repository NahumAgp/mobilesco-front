// src/layout/AppLayout.jsx
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sistema/Sidebar';
import './AppLayout.css';

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
