import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../../components/Sistema/PageHeader.jsx";
import SubfamiliaForm from "./SubfamiliaForm.jsx";

export default function SubfamiliaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  return (
    <>
      <PageHeader
        title={esEdicion ? "Editar subfamilia" : "Nueva subfamilia"}
        subtitle="Organiza modelos dentro de una familia específica"
        actions={
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/subfamilias")}>
            Volver
          </button>
        }
      />
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <SubfamiliaForm subfamiliaId={id} />
        </div>
      </div>
    </>
  );
}
