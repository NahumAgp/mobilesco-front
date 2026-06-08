import { useState } from "react";

import { getUser } from "../../auth/services/authService.js";
import { puedeGestionarCatalogoInsumos } from "../utils/costosPermisos.js";
import TiposInsumoManager from "../components/TiposInsumoManager.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./InsumosPage.css";

export default function TiposInsumoPage() {
  const puedeGestionarInsumos = puedeGestionarCatalogoInsumos(getUser());
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage("")}
      />

      <PageHeader
        title="Tipos de Insumo"
        subtitle="Submodulo para administrar el catalogo de tipos usado por proveedores"
      />

      <TiposInsumoManager
        puedeGestionar={puedeGestionarInsumos}
        onFeedback={(message, type = "success") => {
          setToastType(type);
          setToastMessage(message);
        }}
      />
    </>
  );
}
