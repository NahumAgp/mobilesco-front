export default function Productos() {
 const productos = [
    {
      codigo: "PIZ-POR-120",
      nombre: "Pizarrón Porcelanizado Premium",
      categoria: "Secundaria-Profesional",
      tipo: "Personalizable",
      material: "PB",
      precio: "Se calcula",
      estado: "Activo",
    },
    {
      codigo: "MES-BIN-STD",
      nombre: "Mesa Binaria Estándar",
      categoria: "Primaria",
      tipo: "Estándar",
      material: "Tubular / MDP",
      precio: "$1,250.00",
      estado: "Activo",
    },
    {
      codigo: "SIL-ERG-JR",
      nombre: "Silla Ergonómica Junior",
      categoria: "Preescolar",
      tipo: "Estándar",
      material: "Polipropileno",
      precio: "$850.00",
      estado: "Activo",
    },
    {
      codigo: "EST-LIB-PER",
      nombre: "Estantería para Libros",
      categoria: "Profesional",
      tipo: "Personalizable",
      material: "Melamina 16mm",
      precio: "Se calcula",
      estado: "Activo",
    },
    {
      codigo: "ESCR-DOC-PRO",
      nombre: "Escritorio Docente Pro",
      categoria: "Profesional",
      tipo: "Estándar",
      material: "Acero / Madera",
      precio: "$4,800.00",
      estado: "Inactivo",
    },
  ];

  return (
    <div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h2 className="fw-bold mb-1">Productos</h2>
          <p className="text-muted mb-0">
            Catálogo para cotización y fabricación.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">Importar</button>
          <button className="btn btn-outline-secondary">Exportar</button>
          <button className="btn btn-success">+ Nuevo Producto</button>
        </div>
      </div>

      {/* Filtros fake */}
      <div className="card mb-4">
        <div className="card-body d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, código, material..."
          />
          <button className="btn btn-outline-secondary">Categoría</button>
          <select className="form-select w-auto">
            <option>Activos</option>
            <option>Inactivos</option>
          </select>
          <div className="form-check form-switch ms-auto">
            <input className="form-check-input" type="checkbox" defaultChecked />
            <label className="form-check-label">Precio vigente</label>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>TIPO</th>
                <th>MATERIAL BASE</th>
                <th>PRECIO</th>
                <th>ESTADO</th>
                <th className="text-end">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.codigo}>
                  <td className="text-muted">{p.codigo}</td>
                  <td className="fw-semibold">{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>
                    <span
                      className={
                        p.tipo === "Personalizable"
                          ? "badge text-primary border border-primary"
                          : "badge bg-light text-secondary"
                      }
                    >
                      {p.tipo}
                    </span>
                  </td>
                  <td className="text-muted">{p.material}</td>
                  <td className="fw-semibold">{p.precio}</td>
                  <td>
                    <span
                      className={
                        p.estado === "Activo"
                          ? "badge bg-success-subtle text-success"
                          : "badge bg-secondary-subtle text-secondary"
                      }
                    >
                      {p.estado}
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

    </div>
  );
}
