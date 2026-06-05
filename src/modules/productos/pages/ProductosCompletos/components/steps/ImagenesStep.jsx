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

const getColorKey = (variante) =>
  String(variante?.colorId || variante?.colorCodigo || variante?.colorNombre || variante?.id || "");

const agruparVariantesPorColor = (variantes = []) => {
  const grupos = new Map();

  variantes.forEach((variante) => {
    const key = getColorKey(variante);
    if (!key) return;

    if (!grupos.has(key)) {
      grupos.set(key, {
        key,
        colorId: variante.colorId || null,
        colorCodigo: variante.colorCodigo || "",
        colorNombre: variante.colorNombre || "Sin color",
        colorHex: variante.colorHex || "#d1d5db",
        representante: variante,
        variantes: []
      });
    }

    grupos.get(key).variantes.push(variante);
  });

  return Array.from(grupos.values());
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
  const [dragActiveColorKey, setDragActiveColorKey] = useState("");
  const [errorArchivos, setErrorArchivos] = useState("");
  const [colorSeleccionadoKey, setColorSeleccionadoKey] = useState("");

  const fileInputModeloRef = useRef(null);
  const fileInputColorRef = useRef(null);

  const variantes = useMemo(
    () => (Array.isArray(data.variantes) ? data.variantes : []),
    [data.variantes]
  );
  const colores = useMemo(() => agruparVariantesPorColor(variantes), [variantes]);

  const colorSeleccionado = useMemo(
    () => colores.find((color) => color.key === colorSeleccionadoKey) || colores[0] || null,
    [colores, colorSeleccionadoKey]
  );

  const imagenesPorVariante = useMemo(() => getImagenesPorVariante(data.imagenes), [data.imagenes]);
  const imagenModelo = useMemo(() => getImagenModelo(data.imagenes), [data.imagenes]);

  const updateImagenes = (nextModelo, nextVariantes) => {
    onUpdate("imagenes", {
      modelo: nextModelo,
      variantes: nextVariantes
    });
  };

  const getImagenesColor = (grupoColor) => {
    const key = String(grupoColor?.representante?.id || "");
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

  const subirImagenesColor = (grupoColor, files) => {
    const varianteRepresentanteId = grupoColor?.representante?.id;
    if (!varianteRepresentanteId || files.length === 0) return;

    const key = String(varianteRepresentanteId);
    const listaActual = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const nuevas = files.map((file, idx) => ({
      id: Date.now() + idx,
      nombre: file.name,
      file,
      url: URL.createObjectURL(file),
      varianteId: Number(varianteRepresentanteId),
      colorId: grupoColor.colorId,
      colorNombre: grupoColor.colorNombre,
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

  const establecerPrincipalColor = (grupoColor, imagenId) => {
    const key = String(grupoColor?.representante?.id || "");
    const lista = Array.isArray(imagenesPorVariante[key]) ? imagenesPorVariante[key] : [];

    const actualizada = lista.map((img) => ({
      ...img,
      principal: img.id === imagenId
    }));

    updateImagenes(imagenModelo, { ...imagenesPorVariante, [key]: actualizada });
  };

  const eliminarImagenColor = (grupoColor, imagenId) => {
    const key = String(grupoColor?.representante?.id || "");
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
      Number(imagenModelo?.varianteId) === Number(grupoColor?.representante?.id) &&
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

  const handleColorSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validas = validarArchivos(files);
    subirImagenesColor(colorSeleccionado, validas);
    e.target.value = "";
  };

  const handleDrag = (grupoColor, active) => {
    setDragActiveColorKey(active ? grupoColor.key : "");
  };

  const handleDrop = (e, grupoColor) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveColorKey("");

    const files = Array.from(e.dataTransfer.files || []);
    const validas = validarArchivos(files);
    subirImagenesColor(grupoColor, validas);
  };

  return (
    <div>
      <h4 className="mb-4">
        <i className="bi bi-images me-2 text-primary"></i>
        Imagenes por color
      </h4>

      <div className="alert alert-info py-2">
        Sube una sola galeria por color. Los productos del mismo color usaran esas mismas imagenes.
      </div>

      <div className="card mb-4">
        <div className="card-header bg-light fw-semibold">Portada del modelo</div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button className="btn btn-outline-primary" onClick={() => fileInputModeloRef.current?.click()}>
              Cargar portada
            </button>
            <button className="btn btn-outline-secondary" onClick={usarPrimeraDeColorComoModelo}>
              Usar primera imagen de color
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
                    ? "Tomada automaticamente de una imagen por color"
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
        <div className="card-header bg-light fw-semibold">Agregar imagenes a un color</div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label className="form-label fw-semibold">Color</label>
              <select
                className="form-select"
                value={colorSeleccionado?.key || ""}
                onChange={(e) => setColorSeleccionadoKey(e.target.value)}
              >
                {colores.length === 0 && <option value="">Primero agrega productos...</option>}
                {colores.map((color) => (
                  <option key={color.key} value={color.key}>
                    {color.colorCodigo ? `[${color.colorCodigo}] ` : ""}
                    {color.colorNombre} ({color.variantes.length} productos)
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <button
                className="btn btn-primary w-100"
                disabled={!colorSeleccionado}
                onClick={() => fileInputColorRef.current?.click()}
              >
                Agregar imagenes
              </button>
              <input
                ref={fileInputColorRef}
                type="file"
                multiple
                accept="image/*"
                className="d-none"
                onChange={handleColorSelect}
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

      {colores.length === 0 && (
        <div className="text-muted">Primero agrega productos para definir los colores disponibles.</div>
      )}

      {colores.map((grupoColor) => {
        const imagenesColor = getImagenesColor(grupoColor);
        const dragActivo = dragActiveColorKey === grupoColor.key;

        return (
          <div key={grupoColor.key} className="card mb-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span
                  className="rounded-circle border"
                  style={{ width: "18px", height: "18px", backgroundColor: grupoColor.colorHex }}
                />
                <div>
                  <strong>
                    {grupoColor.colorCodigo ? `[${grupoColor.colorCodigo}] ` : ""}
                    {grupoColor.colorNombre}
                  </strong>
                  <small className="text-muted ms-2">
                    {grupoColor.variantes.map((v) => v.sku).join(", ")}
                  </small>
                </div>
              </div>
              <span className="badge bg-secondary">{imagenesColor.length} imagenes</span>
            </div>
            <div className="card-body">
              <div
                className={`border-2 border-dashed rounded p-3 text-center mb-3 ${
                  dragActivo ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
                }`}
                style={{ borderStyle: "dashed", transition: "all 0.2s" }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  handleDrag(grupoColor, true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  handleDrag(grupoColor, false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  handleDrag(grupoColor, true);
                }}
                onDrop={(e) => handleDrop(e, grupoColor)}
              >
                Arrastra imagenes aqui para {grupoColor.colorNombre}
              </div>

              {imagenesColor.length === 0 ? (
                <div className="text-muted">Sin imagenes para este color.</div>
              ) : (
                <div className="row g-3">
                  {imagenesColor.map((imagen) => (
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
                              onClick={() => establecerPrincipalColor(grupoColor, imagen.id)}
                            >
                              Principal
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => eliminarImagenColor(grupoColor, imagen.id)}
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
