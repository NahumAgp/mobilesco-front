function UnidadMedida() {

     const unidades = [
    {
      id: 1,
      nombre: "Metro",
      abrev: "m",
      tipo: "Longitud",
      estado: "Activo",
    },
    {
      id: 2,
      nombre: "Centímetro",
      abrev: "cm",
      tipo: "Longitud",
      estado: "Activo",
    },
    {
      id: 3,
      nombre: "Metro cuadrado",
      abrev: "m²",
      tipo: "Área",
      estado: "Activo",
    },
    {
      id: 4,
      nombre: "Litro",
      abrev: "L",
      tipo: "Volumen",
      estado: "Activo",
    },
    {
      id: 5,
      nombre: "Mililitro",
      abrev: "ml",
      tipo: "Volumen",
      estado: "Activo",
    },
    {
      id: 6,
      nombre: "Kilogramo",
      abrev: "kg",
      tipo: "Peso",
      estado: "Activo",
    },
    {
      id: 7,
      nombre: "Pieza",
      abrev: "pz",
      tipo: "Unidad",
      estado: "Activo",
    },
    {
      id: 8,
      nombre: "Caja",
      abrev: "cja",
      tipo: "Unidad",
      estado: "Inactivo",
    },
  ];

    return (<div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Unidades de Medida</h2>
          <p className="text-muted mb-0">
            Catálogo base para compras, consumo y conversión.
          </p>
        </div>

        <button className="btn btn-success">
          + Nueva Unidad
        </button>
      </div>

      {/* Filtros fake */}
      <div className="card mb-4">
        <div className="card-body d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o abreviatura..."
          />
          <select className="form-select w-auto">
            <option>Todos los tipos</option>
            <option>Longitud</option>
            <option>Área</option>
            <option>Volumen</option>
            <option>Peso</option>
            <option>Unidad</option>
          </select>
          <select className="form-select w-auto">
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>NOMBRE</th>
                <th>ABREVIATURA</th>
                <th>TIPO</th>
                <th>ESTADO</th>
                <th className="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((u) => (
                <tr key={u.id}>
                  <td className="text-muted">{u.id}</td>
                  <td className="fw-semibold">{u.nombre}</td>
                  <td>
                    <span className="badge bg-light text-dark">
                      {u.abrev}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-primary-subtle text-primary">
                      {u.tipo}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        u.estado === "Activo"
                          ? "badge bg-success-subtle text-success"
                          : "badge bg-secondary-subtle text-secondary"
                      }
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1">
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      ⋯
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>  );
}

export default UnidadMedida;