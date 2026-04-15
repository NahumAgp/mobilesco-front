import React, { useState, useEffect } from "react";
import { obtenerEmpleados } from "../../services/empleados";

export default function EmpleadoModal({ show, onClose, onSelect }) {

  const [empleados, setEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {

    if (show) {
      cargarEmpleados();
    }

  }, [show]);

  const cargarEmpleados = async () => {

    try {

      const data = await obtenerEmpleados();

      setEmpleados(data.filter(e => e.activo));

    } catch (error) {

      console.error("Error al cargar empleados:", error);

    }

  };

  const empleadosFiltrados = empleados.filter((e) => {

    const t = busqueda.toLowerCase();

    return (
      e.nombre.toLowerCase().includes(t) ||
      e.apellidoPaterno.toLowerCase().includes(t) ||
      e.apellidoMaterno.toLowerCase().includes(t)
    );

  });

  if (!show) return null;

  return (

    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>

      <div className="modal-dialog modal-lg">

        <div className="modal-content">

          <div className="modal-header">

            <h5 className="modal-title">Seleccionar empleado</h5>

            <button className="btn-close" onClick={onClose}></button>

          </div>

          <div className="modal-body">

            <input
              className="form-control mb-3"
              placeholder="Buscar empleado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <table className="table table-hover">

              <thead>

                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {empleadosFiltrados.map((e) => (

                  <tr key={e.id}>

                    <td>
                      {e.nombre} {e.apellidoPaterno} {e.apellidoMaterno}
                    </td>

                    <td>{e.telefono}</td>

                    <td>

                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {

                          onSelect(e);
                          onClose();

                        }}
                      >
                        Seleccionar
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>

  );

}