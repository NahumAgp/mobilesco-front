import { useState } from "react";
import { descargarPlantillaProveedores, procesarImportacionProveedores } from "../services/proveedores.js";

export default function CargaMasivaProveedoresDialog({ onClose, onImport }) {
  const [archivo, setArchivo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const descargarPlantilla = async () => {
    setError("");
    try {
      const blob = await descargarPlantillaProveedores();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "plantilla-proveedores.xlsx";
      enlace.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message || "No se pudo descargar la plantilla."); }
  };

  const procesar = async (confirmar) => {
    if (!archivo) return;
    setOcupado(true);
    setError("");
    try {
      const datos = await procesarImportacionProveedores(archivo, confirmar);
      if (confirmar) {
        setResultado(datos);
        setResumen(null);
        if (datos.importadas > 0) onImport();
      } else setResumen(datos);
    } catch (e) { setError(e.message || "No se pudo procesar el archivo."); }
    finally { setOcupado(false); }
  };

  const datos = resultado || resumen;
  return <div className="modal d-block" role="dialog" aria-modal="true" aria-label="Carga masiva de proveedores" style={{ background: "#0008" }}>
    <div className="modal-dialog modal-lg modal-dialog-scrollable"><div className="modal-content">
      <div className="modal-header"><h2 className="modal-title fs-5">Carga masiva de proveedores</h2>
        <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose} /></div>
      <div className="modal-body">
        <p>Descarga la plantilla, llena una fila por proveedor y revisa los errores antes de importar.</p>
        <button type="button" className="btn btn-outline-primary mb-3" onClick={descargarPlantilla}>Descargar plantilla Excel</button>
        <label className="form-label d-block" htmlFor="archivo-proveedores">Archivo .xlsx</label>
        <input id="archivo-proveedores" type="file" accept=".xlsx" className="form-control" disabled={ocupado}
          onChange={(event) => { setArchivo(event.target.files?.[0] || null); setResumen(null); setResultado(null); setError(""); }} />
        {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
        {datos && <div className="mt-3" role="status">
          <div className="alert alert-info">{resultado ? `${resultado.importadas} ${resultado.importadas === 1 ? "importado" : "importados"} · ${resultado.errores} ${resultado.errores === 1 ? "rechazado" : "rechazados"}` : `${resumen.validas} ${resumen.validas === 1 ? "fila válida" : "filas válidas"} · ${resumen.errores} con errores`}</div>
          {datos.filas?.some((fila) => fila.errores.length) && <div className="table-responsive"><table className="table table-sm">
            <thead><tr><th>Fila</th><th>Razón social</th><th>RFC</th><th>Errores</th></tr></thead>
            <tbody>{datos.filas.filter((fila) => fila.errores.length).map((fila) => <tr key={fila.numero}>
              <td>{fila.numero}</td><td>{fila.razonSocial}</td><td>{fila.rfc}</td><td>{fila.errores.join("; ")}</td>
            </tr>)}</tbody>
          </table></div>}
        </div>}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cerrar</button>
        {!resultado && <button type="button" className="btn btn-outline-primary" disabled={!archivo || ocupado} onClick={() => procesar(false)}>
          {ocupado ? "Procesando…" : "Validar archivo"}</button>}
        {resumen && resumen.validas > 0 && <button type="button" className="btn btn-success" disabled={ocupado} onClick={() => procesar(true)}>
          {ocupado ? "Importando…" : `Importar ${resumen.validas} ${resumen.validas === 1 ? "válido" : "válidos"}`}</button>}
      </div>
    </div></div>
  </div>;
}
