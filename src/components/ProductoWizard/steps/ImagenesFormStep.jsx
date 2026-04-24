// components/ProductoWizard/steps/ImagenesFormStep.jsx
import { useRef, useState } from "react";

export default function ImagenesFormStep({ data, onUpdate }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    procesarImagenes(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    procesarImagenes(files);
  };

  const procesarImagenes = (files) => {
    const nuevasImagenes = files.map((file, index) => ({
      id: Date.now() + index,
      file,
      url: URL.createObjectURL(file),
      principal: data.imagenes.length === 0 && index === 0,
      orden: data.imagenes.length + index
    }));
    
    onUpdate("imagenes", [...data.imagenes, ...nuevasImagenes]);
  };

  const establecerPrincipal = (id) => {
    const nuevasImagenes = data.imagenes.map(img => ({
      ...img,
      principal: img.id === id
    }));
    onUpdate("imagenes", nuevasImagenes);
  };

  const eliminarImagen = (id) => {
    const nuevasImagenes = data.imagenes.filter(img => img.id !== id);
    if (nuevasImagenes.length > 0 && !nuevasImagenes.some(img => img.principal)) {
      nuevasImagenes[0].principal = true;
    }
    onUpdate("imagenes", nuevasImagenes);
  };

  return (
    <div>
      <h4 className="mb-4">Imágenes del Producto</h4>
      
      <div
        className={`border-2 border-dashed rounded p-5 text-center mb-4 ${
          dragActive ? "border-primary bg-primary bg-opacity-10" : "border-secondary"
        }`}
        style={{ borderStyle: "dashed", cursor: "pointer" }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="d-none"
          onChange={handleFileSelect}
        />
        <i className="bi bi-cloud-upload fs-1 text-secondary"></i>
        <p className="mt-3 mb-0">
          Arrastra y suelta imágenes aquí o haz clic para seleccionar
        </p>
        <small className="text-muted">Formatos: JPG, PNG, GIF (Max 5MB)</small>
      </div>

      {/* Galería de Imágenes */}
      <div className="row g-3">
        {data.imagenes.map((imagen, index) => (
          <div key={imagen.id} className="col-md-3">
            <div className="card h-100">
              <img
                src={imagen.url}
                className="card-img-top"
                alt={`Producto ${index + 1}`}
                style={{ height: "200px", objectFit: "cover" }}
              />
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center">
                  {imagen.principal ? (
                    <span className="badge bg-success">
                      <i className="bi bi-star-fill me-1"></i>Principal
                    </span>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => establecerPrincipal(imagen.id)}
                    >
                      Establecer Principal
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => eliminarImagen(imagen.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}