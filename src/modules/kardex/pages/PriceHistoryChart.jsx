import "./PriceHistoryChart.css";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2,
});

function formatDate(value) {
  const date = String(value || "").slice(0, 10);
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export default function PriceHistoryChart({ prices, loading, error, unit }) {
  const valid = (prices || []).filter((item) => Number.isFinite(Number(item.precio)) && Number(item.precio) > 0);
  const width = Math.min(12000, Math.max(640, valid.length * 76));
  const height = 260;
  const values = valid.map((item) => Number(item.precio));
  const low = valid.length ? Math.min(...values) : 0;
  const high = valid.length ? Math.max(...values) : 0;
  const margin = Math.max((high - low) * 0.1, high * 0.05, 1);
  const min = Math.max(0, low - margin);
  const max = high + margin;
  const x = (index) => 70 + (index * (width - 100)) / Math.max(valid.length - 1, 1);
  const y = (value) => 20 + ((max - value) * 190) / (max - min);
  const points = valid.map((item, index) => `${x(index)},${y(Number(item.precio))}`).join(" ");

  return (
    <section className="price-history-card" aria-label="Precios históricos del insumo">
      <div className="price-history-header">
        <div><h2>Precios históricos</h2><p>Precio por {unit || "unidad de consumo"} en compras y entradas con precio.</p></div>
        {valid.length >= 2 && <span>{valid.length} registros</span>}
      </div>
      {loading ? <p className="price-history-state" role="status">Cargando precios...</p>
        : error ? <p className="price-history-state text-danger" role="alert">{error}</p>
          : valid.length < 2 ? <p className="price-history-state">Aún no hay suficientes precios registrados para mostrar su evolución.</p>
            : <>
              <div className="price-history-scroll">
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución cronológica del precio">
                  {[0, 0.5, 1].map((ratio) => {
                    const axisY = 20 + ratio * 190;
                    return <g key={ratio}>
                      <line x1="70" x2={width - 30} y1={axisY} y2={axisY} stroke="#dce7df" strokeDasharray="4 4" />
                      <text x="62" y={axisY + 4} textAnchor="end" className="price-history-axis">{money.format(max - ratio * (max - min))}</text>
                    </g>;
                  })}
                  <polyline points={points} fill="none" stroke="#287558" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                  {valid.map((item, index) => <g key={`${item.fecha}-${item.referencia || ""}-${index}`}>
                    <circle cx={x(index)} cy={y(Number(item.precio))} r="6" fill="#fff" stroke="#287558" strokeWidth="3">
                      <title>{formatDate(item.fecha)} · {money.format(item.precio)} · {item.origen}</title>
                    </circle>
                    {(index === 0 || index === valid.length - 1) && <text x={x(index)} y="242" textAnchor="middle" className="price-history-axis">{formatDate(item.fecha)}</text>}
                  </g>)}
                </svg>
              </div>
              <div className="price-history-records" aria-label="Detalle de precios históricos">
                {valid.map((item, index) => <div key={`${item.fecha}-${item.referencia || ""}-${index}`}>
                  <time dateTime={item.fecha}>{formatDate(item.fecha)}</time>
                  <strong>{money.format(item.precio)}</strong>
                  <span>{item.origen === "COMPRA" ? "Compra" : item.origen}{item.referencia ? ` · ${item.referencia}` : ""}</span>
                </div>)}
              </div>
            </>}
    </section>
  );
}
