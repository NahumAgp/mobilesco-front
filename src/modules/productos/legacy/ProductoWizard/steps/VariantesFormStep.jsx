// components/ProductoWizard/steps/VariantesFormStep.jsx
import { useRef, useState } from "react";

export default function VariantesFormStep({ data, onUpdate }) {
  const [editandoVariante, setEditandoVariante] = useState(null);
  const nextTempIdRef = useRef(1);
  const [formVariante, setFormVariante] = useState({
    talla: "",
    color: "",
    precio: "",
    stock: "",
    sku: ""
  });

  const agregarVariante = () => {
    const nuevasVariantes = [...data.variantes];
    if (editandoVariante !== null) {
      nuevasVariantes[editandoVariante] = formVariante;
    } else {
      nuevasVariantes.push({ ...formVariante, id: `tmp-${nextTempIdRef.current++}` });
    }
    onUpdate("variantes", nuevasVariantes);
    resetForm();
  };

  const editarVariante = (index) => {
    setEditandoVariante(index);
    setFormVariante(data.variantes[index]);
  };

  const eliminarVariante = (index) => {
    const nuevasVariantes = data.variantes.filter((_, i) => i !== index);
    onUpdate("variantes", nuevasVariantes);
  };

  const resetForm = () => {
    setFormVariante({ talla: "", color: "", precio: "", stock: "", sku: "" });
    setEditandoVariante(null);
  };

  return (
    <div>
      <h4 className="mb-4">Variantes del Producto</h4>
      
      {/* Formulario de Variantes */}
      <div className="card bg-light mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label>Talla</label>
              <input
                type="text"
                className="form-control"
                value={formVariante.talla}
                onChange={e => setFormVariante({...formVariante, talla: e.target.value})}
                placeholder="S, M, L, XL"
              />
            </div>
            <div className="col-md-3">
              <label>Color</label>
              <input
                type="text"
                className="form-control"
                value={formVariante.color}
                onChange={e => setFormVariante({...formVariante, color: e.target.value})}
                placeholder="Rojo, Azul, Negro"
              />
            </div>
            <div className="col-md-2">
              <label>Precio</label>
              <input
                type="number"
                className="form-control"
                value={formVariante.precio}
                onChange={e => setFormVariante({...formVariante, precio: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label>Stock</label>
              <input
                type="number"
                className="form-control"
                value={formVariante.stock}
                onChange={e => setFormVariante({...formVariante, stock: e.target.value})}
              />
            </div>
            <div className="col-md-2">
              <label>SKU</label>
              <input
                type="text"
                className="form-control"
                value={formVariante.sku}
                onChange={e => setFormVariante({...formVariante, sku: e.target.value})}
              />
            </div>
            <div className="col-12">
              <button className="btn btn-primary me-2" onClick={agregarVariante}>
                {editandoVariante !== null ? "Actualizar" : "Agregar"} Variante
              </button>
              {editandoVariante !== null && (
                <button className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Variantes */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Talla</th>
              <th>Color</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>SKU</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.variantes.map((variante, index) => (
              <tr key={index}>
                <td>{variante.talla}</td>
                <td>
                  <span className="badge" style={{backgroundColor: variante.color}}>
                    {variante.color}
                  </span>
                </td>
                <td>${variante.precio}</td>
                <td>{variante.stock}</td>
                <td>{variante.sku}</td>
                <td>
                  <button className="btn btn-sm btn-info me-1" onClick={() => editarVariante(index)}>
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => eliminarVariante(index)}>
                    <i className="bi bi-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
