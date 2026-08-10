import { useState } from "react";

import { getUser, hasPermission } from "../../auth/services/authService.js";
import TiposInsumoManager from "../components/TiposInsumoManager.jsx";
import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import Toast from "../../../components/ui/Toast.jsx";
import "./InsumosPage.css";

export default function TiposInsumoPage() {
  const user = getUser();
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
        puedeCrear={hasPermission(user, "ACTION_INPUT_TYPES_CREATE")}
        puedeEditar={hasPermission(user, "ACTION_INPUT_TYPES_EDIT")}
        puedeCambiarEstado={hasPermission(user, "ACTION_INPUT_TYPES_STATUS")}
        onFeedback={(message, type = "success") => {
          setToastType(type);
          setToastMessage(message);
        }}
      />
    </>
  );
}
