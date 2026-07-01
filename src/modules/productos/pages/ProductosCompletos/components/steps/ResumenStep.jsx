const getImagenesModeloyVariantes = (imagenes) => {
  if (Array.isArray(imagenes)) {
    const modelo = imagenes.find((img) => img?.principal) || imagenes[0] || null;
    return {
      modelo,
      variantes: {},
      total: imagenes.length
    };
  }

  const modelo = imagenes?.modelo || null;
  const variantes = imagenes?.variantes || {};

  const totalVariantes = Object.values(variantes).reduce((acc, lista) => {
    if (!Array.isArray(lista)) return acc;
    return acc + lista.length;
  }, 0);

  return {
    modelo,
    variantes,
    total: totalVariantes + (modelo ? 1 : 0)
  };
};

export default function ResumenStep({ data }) {
  const variantes = Array.isArray(data.variantes) ? data.variantes : [];

  const { modelo: imagenModelo, variantes: imagenesPorVariante, total: totalImagenes } =
    getImagenesModeloyVariantes(data.imagenes);

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-check-circle me-2 text-success"></i>
        Resumen del Producto
      </h4>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <i className="bi bi-box me-2"></i>
          Datos del Modelo
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <strong>Origen:</strong>{" "}
              {data.modelo.modo === "existente" ? "Modelo existente" : "Modelo nuevo"}
            </div>
            <div className="col-md-4">
              <strong>Codigo:</strong> {data.modelo.codigo || "N/A"}
            </div>
            <div className="col-md-4">
              <strong>Nombre:</strong> {data.modelo.nombre || "N/A"}
            </div>
            <div className="col-md-4">
              <strong>Familia ID:</strong> {data.modelo.familiaId || "N/A"}
            </div>
            <div className="col-12 mt-2">
              <strong>Descripcion:</strong> {data.modelo.descripcion || "Sin descripcion"}
            </div>
            <div className="col-12 mt-2">
              <strong>Descripcion corta:</strong> {data.modelo.descripcionCorta || "Sin descripcion corta"}
            </div>
            <div className="col-12 mt-2">
              <strong>Estado:</strong>{" "}
              <span className={`badge ${data.modelo.activo ? "bg-success" : "bg-danger"}`}>
                {data.modelo.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-info text-white">
          <i className="bi bi-palette me-2"></i>
          Productos generados ({variantes.length})
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Material</th>
                  <th>Color</th>
                  <th>Ancho</th>
                  <th>Alto</th>
                  <th>Fondo</th>
                  <th>Peso (kg)</th>
                  <th>SKU</th>
                </tr>
              </thead>
              <tbody>
                {variantes.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-3">
                      No hay productos agregados.
                    </td>
                  </tr>
                )}
                {variantes.map((variante, index) => (
                  <tr key={variante.id || index}>
                    <td>
                      {variante.categoriaCodigo ? `[${variante.categoriaCodigo}] ` : ""}
                      {variante.categoriaNombre || "-"}
                    </td>
                    <td>
                      {variante.materialCodigo ? `[${variante.materialCodigo}] ` : ""}
                      {variante.materialNombre || "-"}
                    </td>
                    <td>
                      <div className="d-flex gap-2 align-items-center">
                        <div
                          className="rounded-circle border"
                          style={{ width: "16px", height: "16px", backgroundColor: variante.colorHex || "#ccc" }}
                        ></div>
                        <span>
                          {variante.colorCodigo ? `[${variante.colorCodigo}] ` : ""}
                          {variante.colorNombre || "-"}
                        </span>
                      </div>
                    </td>
                    <td>{variante.ancho !== "" && variante.ancho != null ? variante.ancho : "-"}</td>
                    <td>{variante.alto !== "" && variante.alto != null ? variante.alto : "-"}</td>
                    <td>{variante.fondo !== "" && variante.fondo != null ? variante.fondo : "-"}</td>
                    <td>{variante.pesoKg !== "" && variante.pesoKg != null ? `${variante.pesoKg} kg` : "-"}</td>
                    <td>
                      <code>{variante.sku || "-"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-warning">
          <i className="bi bi-images me-2"></i>
          Imagenes ({totalImagenes})
        </div>
        <div className="card-body">
          <div className="mb-3">
            <h6 className="fw-semibold">Portada del modelo</h6>
            {!imagenModelo ? (
              <div className="text-muted">Sin portada definida.</div>
            ) : (
              <img
                src={imagenModelo.url}
                alt={imagenModelo.nombre || "Portada"}
                style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "8px" }}
              />
            )}
          </div>

          <h6 className="fw-semibold">Imagenes por variante</h6>
          {variantes.length === 0 && <div className="text-muted">No hay variantes para mostrar imagenes.</div>}

          {variantes.map((variante) => {
            const lista = Array.isArray(imagenesPorVariante?.[String(variante.id)])
              ? imagenesPorVariante[String(variante.id)]
              : [];

            return (
              <div key={variante.id} className="mb-3">
                <div className="mb-2 d-flex gap-2 align-items-center">
                  <span
                    className="rounded-circle border"
                    style={{ width: "16px", height: "16px", backgroundColor: variante.colorHex }}
                  />
                  <strong>{variante.sku}</strong>
                  <span className="text-muted">{variante.categoriaNombre} / {variante.materialNombre} / {variante.colorNombre} ({lista.length} imagenes)</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {lista.length === 0 ? (
                    <span className="text-muted">Sin imagenes</span>
                  ) : (
                    lista.map((imagen) => (
                      <img
                        key={imagen.id}
                        src={imagen.url}
                        alt={imagen.nombre}
                        title={imagen.principal ? "Principal" : "Imagen"}
                        style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
