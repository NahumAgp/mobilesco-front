import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { familiaGateway } from "../services/familiaGateway.js";
import { lineaProductoGateway } from "../../lineas-producto/services/lineaProductoGateway.js";
import { obtenerModelos } from "../../modelos/services/modelos";
import Toast from "../../../components/ui/Toast.jsx";
import SearchableSelect from "../../../components/ui/SearchableSelect.jsx";
import { useGeneratedCatalogCode } from "../../../hooks/useGeneratedCatalogCode.js";

export default function FamiliaForm({ familiaId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const esEdicion = Boolean(familiaId);
  const lineaInicialId = !esEdicion ? searchParams.get("lineaId") || "" : "";
  const [erroresBackend, setErroresBackend] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    lineaId: lineaInicialId,
    activo: true
  });
  const [lineas, setLineas] = useState([]);
  const [modelosFamilia, setModelosFamilia] = useState([]);
  const [cargandoModelos, setCargandoModelos] = useState(false);
  const [errorModelos, setErrorModelos] = useState("");
  const obtenerCodigoSugeridoPorLinea = useCallback(
    (nombre) => familiaGateway.obtenerCodigoSugerido(nombre, formData.lineaId),
    [formData.lineaId]
  );
  const { codigoGenerado, generandoCodigo } = useGeneratedCatalogCode(
    formData.nombre,
    !esEdicion && Boolean(formData.lineaId),
    obtenerCodigoSugeridoPorLinea
  );

  const obtenerErrorCampo = (campo) =>
    erroresBackend[campo] ||
    erroresBackend[`${campo}Id`] ||
    erroresBackend[`${campo}_id`] ||
    "";

  const inputClass = (campo) =>
    `form-control ${obtenerErrorCampo(campo) ? "is-invalid" : ""}`;

  useEffect(() => {
    const cargarLineas = async () => {
      try {
        const data = await lineaProductoGateway.obtenerLineasProducto();

        if (data?.content) {
          setLineas(data.content);
        } else if (Array.isArray(data)) {
          setLineas(data);
        } else {
          setLineas([]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    cargarLineas();
  }, []);

  useEffect(() => {
    const cargar = async () => {
      if (!familiaId) return;

      try {
        const data = await familiaGateway.obtenerFamiliaPorId(familiaId);
        setFormData({
          codigo: data.codigo || "",
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          lineaId: data.lineaId || data.linea?.id || "",
          activo: data.activo ?? true
        });
      } catch (error) {
        console.error(error);
      }
    };

    cargar();
  }, [familiaId]);

  useEffect(() => {
    const cargarModelos = async () => {
      if (!familiaId) {
        setModelosFamilia([]);
        return;
      }

      try {
        setCargandoModelos(true);
        setErrorModelos("");

        const data = await obtenerModelos();
        const lista = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : [];

        const filtrados = lista.filter((modelo) => {
          const familiaModeloId = modelo.familiaId ?? modelo.familia?.id ?? modelo.familia_id ?? "";
          return String(familiaModeloId) === String(familiaId);
        });

        setModelosFamilia(filtrados);
      } catch (error) {
        console.error(error);
        setModelosFamilia([]);
        setErrorModelos("No se pudieron cargar los modelos de esta familia.");
      } finally {
        setCargandoModelos(false);
      }
    };

    cargarModelos();
  }, [familiaId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    setErroresBackend((prev) => {
      if (!prev || Object.keys(prev).length === 0) return prev;

      const copia = { ...prev };

      if (name === "lineaId") {
        delete copia.lineaId;
        delete copia.linea_id;
      } else {
        delete copia[name];
        delete copia[`${name}Id`];
        delete copia[`${name}_id`];
      }

      delete copia.general;
      delete copia.message;

      return copia;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const erroresValidacion = {};
      const codigo = formData.codigo?.toString().trim() || "";
      const nombre = formData.nombre?.trim() || "";
      const descripcion = formData.descripcion?.trim() || "";
      const lineaIdNormalizado = formData.lineaId ? Number(formData.lineaId) : null;

      if (esEdicion && !codigo) {
        erroresValidacion.codigo = "El codigo es obligatorio";
      }

      if (!nombre) {
        erroresValidacion.nombre = "El nombre es obligatorio";
      }

      if (!lineaIdNormalizado) {
        erroresValidacion.lineaId = "La linea es obligatoria";
      }

      if (Object.keys(erroresValidacion).length > 0) {
        setErroresBackend(erroresValidacion);
        return;
      }

      const payload = {
        nombre,
        descripcion,
        lineaId: lineaIdNormalizado,
        linea_id: lineaIdNormalizado,
        activo: Boolean(formData.activo)
      };
      if (esEdicion) payload.codigo = codigo;

      setErroresBackend({});

      if (esEdicion) {
        await familiaGateway.actualizarFamilia(familiaId, payload);
      } else {
        await familiaGateway.crearFamilia(payload);
      }

      setToastType("success");
      setToastMessage(esEdicion ? "Familia actualizada con exito" : "Familia registrada con exito");
      setTimeout(() => navigate("/familias"), 1500);
    } catch (error) {
      if (error?.errors) {
        setErroresBackend(error.errors);
      } else if (error?.message) {
        const mensaje = error.message;
        const erroresNormalizados = {};

        if (/c[oó]digo/i.test(mensaje)) {
          erroresNormalizados.codigo = mensaje;
        }

        if (/nombre/i.test(mensaje)) {
          erroresNormalizados.nombre = mensaje;
        }

        if (/descripci[oó]n/i.test(mensaje)) {
          erroresNormalizados.descripcion = mensaje;
        }

        if (/linea|l[ií]nea/i.test(mensaje)) {
          erroresNormalizados.lineaId = mensaje;
        }

        setErroresBackend(
          Object.keys(erroresNormalizados).length > 0
            ? erroresNormalizados
            : {}
        );

        if (Object.keys(erroresNormalizados).length === 0) {
          setToastType("danger");
          setToastMessage(mensaje);
        }
      } else {
        console.error(error);
        setToastType("danger");
        setToastMessage("Error al guardar la familia");
      }
    }
  }

  async function handleEliminar() {
    const confirmacion = window.confirm("Seguro que deseas eliminar esta familia?");
    if (!confirmacion) return;

    try {
      await familiaGateway.eliminarFamilia(familiaId);
      setToastType("success");
      setToastMessage("Familia eliminada correctamente");
      setTimeout(() => navigate("/familias"), 1500);
    } catch (error) {
      const mensaje = error?.message || "No se pudo eliminar la familia";
      setToastType("danger");
      setToastMessage(mensaje);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage("")} />

      <div className="row g-3">
        <div className="col-md-5">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            className={inputClass("nombre")}
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Anaqueles, Bancas, Mesas..."
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("nombre")}
          </div>
        </div>

        <div className="col-md-2">
          <label className="form-label">Codigo generado</label>
          <input
            type="text"
            name="codigo"
            className={`${inputClass("codigo")} ${!esEdicion ? "bg-light text-secondary" : ""}`}
            value={esEdicion ? formData.codigo : codigoGenerado}
            onChange={handleChange}
            readOnly={!esEdicion}
            maxLength="3"
            placeholder={!formData.lineaId ? "Selecciona linea" : generandoCodigo ? "Generando..." : "Automatico"}
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("codigo")}
          </div>
        </div>

        <div className="col-md-5">
          <SearchableSelect
            label="Linea"
            value={formData.lineaId}
            options={lineas}
            onChange={(value) => handleChange({ target: { name: "lineaId", value } })}
            placeholder="Selecciona una línea..."
            searchPlaceholder="Escribe código o nombre de la línea..."
            error={obtenerErrorCampo("lineaId")}
            getOptionValue={(linea) => linea.id ?? linea.lineaId}
            getOptionLabel={(linea) => `${linea.codigo ? `${linea.codigo} - ` : ""}${linea.nombre || "-"}`}
            getOptionSearchText={(linea) =>
              [linea.codigo, linea.nombre, linea.descripcion].filter(Boolean).join(" ").toLowerCase()
            }
            renderOptionLabel={(linea) => `${linea.codigo ? `[${linea.codigo}] ` : ""}${linea.nombre || "-"}`}
          />
        </div>

        <div className="col-md-12">
          <label className="form-label">Descripcion</label>
          <textarea
            name="descripcion"
            className={inputClass("descripcion")}
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Ej: Familia de anaqueles para exhibición y almacenamiento"
            rows={3}
          />
          <div className="invalid-feedback">
            {obtenerErrorCampo("descripcion")}
          </div>
        </div>

        <div className="col-md-12">
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
            />
            <label className="form-check-label">Activo</label>
          </div>
        </div>

        <div className="col-md-12 d-flex gap-2">
          {esEdicion && (
            <button type="button" className="btn btn-outline-danger" onClick={handleEliminar}>
              Eliminar
            </button>
          )}

          <button type="submit" className="btn btn-primary">
            Guardar
          </button>
        </div>
      </div>

      {familiaId && (
        <div className="card mt-4">
          <div className="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Modelos de esta familia</h5>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              {modelosFamilia.length} modelos
            </span>
          </div>

          <div className="card-body">
            {cargandoModelos ? (
              <div className="text-muted">Cargando modelos...</div>
            ) : errorModelos ? (
              <div className="alert alert-warning mb-0">{errorModelos}</div>
            ) : modelosFamilia.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelosFamilia.map((modelo) => (
                      <tr key={modelo.id}>
                        <td>{modelo.id}</td>
                        <td>{modelo.codigo || "-"}</td>
                        <td>{modelo.nombre || "-"}</td>
                        <td>
                          <span
                            className={
                              modelo.activo
                                ? "badge bg-success-subtle text-success border border-success-subtle"
                                : "badge bg-secondary-subtle text-secondary border border-secondary-subtle"
                            }
                          >
                            {modelo.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted">
                Esta familia todavía no tiene modelos asociados.
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
