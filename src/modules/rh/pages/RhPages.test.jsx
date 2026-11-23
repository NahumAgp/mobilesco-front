import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import RhPage from "./RhPage";
import MiRhPage from "./MiRhPage";
import { rhGet, rhPost } from "../services/rh";

vi.mock("../services/rh", () => ({ rhGet: vi.fn(), rhPost: vi.fn(), rhPut: vi.fn() }));
vi.mock("../../auth/services/authService", () => ({
  getUser: vi.fn(() => ({ permissions: ["VIEW_HR", "VIEW_EMPLOYEES", "ACTION_HR_MANAGE", "ACTION_HR_APPROVE"] })),
  hasPermission: vi.fn((_, code) => ["VIEW_HR", "VIEW_EMPLOYEES", "ACTION_HR_MANAGE", "ACTION_HR_APPROVE"].includes(code)),
}));

beforeEach(() => {
  rhGet.mockReset(); rhPost.mockReset();
  rhGet.mockImplementation(path => Promise.resolve(({
    "/resumen": { empleadosActivos: 4, ausenciasPendientes: 0, vacantesAbiertas: 1, evaluacionesBorrador: 0 },
    "/equipo": [], "/expedientes": [], "/tipos-ausencia": [], "/ausencias/pendientes": [], "/feriados": [], "/vacantes": [],
    "/me/tipos-ausencia": [{ id: 1, nombre: "Vacaciones", activo: true }],
    "/me": { empleadoId: 2, nombre: "Ana López", expediente: { puesto: "Auxiliar" },
      contratos: [], saldos: [], ausencias: [], asistencias: [], evaluaciones: [] },
  })[path] ?? []));
  rhPost.mockResolvedValue({ id: 1 });
});
afterEach(cleanup);

describe("Recursos Humanos", () => {
  it("muestra el tablero de gestión separado del directorio de empleados", async () => {
    render(<MemoryRouter><RhPage /></MemoryRouter>);
    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Directorio de empleados" })).toHaveAttribute("href", "/empleados");
    await userEvent.click(screen.getByRole("button", { name: /Reclutamiento/ }));
    expect(screen.getByText("Nueva vacante")).toBeInTheDocument();
  });

  it("permite registrar asistencia sólo para el empleado vinculado", async () => {
    render(<MemoryRouter><MiRhPage /></MemoryRouter>);
    expect(await screen.findByText("Ana López")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Registrar entrada/ }));
    await waitFor(() => expect(rhPost).toHaveBeenCalledWith("/me/asistencia/entrada"));
  });
});
