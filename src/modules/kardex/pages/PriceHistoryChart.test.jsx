import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PriceHistoryChart from "./PriceHistoryChart";

describe("gráfico de precios históricos", () => {
  it("muestra fecha y precio de cada registro en orden", () => {
    render(<PriceHistoryChart unit="m" prices={[
      { fecha: "2026-10-01T12:00:00", precio: 30, origen: "ENTRADA_MANUAL" },
      { fecha: "2026-11-08T00:00:00", precio: 25, origen: "COMPRA", referencia: "CMP-8" },
    ]} />);

    const detail = screen.getByLabelText("Detalle de precios históricos");
    expect(within(detail).getByText("01/10/2026")).toBeInTheDocument();
    expect(within(detail).getByText("08/11/2026")).toBeInTheDocument();
    expect(within(detail).getByText("$30.00")).toBeInTheDocument();
    expect(within(detail).getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Evolución cronológica del precio" })).toBeInTheDocument();
  });

  it("explica cuando falta historial suficiente", () => {
    render(<PriceHistoryChart prices={[{ fecha: "2026-11-08T00:00:00", precio: 25 }]} />);
    expect(screen.getByText(/no hay suficientes precios registrados/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Evolución cronológica del precio" })).not.toBeInTheDocument();
  });
});
