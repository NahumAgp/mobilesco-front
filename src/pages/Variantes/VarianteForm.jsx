// ============================================
// RUTA: src/pages/Variantes/VarianteForm.jsx
// ============================================
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { obtenerVariantePorId, crearVariante, actualizarVariante } from "../../services/variantes";
import { obtenerModelos } from "../../services/modelos.js";
import { obtenerCategorias } from "../../services/categorias.js";
import { obtenerColores } from "../../services/color.js";

export default function VarianteForm({ varianteId, returnPath = "/variantes" }) {
  const navigate = useNavigate();
  const esEdicion = Boolean(varianteId);

  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    activo: true,
    id_producto_base: "",
    id_nivel: "",
    id_color: ""
  });

  const [productosBase, setProductosBase] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [colores, setColores] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);

  // Cargar catálogos
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [modelos, categorias, coloresData] = await Promise.all([
          obtenerModelos(),
          obtenerCategorias(),
          obtenerColores()
        ]);

        setProductosBase(modelos.content || modelos || []);
        setNiveles(categorias.content || categorias || []);
        setColores(coloresData.content || coloresData || []);
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setLoadingCatalogo(false);
      }
    };

    cargarCatalogos();
  }, []);

  // Cargar datos si es edición
  useEffect(() => {
    const cargar = async () => {
      if (!varianteId) return;

      try {
        const data = await obtenerVariantePorId(varianteId);
        setFormData({
          sku: data.sku || "",
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          activo: data.activo ?? true,
          id_producto_base: data.id_producto_base || data.productoBaseId || "",
          id_nivel: data.id_nivel || data.nivelId || "",
          id_color: data.id_color || data.colorId || ""
        });
      } catch (error) {
        console.error("Error cargando variante:", error);
      }
    };

    cargar();
  }, [varianteId]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validar SKU
    if (!formData.sku || formData.sku.trim() === "") {
      alert("El SKU es obligatorio");
      return;
    }

    // Validar Producto Base
    if (!formData.id_producto_base) {
      alert("El Producto Base es obligatorio");
      return;
    }

    try {
      const payload = {
        sku: formData.sku?.trim().toUpperCase() || "",
        nombre: formData.nombre?.trim() || "",
        descripcion: formData.descripcion?.trim() || "",
        activo: Boolean(formData.activo),
        id_producto_base: Number(formData.id_producto_base),
        id_nivel: formData.id_nivel ? Number(formData.id_nivel) : null,
        id_color: formData.id_color ? Number(formData.id_color) : null
      };

      console.log("Enviando payload:", payload);

      if (esEdicion) {
        await actualizarVariante(varianteId, payload);
      } else {
        await crearVariante(payload);
      }

      navigate(returnPath);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert(error.message || "Error al guardar variante");
    }
  }

  if (loadingCatalogo) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-2">Cargando catálogos...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        {/* SKU */}
        <div className="col-md-4">
          <label className="form-label">
            SKU <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            name="sku"
            className="form-control"
            value={formData.sku}
            onChange={handleChange}
            required
            placeholder="Ej: SF01, ISO-N, TDS-3"
          />
          <small className="text-muted">Código único del producto</small>
        </div>

        {/* Nombre */}
        <div className="col-md-8">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            name="nombre"
            className="form-control"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Silla Preescolar Formaica"
          />
          <small className="text-muted">Descripción comercial de la variante</small>
        </div>

        {/* Descripción */}
        <div className="col-md-12">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows="2"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción adicional de la variante"
          />
        </div>

        {/* Producto Base */}
        <div className="col-md-12">
          <label className="form-label">
            Producto Base <span className="text-danger">*</span>
          </label>
          <select
            name="id_producto_base"
            className="form-select"
            value={formData.id_producto_base}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un producto base...</option>
            {productosBase.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Modelo base al que pertenece esta variante</small>
        </div>

        {/* Nivel */}
        <div className="col-md-6">
          <label className="form-label">Nivel</label>
          <select
            name="id_nivel"
            className="form-select"
            value={formData.id_nivel}
            onChange={handleChange}
          >
            <option value="">Sin nivel...</option>
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>
                {nivel.codigo ? `[${nivel.codigo}] ` : ""}{nivel.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Ej: Preescolar, Primaria, Secundaria</small>
        </div>

        {/* Color */}
        <div className="col-md-6">
          <label className="form-label">Color</label>
          <select
            name="id_color"
            className="form-select"
            value={formData.id_color}
            onChange={handleChange}
          >
            <option value="">Sin color...</option>
            {colores.map((color) => (
              <option key={color.id} value={color.id}>
                {color.nombre}
              </option>
            ))}
          </select>
          <small className="text-muted">Color del producto si aplica</small>
        </div>

        {/* Activo */}
        <div className="col-md-12">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              name="activo"
              id="activoSwitch"
              checked={formData.activo}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="activoSwitch">
              Activo
            </label>
          </div>
          <small className="text-muted">Solo los productos activos se muestran en el catálogo</small>
        </div>

        {/* Botones */}
        <div className="col-md-12">
          <hr />
          <button type="submit" className="btn btn-primary me-2">
            <i className="bi bi-check-lg me-1"></i>
            Guardar
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate(returnPath)}
          >
            <i className="bi bi-x-lg me-1"></i>
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}
