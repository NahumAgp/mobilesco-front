import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerNotificaciones, marcarNotificacionLeida } = vi.hoisted(() => ({
  obtenerNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
}));
vi.mock("../services/notificaciones", () => ({ obtenerNotificaciones, marcarNotificacionLeida }));

import DailyNotificationsModal from "./DailyNotificationsModal";

function mount(userId) {
  return render(<MemoryRouter><DailyNotificationsModal userId={userId} /></MemoryRouter>);
}

describe("notificaciones diarias", () => {
  beforeEach(() => {
    localStorage.clear();
    obtenerNotificaciones.mockReset();
    marcarNotificacionLeida.mockReset();
    obtenerNotificaciones.mockResolvedValue({ content: [{ id: 1, titulo: "Compra nueva", mensaje: "Revisar compra", leida: false }] });
  });
  afterEach(() => localStorage.clear());

  it("abre una vez por usuario y no marca avisos como leídos al mostrarlos", async () => {
    const first = mount("usuario-1");
    expect(await screen.findByText("Compra nueva")).toBeInTheDocument();
    expect(marcarNotificacionLeida).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar notificaciones" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    first.unmount();

    const second = mount("usuario-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    second.unmount();

    localStorage.setItem("mobilesco:daily-notifications:usuario-1", "2000-01-01");
    const nextDay = mount("usuario-1");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    nextDay.unmount();

    mount("usuario-2");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
