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
  const [dragActive, setDragActive] = useState(false);
  const [errorArchivos, setErrorArchivos] = useState("");
  const [varianteSeleccionadaId, setVarianteSeleccionadaId] = useState("");

  const fileInputModeloRef = useRef(null);
  const fileInputVarianteRef = useRef(null);

  const variantes = Array.isArray(data.variantes) ? data.variantes : [];

  const imagenesPorVariante = useMemo(() => getImagenesPorVariante(data.imagenes), [data.imagenes]);
  const imagenModelo = useMemo(() => getImagenModelo(data.imagenes), [data.imagenes]);

  const updateImagenes = (nextModelo, nextVariantes) => {
    onUpdate("imagenes", {
      modelo: nextModelo,
      variantes: nextVariantes
    });
  };

  const validarArchivos = (files) => {
    const imagenesValidas = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= MAX_SIZE_BYTES
    );

    const archivosInvalidos = files.length - imagenesValidas.length;
    if (archivosInvalidos > 0) {
      setErrorArchivos("Algunos archivos se omitieron por formato invalido o tamano mayor a 5MB.");
    } else {
      setErrorArchivos("");
    }

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

  const subirImagenesVariante = (varianteId, files) => {
    if (!varianteId || files.length === 0) return;

    const key = String(varianteId);
    const listaActual = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const nuevas = files.map((file, idx) => ({
      id: Date.now() + idx,
      nombre: file.name,
      file,
      url: URL.createObjectURL(file),
      varianteId: Number(varianteId),
      principal: listaActual.length === 0 && idx === 0
    }));

    const mapaActualizado = {
      ...imagenesPorVariante,
      [key]: [...listaActual, ...nuevas]
    };

    updateImagenes(imagenModelo, mapaActualizado);
  };

  const eliminarImagenModelo = () => {
    if (imagenModelo?.url?.startsWith("blob:") && imagenModelo.origen !== "variante") {
      URL.revokeObjectURL(imagenModelo.url);
    }

    updateImagenes(null, imagenesPorVariante);
  };

  const usarPrimeraDeVarianteComoModelo = () => {
    const primera = primeraImagenDisponible(imagenesPorVariante);
    if (!primera) {
      alert("Primero agrega al menos una imagen en alguna variante.");
      return;
    }

    const nextModelo = {
      id: `m-${primera.id}`,
      nombre: primera.nombre,
      url: primera.url,
      origen: "variante",
      varianteId: primera.varianteId,
      imagenId: primera.id
    };

    updateImagenes(nextModelo, imagenesPorVariante);
  };

  const establecerPrincipalVariante = (varianteId, imagenId) => {
    const key = String(varianteId);
    const lista = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const actualizada = lista.map((img) => ({
      ...img,
      principal: img.id === imagenId
    }));

    updateImagenes(imagenModelo, { ...imagenesPorVariante, [key]: actualizada });
  };

  const eliminarImagenVariante = (varianteId, imagenId) => {
    const key = String(varianteId);
    const lista = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const imagenEliminada = lista.find((img) => img.id === imagenId);
    if (imagenEliminada?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(imagenEliminada.url);
    }

    const filtrada = lista.filter((img) => img.id !== imagenId);
    if (filtrada.length > 0 && !filtrada.some((img) => img.principal)) {
      filtrada[0].principal = true;
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
      Number(imagenModelo?.varianteId) === Number(varianteId) &&
      Number(imagenModelo?.imagenId) === Number(imagenId)
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
    subirImagenesVariante(varianteSeleccionadaId, validas);
    e.target.value = "";
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!varianteSeleccionadaId) {
      setErrorArchivos("Selecciona una variante antes de arrastrar imagenes.");
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    const validas = validarArchivos(files);
    subirImagenesVariante(varianteSeleccionadaId, validas);
  };

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-images me-2 text-primary"></i>
        Imagenes del Producto
      </h4>

      <div className="alert alert-info py-2">
        Recomendacion aplicada: la imagen del modelo se maneja aparte y cada variante puede tener su propia galeria.
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light fw-semibold">Portada del Modelo</div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-outline-primary" onClick={() => fileInputModeloRef.current?.click()}>
              Cargar portada
            </button>
            <button className="btn btn-outline-secondary" onClick={usarPrimeraDeVarianteComoModelo}>
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
                    ? "Tomada automaticamente de una variante"
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
        <div className="card-header bg-light fw-semibold">Galeria por Variante</div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label fw-semibold">Variante</label>
              <select
                className="form-select"
                value={varianteSeleccionadaId}
                onChange={(e) => setVarianteSeleccionadaId(e.target.value)}
              >
                <option value="">Selecciona una variante...</option>
                {variantes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.sku} - {v.categoriaNombre || "Sin categoria"} / {v.colorNombre || "Sin color"}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                disabled={!varianteSeleccionadaId}
                onClick={() => fileInputVarianteRef.current?.click()}
              >
                Agregar imagenes a variante
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

          <div
            className={`border-2 border-dashed rounded p-4 text-center mt-3 ${
              dragActive ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
            }`}
            style={{ borderStyle: "dashed", transition: "all 0.3s" }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            Arrastra imagenes aqui para la variante seleccionada
          </div>
        </div>
      </div>

      {errorArchivos && (
        <div className="alert alert-warning py-2">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {errorArchivos}
        </div>
      )}

      {variantes.map((variante) => {
        const key = String(variante.id);
        const imagenesVariante = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

        return (
          <div key={variante.id} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <strong>{variante.sku}</strong>
                <small className="text-muted ms-2">
                  {variante.categoriaNombre || "-"} / {variante.colorNombre || "-"}
                </small>
              </div>
              <span className="badge bg-secondary">{imagenesVariante.length} imagenes</span>
            </div>
            <div className="card-body">
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
                              onClick={() => establecerPrincipalVariante(variante.id, imagen.id)}
                            >
                              Principal
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarImagenVariante(variante.id, imagen.id)}
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
