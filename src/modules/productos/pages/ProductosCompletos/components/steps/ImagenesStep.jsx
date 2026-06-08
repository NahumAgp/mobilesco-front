import { useMemo, useRef, useState } from "react";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const getImagenesPorVariante = (imagenes) => {
  if (Array.isArray(imagenes)) return {};
  if (imagenes && typeof imagenes === "object" && imagenes.variantes) {
    return imagenes.variantes;
  }
  return {};
};

const getImagenModelo = (imagenes) => {
  if (Array.isArray(imagenes)) {
    return imagenes.find((img) => img?.principal) || imagenes[0] || null;
  }
  if (imagenes && typeof imagenes === "object") {
    return imagenes.modelo || null;
  }
  return null;
};

const primeraImagenDisponible = (mapaVariantes) => {
  const entradas = Object.values(mapaVariantes || {});
  for (const lista of entradas) {
    if (Array.isArray(lista) && lista.length > 0) {
      return lista[0];
    }
  }
  return null;
};

export default function ImagenesStep({ data, onUpdate }) {
  const [dragActiveVarianteKey, setDragActiveVarianteKey] = useState("");
  const [errorArchivos, setErrorArchivos] = useState("");
  const [varianteSeleccionadaKey, setVarianteSeleccionadaKey] = useState("");

  const fileInputModeloRef = useRef(null);
  const fileInputVarianteRef = useRef(null);

  const variantes = useMemo(
    () => (Array.isArray(data.variantes) ? data.variantes : []),
    [data.variantes]
  );
  const varianteSeleccionada = useMemo(
    () => variantes.find((variante) => String(variante.id) === varianteSeleccionadaKey) || variantes[0] || null,
    [variantes, varianteSeleccionadaKey]
  );

  const imagenesPorVariante = useMemo(() => getImagenesPorVariante(data.imagenes), [data.imagenes]);
  const imagenModelo = useMemo(() => getImagenModelo(data.imagenes), [data.imagenes]);

  const updateImagenes = (nextModelo, nextVariantes) => {
    onUpdate("imagenes", {
      modelo: nextModelo,
      variantes: nextVariantes
    });
  };

  const getImagenesVariante = (variante) => {
    const key = String(variante?.id || "");
    return Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];
  };

  const validarArchivos = (files) => {
    const imagenesValidas = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= MAX_SIZE_BYTES
    );

    const archivosInvalidos = files.length - imagenesValidas.length;
    setErrorArchivos(
      archivosInvalidos > 0
        ? "Algunos archivos se omitieron por formato invalido o tamano mayor a 5MB."
        : ""
    );

    return imagenesValidas;
  };

  const subirImagenModelo = (file) => {
    if (!file) return;

    const imagenAnterior = imagenModelo;
    if (imagenAnterior?.url?.startsWith("blob:") && imagenAnterior.origen !== "variante") {
      URL.revokeObjectURL(imagenAnterior.url);
    }

    const nuevaImagenModelo = {
      id: Date.now(),
      nombre: file.name,
      file,
      url: URL.createObjectURL(file),
      origen: "manual"
    };

    updateImagenes(nuevaImagenModelo, imagenesPorVariante);
  };

  const subirImagenesVariante = (variante, files) => {
    const varianteId = variante?.id;
    if (!varianteId || files.length === 0) return;

    const key = String(varianteId);
    const listaActual = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const nuevas = files.map((file, idx) => ({
      id: Date.now() + idx,
      nombre: file.name,
      file,
      url: URL.createObjectURL(file),
      varianteId,
      materialId: variante.materialId,
      materialNombre: variante.materialNombre,
      colorId: variante.colorId,
      colorNombre: variante.colorNombre,
      principal: listaActual.length === 0 && idx === 0
    }));

    updateImagenes(imagenModelo, {
      ...imagenesPorVariante,
      [key]: [...listaActual, ...nuevas]
    });
  };

  const eliminarImagenModelo = () => {
    if (imagenModelo?.url?.startsWith("blob:") && imagenModelo.origen !== "variante") {
      URL.revokeObjectURL(imagenModelo.url);
    }

    updateImagenes(null, imagenesPorVariante);
  };

  const usarPrimeraDeColorComoModelo = () => {
    const primera = primeraImagenDisponible(imagenesPorVariante);
    if (!primera) {
      alert("Primero agrega al menos una imagen en algun color.");
      return;
    }

    updateImagenes(
      {
        id: `m-${primera.id}`,
        nombre: primera.nombre,
        url: primera.url,
        origen: "variante",
        varianteId: primera.varianteId,
        imagenId: primera.id
      },
      imagenesPorVariante
    );
  };

  const establecerPrincipalVariante = (variante, imagenId) => {
    const key = String(variante?.id || "");
    const lista = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const actualizada = lista.map((img) => ({
      ...img,
      principal: img.id === imagenId
    }));

    updateImagenes(imagenModelo, { ...imagenesPorVariante, [key]: actualizada });
  };

  const eliminarImagenVariante = (variante, imagenId) => {
    const key = String(variante?.id || "");
    const lista = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const imagenEliminada = lista.find((img) => img.id === imagenId);
    if (imagenEliminada?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(imagenEliminada.url);
    }

    const filtrada = lista.filter((img) => img.id !== imagenId);
    if (filtrada.length > 0 && !filtrada.some((img) => img.principal)) {
      filtrada[0] = { ...filtrada[0], principal: true };
    }

    const mapaActualizado = {
      ...imagenesPorVariante,
      [key]: filtrada
    };

    if (filtrada.length === 0) {
      delete mapaActualizado[key];
    }

    let modeloActualizado = imagenModelo;
    if (
      imagenModelo?.origen === "variante" &&
      String(imagenModelo?.varianteId) === String(variante?.id) &&
      String(imagenModelo?.imagenId) === String(imagenId)
    ) {
      const reemplazo = primeraImagenDisponible(mapaActualizado);
      modeloActualizado = reemplazo
        ? {
            id: `m-${reemplazo.id}`,
            nombre: reemplazo.nombre,
            url: reemplazo.url,
            origen: "variante",
            varianteId: reemplazo.varianteId,
            imagenId: reemplazo.id
          }
        : null;
    }

    updateImagenes(modeloActualizado, mapaActualizado);
  };

  const handleModeloSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validas = validarArchivos(files);
    subirImagenModelo(validas[0]);
    e.target.value = "";
  };

  const handleVarianteSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validas = validarArchivos(files);
    subirImagenesVariante(varianteSeleccionada, validas);
    e.target.value = "";
  };

  const handleDrag = (variante, active) => {
    setDragActiveVarianteKey(active ? String(variante.id) : "");
  };

  const handleDrop = (e, variante) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveVarianteKey("");

    const files = Array.from(e.dataTransfer.files || []);
    const validas = validarArchivos(files);
    subirImagenesVariante(variante, validas);
  };

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-images me-2 text-primary"></i>
        Imagenes por variante
      </h4>

      <div className="alert alert-info py-2">
        Cada combinacion de categoria, material y color tiene su propia galeria de imagenes.
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light fw-semibold">Portada del modelo</div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-outline-primary" onClick={() => fileInputModeloRef.current?.click()}>
              Cargar portada
            </button>
            <button className="btn btn-outline-secondary" onClick={usarPrimeraDeColorComoModelo}>
              Usar primera imagen de variante
            </button>
            {imagenModelo && (
              <button className="btn btn-outline-danger" onClick={eliminarImagenModelo}>
                Quitar portada
              </button>
            )}
            <input
              ref={fileInputModeloRef}
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleModeloSelect}
            />
          </div>

          {imagenModelo ? (
            <div className="d-flex align-items-center gap-3">
              <img
                src={imagenModelo.url}
                alt={imagenModelo.nombre || "Portada del modelo"}
                style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "10px" }}
              />
              <div>
                <div className="fw-semibold">{imagenModelo.nombre || "Portada"}</div>
                <small className="text-muted">
                  {imagenModelo.origen === "variante"
                    ? "Tomada automaticamente de una imagen de variante"
                    : "Cargada manualmente"}
                </small>
              </div>
            </div>
          ) : (
            <div className="text-muted">Sin portada definida.</div>
          )}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light fw-semibold">Agregar imagenes a una variante</div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label fw-semibold">Variante</label>
              <select
                className="form-select"
                value={varianteSeleccionada?.id || ""}
                onChange={(e) => setVarianteSeleccionadaKey(e.target.value)}
              >
                {variantes.length === 0 && <option value="">Primero agrega productos...</option>}
                {variantes.map((variante) => (
                  <option key={variante.id} value={variante.id}>
                    {variante.sku} - {variante.materialNombre} - {variante.colorNombre} - {variante.categoriaNombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                disabled={!varianteSeleccionada}
                onClick={() => fileInputVarianteRef.current?.click()}
              >
                Agregar imagenes
              </button>
              <input
                ref={fileInputVarianteRef}
                type="file"
                multiple
                accept="image/*"
                className="d-none"
                onChange={handleVarianteSelect}
              />
            </div>
          </div>
        </div>
      </div>

      {errorArchivos && (
        <div className="alert alert-warning py-2">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorArchivos}
        </div>
      )}

      {variantes.length === 0 && (
        <div className="text-muted">Primero agrega productos para definir las variantes disponibles.</div>
      )}

      {variantes.map((variante) => {
        const imagenesVariante = getImagenesVariante(variante);
        const dragActivo = dragActiveVarianteKey === String(variante.id);

        return (
          <div key={variante.id} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle border"
                  style={{ width: "18px", height: "18px", backgroundColor: variante.colorHex }}
                />
                <div>
                  <strong>
                    {variante.sku}
                  </strong>
                  <small className="text-muted ms-2">{variante.categoriaNombre} / {variante.materialNombre} / {variante.colorNombre}</small>
                </div>
              </div>
              <span className="badge bg-secondary">{imagenesVariante.length} imagenes</span>
            </div>
            <div className="card-body">
              <div
                className={`border-2 border-dashed rounded p-3 text-center mb-3 ${
                  dragActivo ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
                }`}
                style={{ borderStyle: "dashed", transition: "all 0.2s" }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  handleDrag(variante, true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  handleDrag(variante, false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDrag(variante, true);
                }}
                onDrop={(e) => handleDrop(e, variante)}
              >
                Arrastra imagenes aqui para {variante.sku}
              </div>

              {imagenesVariante.length === 0 ? (
                <div className="text-muted">Sin imagenes para esta variante.</div>
              ) : (
                <div className="row g-3">
                  {imagenesVariante.map((imagen) => (
                    <div key={imagen.id} className="col-md-3">
                      <div className="card h-100 shadow-sm">
                        <img
                          src={imagen.url}
                          className="card-img-top"
                          alt={imagen.nombre}
                          style={{ height: "180px", objectFit: "cover" }}
                        />
                        <div className="card-body p-2 d-flex justify-content-between align-items-center">
                          {imagen.principal ? (
                            <span className="badge bg-success">Principal</span>
                          ) : (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => establecerPrincipalVariante(variante, imagen.id)}
                            >
                              Principal
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarImagenVariante(variante, imagen.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
