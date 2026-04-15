import { useEffect, useState } from "react";
import {
  obtenerFamilias,
  eliminarFamilia as eliminarService
} from "../../services/familias.js";

export function useFamilias() {

  const [familias, setFamilias] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [error, setError] = useState("");

  async function cargar() {
    try {

      setLoadingLista(true);
      setError("");

      const data = await obtenerFamilias();

      if (data.content) {
        setFamilias(data.content);
      } else {
        setFamilias(data);
      }

    } catch (e) {

      setError("Error cargando familias");

    } finally {

      setLoadingLista(false);

    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarFamilia(id) {
    await eliminarService(id);
    await cargar();
  }

  return {
    familias,
    loadingLista,
    error,
    eliminarFamilia
  };
}