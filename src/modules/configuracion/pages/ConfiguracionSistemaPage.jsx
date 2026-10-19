import { useEffect, useState } from "react";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import { API_BASE_URL } from "../../../config/apiConfig.js";
import {
  actualizarConfiguracionSistema,
  obtenerConfiguracionSistema,
  subirLogoEmpresa,
} from "../services/configuracionSistema.js";
import "./ConfiguracionSistemaPage.css";

const EMPTY = {
  nombreEmpresa: "",
  razonSocial: "",
  rfc: "",
  correo: "",
  telefono: "",
  direccion: "",
  sitioWeb: "",
  moneda: "MXN",
  colorPrimario: "#324A46",
  logoSistemaUrl: "",
  logoDocumentosUrl: "",
  logoCatalogoUrl: "",
  coberturaAbcA: 2,
  coberturaAbcB: 1.5,
  coberturaAbcC: 1,
};

const LOGOS = [
  { key: "sistema", field: "logoSistemaUrl", title: "Logo del sistema", hint: "Recomendado: cuadrado, hasta 512 × 512 px. Se usa en la navegación y la identidad del ERP." },
  { key: "documentos", field: "logoDocumentosUrl", title: "Logo para reportes", hint: "Recomendado: horizontal, hasta 1400 × 500 px. Se usa en reportes y documentos comerciales." },
  { key: "catalogo", field: "logoCatalogoUrl", title: "Logo para catálogo", hint: "Recomendado: horizontal, hasta 1400 × 500 px. Se usa en el catálogo PDF." },
];

function assetUrl(path) {
  return path ? `${API_BASE_URL}${path}` : "";
}

export default function ConfiguracionSistemaPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  useEffect(() => {
    obtenerConfiguracionSistema()
      .then((data) => setForm({ ...EMPTY, ...data }))
      .catch((error) => setToast({ message: error.message || "No se pudo cargar la configuración.", type: "danger" }))
      .finally(() => setLoading(false));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await actualizarConfiguracionSistema(form);
      setForm((current) => ({ ...current, ...saved }));
      setToast({ message: "Configuración guardada.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "No se pudo guardar la configuración.", type: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const upload = async (variant, file) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setToast({ message: "Usa una imagen PNG, JPG o WebP.", type: "warning" });
      return;
    }
    setUploading(variant);
    try {
      const saved = await subirLogoEmpresa(variant, file);
      setForm((current) => ({ ...current, ...saved }));
      setToast({ message: "Logo actualizado.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "No se pudo subir el logo.", type: "danger" });
    } finally {
      setUploading("");
    }
  };

  if (loading) return <div className="config-page-loading" role="status">Cargando configuración…</div>;

  return (
    <main className="config-page">
      <PageHeader title="Configuración del sistema" subtitle="Identidad de empresa y políticas de abastecimiento." />
      {toast.message && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />}
      <form onSubmit={save}>
        <section className="config-card">
          <div className="config-card-heading">
            <div><h2>Datos de la empresa</h2><p>Se reutilizan en documentos y reportes del ERP.</p></div>
          </div>
          <div className="config-form-grid">
            <label>Nombre comercial<input name="nombreEmpresa" value={form.nombreEmpresa} onChange={update} required maxLength={160} /></label>
            <label>Razón social<input name="razonSocial" value={form.razonSocial || ""} onChange={update} maxLength={180} /></label>
            <label>RFC<input name="rfc" value={form.rfc || ""} onChange={update} maxLength={20} /></label>
            <label>Correo<input name="correo" type="email" value={form.correo || ""} onChange={update} maxLength={160} /></label>
            <label>Teléfono<input name="telefono" value={form.telefono || ""} onChange={update} maxLength={40} /></label>
            <label>Sitio web<input name="sitioWeb" type="url" value={form.sitioWeb || ""} onChange={update} maxLength={180} placeholder="https://" /></label>
            <label className="config-span-2">Dirección<input name="direccion" value={form.direccion || ""} onChange={update} maxLength={255} /></label>
            <label>Moneda de reportes<select name="moneda" value={form.moneda} onChange={update}><option value="MXN">MXN — Peso mexicano</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
            <label>Color principal<div className="config-color-input"><input name="colorPrimario" type="color" value={form.colorPrimario} onChange={update} /><span>{form.colorPrimario}</span></div></label>
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-heading"><div><h2>Logos y formatos</h2><p>Sube PNG, JPG o WebP. El sistema genera archivos JPG optimizados para cada uso.</p></div></div>
          <div className="config-logo-grid">
            {LOGOS.map((logo) => (
              <article className="config-logo-card" key={logo.key}>
                <h3>{logo.title}</h3>
                <p>{logo.hint}</p>
                <div className="config-logo-preview">
                  {form[logo.field] ? <img src={assetUrl(form[logo.field])} alt={logo.title} /> : <span>Sin logo</span>}
                </div>
                <label className="config-upload-button">
                  {uploading === logo.key ? "Subiendo…" : "Seleccionar imagen"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" disabled={Boolean(uploading)} onChange={(event) => upload(logo.key, event.target.files?.[0])} />
                </label>
              </article>
            ))}
          </div>
        </section>

        <section className="config-card">
          <div className="config-card-heading"><div><h2>Política de reabastecimiento</h2><p>Meses de inventario objetivo según clasificación ABC; se aplican a las sugerencias de compra.</p></div></div>
          <div className="config-form-grid config-coverage-grid">
            {[["A", "coberturaAbcA"], ["B", "coberturaAbcB"], ["C", "coberturaAbcC"]].map(([label, name]) => (
              <label key={name}>Cobertura para clase {label} (meses)<input name={name} type="number" min="0.25" max="24" step="0.25" value={form[name]} onChange={update} required /></label>
            ))}
          </div>
          <p className="config-note">Las sugerencias consideran consumo reciente, stock mínimo, existencias reservadas y compras abiertas. Estos valores fijan la cobertura objetivo.</p>
        </section>

        <div className="config-actions"><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar configuración"}</button></div>
      </form>
    </main>
  );
}
