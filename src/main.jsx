// src/main.jsx - VERSIÓN CON DEBUG
// ========================================
// BLOQUEAR WEBSOCKET MOLESTO DE VITE
// ========================================
if (typeof window !== 'undefined') {
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    // Capturar TODAS las conexiones WebSocket
    console.log('🔍 Intento de WebSocket a:', url);
    
    // Si intenta conectar a localhost:8081
    if (url && (url.includes('localhost:8081') || url.includes('127.0.0.1:8081'))) {
      console.warn('🚫 BLOQUEANDO WebSocket a:', url);
      
      // Mostrar stack trace para ver QUIÉN lo está llamando
      console.trace('Origen de la conexión:');
      
      // Devolver objeto dummy
      return {
        send: () => {},
        close: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
        readyState: 3,
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3
      };
    }
    return new OriginalWebSocket(url, protocols);
  };
  
  window.WebSocket.CONNECTING = 0;
  window.WebSocket.OPEN = 1;
  window.WebSocket.CLOSING = 2;
  window.WebSocket.CLOSED = 3;
}
// ========================================

// El resto de tu código normal...
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import "bootstrap/dist/js/bootstrap.bundle.min.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);