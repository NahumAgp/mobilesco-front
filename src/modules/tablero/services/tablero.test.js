import { afterEach, expect, it, vi } from "vitest";

vi.mock("../../../services/api", () => ({ default: vi.fn(), API_BASE_URL: "" }));

import { conectarEventosTablero } from "./tablero";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it("recibe avisos de cambios en una sola conexión autenticada", async () => {
  localStorage.setItem("token", "token-de-prueba");
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("event: conectado\ndata: ahora\n\nevent: cambio\ndata: ahora\n\n"));
    },
  });
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, body: stream });
  vi.stubGlobal("fetch", fetchMock);
  const conectado = vi.fn();
  const cambio = vi.fn();
  let desconectar;
  desconectar = conectarEventosTablero({
    onConnect: conectado,
    onChange: () => { cambio(); desconectar(); },
    onDisconnect: vi.fn(),
  });

  await vi.waitFor(() => expect(cambio).toHaveBeenCalledOnce());
  expect(conectado).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer token-de-prueba");
});
