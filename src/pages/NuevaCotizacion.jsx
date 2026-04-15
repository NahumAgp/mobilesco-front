export default function NuevaCotizacion() {
  return (
    <div className="p-4">

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Nueva Cotización</h2>
          <p className="text-muted mb-0">
            Configurador de Mobiliario a Medida
          </p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary">
            Guardar Borrador
          </button>
          <button className="btn btn-warning text-white">
            Enviar Cotización
          </button>
        </div>
      </div>

      {/* 1. Información del Cliente */}
      <div className="card mb-4">
        <div className="card-header fw-semibold">
          1. Información del Cliente
        </div>
        <div className="card-body">

          <div className="mb-3">
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-primary active">
                Nuevo
              </button>
              <button className="btn btn-sm btn-outline-primary">
                Recurrente
              </button>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Nombre o Razón Social</label>
              <input className="form-control" placeholder="Ej. Colegio Montes" />
            </div>

            <div className="col-md-4">
              <label className="form-label">Lugar de Entrega</label>
              <input className="form-control" placeholder="Dirección Completa" />
            </div>

            <div className="col-md-4">
              <label className="form-label">Datos del Pedido</label>
              <input type="date" className="form-control" />
            </div>

            <div className="col-md-3">
              <label className="form-label">Ciudad</label>
              <input className="form-control" placeholder="Pachuca" />
            </div>

            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <input className="form-control" placeholder="Hidalgo" />
            </div>

            <div className="col-md-3">
              <label className="form-label">Teléfono</label>
              <input className="form-control" placeholder="WhatsApp" />
            </div>

            <div className="col-md-3">
              <label className="form-label">Email</label>
              <input className="form-control" placeholder="contacto@ejemplo.com" />
            </div>

            <div className="col-md-12">
              <label className="form-label">Urgencia</label>
              <div className="btn-group ms-2">
                <button className="btn btn-outline-secondary active">
                  Normal
                </button>
                <button className="btn btn-outline-secondary">
                  Urgente
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Cálculo de Flete */}
      <div className="card mb-4">
        <div className="card-header fw-semibold">
          2. Cálculo de Flete
        </div>
        <div className="card-body">

          <div className="row g-3 align-items-center">
            <div className="col-md-3">
              <label className="form-label">Distancia desde Planta (km)</label>
              <input className="form-control" value="0" readOnly />
            </div>

            <div className="col-md-3 text-center">
              <small className="text-muted">Zona Asignada</small>
              <h4 className="fw-bold">Zona 1</h4>
            </div>

            <div className="col-md-3 text-center">
              <small className="text-muted">Tarifa de Flete</small>
              <h4 className="fw-bold">$500</h4>
            </div>

            <div className="col-md-3">
              <ul className="list-unstyled mb-0 small">
                <li>Zona 1 (0–30km) <strong>$500</strong></li>
                <li>Zona 2 (31–80km) <strong>$1,200</strong></li>
                <li>Zona 3 (+81km) <strong>$2,500</strong></li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Productos */}
      <div className="card mb-4">
        <div className="card-body text-center py-5">
          <div className="mb-2 text-muted">
            No hay productos agregados todavía.
          </div>
          <button className="btn btn-outline-secondary">
            Seleccionar del catálogo
          </button>
        </div>
      </div>

      {/* Desglose + Resumen */}
      <div className="row g-3">

        {/* Desglose Técnico */}
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header fw-semibold">
              Desglose Técnico y Margen
            </div>
            <div className="card-body">

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded text-center">
                    <small className="text-muted">Costo Ind. Total</small>
                    <h5 className="fw-bold">$0</h5>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="p-3 bg-light rounded text-center">
                    <small className="text-muted">Flete Zona 1</small>
                    <h5 className="fw-bold">$500</h5>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="p-3 bg-light rounded text-center">
                    <small className="text-muted">Margen Real</small>
                    <h5 className="fw-bold">35.0%</h5>
                  </div>
                </div>
              </div>

              <div className="border rounded p-3">
                <label className="form-label fw-semibold">
                  Descuento Comercial (%)
                </label>

                <div className="d-flex gap-2 mb-2">
                  <input className="form-control w-auto" value="0" readOnly />
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary btn-sm">0%</button>
                  <button className="btn btn-outline-secondary btn-sm">3%</button>
                  <button className="btn btn-outline-secondary btn-sm">5%</button>
                  <button className="btn btn-outline-secondary btn-sm">10%</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="col-md-4">
          <div className="card h-100 bg-dark text-white">
            <div className="card-body">

              <h5 className="fw-bold mb-4">Resumen General</h5>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal Productos</span>
                <span>$0</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Flete Calculado</span>
                <span>$500</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal c/ Flete</span>
                <span>$500</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>IVA (16%)</span>
                <span>$80</span>
              </div>

              <hr />

              <div className="text-center mb-3">
                <small className="text-uppercase text-muted">
                  Total Final
                </small>
                <h2 className="fw-bold">$580</h2>
              </div>

              <button className="btn btn-warning w-100 text-white mb-2">
                Guardar y Enviar
              </button>

              <button className="btn btn-outline-light w-100">
                Generar PDF
              </button>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
