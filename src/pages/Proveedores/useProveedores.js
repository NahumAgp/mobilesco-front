// src/pages/Proveedores/useProveedores.js
import { useEffect, useState } from "react";
import {
  obtenerProveedores,
  eliminarProveedor as eliminarService
} from "../../services/proveedores.js";


export function useProveedores() {

  const [proveedores, setProveedores] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setLoadingLista(true);
      setError("");

      const data = await obtenerProveedores();

      // 🔥 IMPORTANTE
      // Si backend devuelve paginado
      if (data.content) {
        setProveedores(data.content);
      } else {
        setProveedores(data);
      }

    } catch (e) {
      setError("Error cargando proveedores");
    } finally {
      setLoadingLista(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarProveedor(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    proveedores,
    loadingLista,
    error,
    eliminarProveedor
  };
}
