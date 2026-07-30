import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { useGeneratedCatalogCode } from "../../../hooks/useGeneratedCatalogCode.js";
import { obtenerFamiliasActivas } from "../../familias/services/familias.js";
import { actualizarModelo, obtenerModelos } from "../../modelos/services/modelos.js";
import {
  actualizarSubfamilia,
  crearSubfamilia,
  eliminarSubfamilia,
  obtenerCodigoSubfamiliaSugerido,
  obtenerSubfamilias
} from "../services/subfamilias.js";

const getLista = (respuesta) => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.content)) return respuesta.content;
  return [];
};

const getFamiliaLabel = (familia = {}) => {
  const ruta = [familia.lineaNombre || familia.linea?.nombre, familia.nombre].filter(Boolean).join(" / ");
  return `${familia.codigo ? `[${familia.codigo}] ` : ""}${ruta || "-"}`;
};

export default function SubfamiliaForm({ subfamiliaId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const esEdicion = Boolean(subfamiliaId);
  const familiaInicialId = !esEdicion ? searchParams.get("familiaId") || "" : "";
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [erroresBackend, setErroresBackend] = useState({});
  const [familias, setFamilias] = useState([]);
  const [modelosSubfamilia, setModelosSubfamilia] = useState([]);
  const [modelosFamiliaSinSubfamilia, setModelosFamiliaSinSubfamilia] = useState([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [modeloAsignandoId, setModeloAsignandoId] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    familiaId: familiaInicialId,
    activo: true
  });

  const obtenerCodigoSugerido = useCallback(
    (nombre) => obtenerCodigoSubfamiliaSugerido(nombre, formData.familiaId),
    [formData.familiaId]
  );
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    formData.nombre,
    !esEdicion && Boolean(formData.familiaId),
    obtenerCodigoSugerido
  );

  const obtenerErrorCampo = (campo) =>
    erroresBackend[campo] || erroresBackend[`${campo}Id`] || erroresBackend[`${campo}_id`] || "";

  useEffect(() => {
    obtenerFamiliasActivas()
      .then((respuesta) => setFamilias(getLista(respuesta)))
      .catch(() => setFamilias([]));
  }, []);

  useEffect(() => {
    if (!subfamiliaId) return;
    obtenerSubfamilias()
      .then((respuesta) => {
        const encontrada = getLista(respuesta).find((item) => String(item.id) === String(subfamiliaId));
        if (!encontrada) return;
        setFormData({
          codigo: encontrada.codigo || "",
          nombre: encontrada.nombre || "",
          descripcion: encontrada.descripcion || "",
          familiaId: encontrada.familiaId || encontrada.familia?.id || "",
          activo: encontrada.activo ?? true
        });
      })
      .catch(() => {});
  }, [subfamiliaId]);

  const cargarModelosRelacionados = useCallback(async () => {
    if (!subfamiliaId || !formData.familiaId) {
      setModelosSubfamilia([]);
      setModelosFamiliaSinSubfamilia([]);
      return;
    }

    try {
      setCargandoModelos(true);
      const lista = getLista(await obtenerModelos());
      setModelosSubfamilia(
        lista.filter((modelo) => String(modelo.subfamiliaId || modelo.subfamilia?.id || "") === String(subfamiliaId))
      );
      setModelosFamiliaSinSubfamilia(
        lista.filter((modelo) => {
          const familiaModeloId = modelo.familiaId || modelo.familia?.id || modelo.familia_id || "";
          const subfamiliaModeloId = modelo.subfamiliaId || modelo.subfamilia?.id || "";
          return String(familiaModeloId) === String(formData.familiaId) && !subfamiliaModeloId;
        })
      );
    } catch {
      setModelosSubfamilia([]);
      setModelosFamiliaSinSubfamilia([]);
    } finally {
      setCargandoModelos(false);
    }
  }, [formData.familiaId, subfamiliaId]);

  useEffect(() => {
    cargarModelosRelacionados();
  }, [cargarModelosRelacionados]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    setErroresBackend((prev) => {
      const copia = { ...prev };
      delete copia[name];
      delete copia[`${name}Id`];
      delete copia[`${name}_id`];
      return copia;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nombre = formData.nombre?.trim() || "";
    const familiaId = formData.familiaId ? Number(formData.familiaId) : null;
    const errores = {};

    if (!nombre) errores.nombre = "El nombre es obligatorio";
    if (!familiaId) errores.familiaId = "La familia es obligatoria";
    if (esEdicion && !formData.codigo?.trim()) errores.codigo = "El codigo es obligatorio";
    if (Object.keys(errores).length) {
      setErroresBackend(errores);
      return;
    }

    const payload = {
      nombre,
      descripcion: formData.descripcion?.trim() || "",
      familia_id: familiaId,
      activo: Boolean(formData.activo)
    };
    if (esEdicion) payload.codigo = formData.codigo?.trim() || "";

    try {
      setErroresBackend({});
      if (esEdicion) {
        await actualizarSubfamilia(subfamiliaId, payload);
      } else {
        await crearSubfamilia(payload);
      }
      setToastType("success");
      setToastMessage(esEdicion ? "Subfamilia actualizada con exito" : "Subfamilia registrada con exito");
      setTimeout(() => navigate("/subfamilias"), 1200);
    } catch (error) {
      if (error?.errors) {
        setErroresBackend(error.errors);
      } else {
        setToastType("danger");
        setToastMessage(error.message || "No se pudo guardar la subfamilia");
      }
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm("Seguro que deseas eliminar esta subfamilia?")) return;
    try {
      await eliminarSubfamilia(subfamiliaId);
      setToastType("success");
      setToastMessage("Subfamilia eliminada correctamente");
      setTimeout(() => navigate("/subfamilias"), 1200);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo eliminar la subfamilia");
    }
  };

  const asignarModelo = async (modelo) => {
    try {
      setModeloAsignandoId(String(modelo.id));
      await actualizarModelo(modelo.id, {
        subfamilia_id: Number(subfamiliaId)
      });
      await cargarModelosRelacionados();
      setToastType("success");
      setToastMessage(`Modelo ${modelo.nombre || modelo.codigo || modelo.id} asignado a la subfamilia.`);
    } catch (error) {
      setToastType("danger");
      setToastMessage(error.message || "No se pudo asignar el modelo a la subfamilia");
    } finally {
      setModeloAsignandoId("");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="row g-3">
        <div className="col-md-5">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            className={`form-control ${obtenerErrorCampo("nombre") ? "is-invalid" : ""}`}
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Mesabanco, Sillas con paleta..."
          />
          <div className="invalid-feedback">{obtenerErrorCampo("nombre")}</div>
        </div>

        <div className="col-md-2">
          <label className="form-label">Codigo generado</label>
          <input
            type="text"
            name="codigo"
            className={`form-control ${obtenerErrorCampo("codigo") ? "is-invalid" : ""} ${!esEdicion ? "bg-light text-secondary" : ""}`}
            value={esEdicion ? formData.codigo : codigoGenerado}
            onChange={handleChange}
            readOnly={!esEdicion}
            maxLength="10"
            placeholder={!formData.familiaId ? "Selecciona familia" : generandoCodigo ? "Generando..." : "Automatico"}
          />
          <div className="invalid-feedback">{obtenerErrorCampo("codigo")}</div>
        </div>

        <div className="col-md-5">
          <SearchableSelect
            label="Familia"
            value={formData.familiaId}
            options={familias}
            onChange={(value) => handleChange({ target: { name: "familiaId", value } })}
            placeholder="Selecciona una familia..."
            searchPlaceholder="Busca por linea, codigo o familia..."
            error={obtenerErrorCampo("familiaId")}
            getOptionValue={(familia) => familia.id ?? familia.familiaId}
            getOptionLabel={getFamiliaLabel}
            getOptionSearchText={(familia) =>
              [familia.codigo, familia.lineaNombre, familia.linea?.nombre, familia.nombre, familia.descripcion].filter(Boolean).join(" ").toLowerCase()
            }
          />
        </div>

        <div className="col-md-12">
          <label className="form-label">Descripcion</label>
          <textarea
            name="descripcion"
            className={`form-control ${obtenerErrorCampo("descripcion") ? "is-invalid" : ""}`}
            value={formData.descripcion}
            onChange={handleChange}
            rows={3}
            placeholder="Descripcion opcional"
          />
          <div className="invalid-feedback">{obtenerErrorCampo("descripcion")}</div>
        </div>

        <div className="col-md-12">
          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" name="activo" checked={formData.activo} onChange={handleChange} />
            <label className="form-check-label">Activo</label>
          </div>
        </div>

        <div className="col-md-12 d-flex gap-2">
          {esEdicion && (
            <button type="button" className="btn btn-outline-danger" onClick={handleEliminar}>
              Eliminar
            </button>
          )}
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </div>

      {subfamiliaId && (
        <div className="card mt-4">
          <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Modelos de esta subfamilia</h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {modelosSubfamilia.length} modelos
            </span>
          </div>
          <div className="card-body">
            {modelosSubfamilia.length ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>ID</th><th>Codigo</th><th>Nombre</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {modelosSubfamilia.map((modelo) => (
                      <tr key={modelo.id}>
                        <td>{modelo.id}</td>
                        <td>{modelo.codigo || "-"}</td>
                        <td>{modelo.nombre || "-"}</td>
                        <td>{modelo.activo ? "Activo" : "Inactivo"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">Esta subfamilia todavía no tiene modelos asociados.</div>
            )}
          </div>
        </div>
      )}

      {subfamiliaId && (
        <div className="card mt-4">
          <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Modelos de la familia sin subfamilia</h5>
            <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle">
              {modelosFamiliaSinSubfamilia.length} pendientes
            </span>
          </div>
          <div className="card-body">
            {cargandoModelos ? (
              <div className="text-muted">Cargando modelos...</div>
            ) : modelosFamiliaSinSubfamilia.length ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>ID</th><th>Codigo</th><th>Nombre</th><th className="text-end">Accion</th></tr>
                  </thead>
                  <tbody>
                    {modelosFamiliaSinSubfamilia.map((modelo) => (
                      <tr key={modelo.id}>
                        <td>{modelo.id}</td>
                        <td>{modelo.codigo || "-"}</td>
                        <td>{modelo.nombre || "-"}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => asignarModelo(modelo)}
                            disabled={modeloAsignandoId === String(modelo.id)}
                          >
                            {modeloAsignandoId === String(modelo.id) ? "Asignando..." : "Asignar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">
                No hay modelos pendientes de asignar en la familia seleccionada.
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
