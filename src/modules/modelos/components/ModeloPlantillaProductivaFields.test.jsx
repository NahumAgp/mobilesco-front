import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ModeloPlantillaProductivaFields from "./ModeloPlantillaProductivaFields.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { obtenerConjuntos } from "../../insumos/services/conjuntos.js";
import { sincronizarOperacionesVariantes } from "../services/modelos.js";

vi.mock("../../insumos/services/conjuntos.js", () => ({
  obtenerConjuntos: vi.fn().mockResolvedValue([]),
  conjuntoComoInsumo: (item) => ({ ...item, conjunto: true })
}));

vi.mock("../../insumos/services/insumos.js", () => ({
  obtenerInsumos: vi.fn().mockResolvedValue([])
}));

vi.mock("../../operaciones/services/operaciones.js", () => ({
  obtenerOperacionesActivas: vi.fn().mockResolvedValue([])
}));

vi.mock("../services/modelos.js", () => ({
  sincronizarInsumosVariantes: vi.fn(),
  sincronizarMedidasVariantes: vi.fn(),
  sincronizarOperacionesVariantes: vi.fn()
}));

vi.mock("../../auth/services/authService.js", () => ({
  getUser: vi.fn(() => ({
    permisos: ["VIEW_INPUT_SETS", "ACTION_INPUT_SETS_CREATE", "ACTION_INPUT_SETS_EDIT"]
  })),
  hasPermission: vi.fn((user, permission) => user?.permisos?.includes(permission))
}));

vi.mock("../../insumos/pages/InsumoForm.jsx", () => ({
  default: () => <div>Formulario de insumo</div>
}));

vi.mock("../../operaciones/pages/OperacionForm.jsx", () => ({
  default: () => <div>Formulario de operacion</div>
}));

const categoriasBase = [
  {
    id: 101,
    categoriaId: 1,
    nombre: "Primaria",
    insumos: [
      { id: 11, codigo: "INS-11", nombre: "Tornillo", unidadMedida: "pz", cantidad: "2.5" },
      { id: 12, codigo: "INS-12", nombre: "Pintura", unidadMedida: "kg", cantidad: "" }
    ],
    operaciones: []
  },
  {
    id: 102,
    categoriaId: 2,
    nombre: "Secundaria",
    insumos: [
      { id: 13, codigo: "INS-13", nombre: "Tubo", unidadMedida: "m", cantidad: "4" }
    ],
    operaciones: []
  }
];

function renderConEstado(categoriasIniciales = categoriasBase, props = {}) {
  const onCategoriasChange = vi.fn();

  function Wrapper() {
    const [categorias, setCategorias] = useState(categoriasIniciales);
    return (
      <ModeloPlantillaProductivaFields
        {...props}
        categorias={categorias}
        onCategoriasChange={(siguientes) => {
          onCategoriasChange(siguientes);
          setCategorias(siguientes);
        }}
      />
    );
  }

  return {
    user: userEvent.setup(),
    onCategoriasChange,
    ...render(<Wrapper />)
  };
}

function renderConMateriales(categoriasIniciales, materiales) {
  function Wrapper() {
    const [categorias, setCategorias] = useState(categoriasIniciales);
    return (
      <ModeloPlantillaProductivaFields
        categorias={categorias}
        materiales={materiales}
        onCategoriasChange={setCategorias}
      />
    );
  }

  return {
    user: userEvent.setup(),
    ...render(<Wrapper />)
  };
}

describe("ModeloPlantillaProductivaFields", () => {
  beforeEach(() => {
    window.localStorage.clear();
    obtenerConjuntos.mockResolvedValue([]);
    sincronizarOperacionesVariantes.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const abrirCategoria = async (user, nombre = "Primaria") => {
    const categoria = screen.getByRole("region", { name: `Categoria ${nombre}` });
    await user.click(categoria.querySelector("summary"));
    return categoria;
  };

  const abrirInsumosComunes = async (user, categoria) => {
    const material = within(categoria).getByRole("group", { name: "Material Insumos comunes" });
    await user.click(material.querySelector("summary"));
    await user.click(within(material).getAllByText("Insumos", { selector: ".fw-semibold" })[0]);
    return within(categoria).getByRole("region", { name: "Detalle de insumos de Insumos comunes" });
  };

  const abrirOperaciones = async (user, categoria) => {
    const tituloOperaciones = within(categoria).getByText("Operaciones", { selector: ".fw-semibold" });
    const operaciones = tituloOperaciones.closest("details");
    await user.click(operaciones.querySelector("summary"));
    return operaciones;
  };

  it("separa el bloque de insumos de las medidas y conserva sus controles", async () => {
    const { user } = renderConEstado();
    const categorias = [
      await abrirCategoria(user, "Primaria"),
      await abrirCategoria(user, "Secundaria")
    ];
    const bloques = [];
    for (const categoria of categorias) {
      bloques.push(await abrirInsumosComunes(user, categoria));
    }
    expect(bloques).toHaveLength(2);
    for (const bloque of bloques) {
      expect(within(bloque).getByRole("heading", { name: "Insumos" })).toBeInTheDocument();
      expect(within(bloque).getByRole("button", { name: /Nuevo insumo/ })).toBeInTheDocument();
      expect(within(bloque).getByPlaceholderText("Buscar insumo o conjunto...")).toBeInTheDocument();
      expect(within(bloque).getByRole("table")).toBeInTheDocument();
      expect(within(bloque).queryByText("Medidas y pesos")).not.toBeInTheDocument();
    }
  });

  it("muestra el total de insumos de la seccion con desperdicio", async () => {
    const { user } = renderConEstado([
      {
        id: 101,
        categoriaId: 1,
        nombre: "Primaria",
        insumos: [
          { id: 11, codigo: "INS-11", nombre: "Tornillo", unidadMedida: "pz", cantidad: "2", costoCotizacion: "10" },
          { id: 12, codigo: "INS-12", nombre: "Pintura", unidadMedida: "kg", cantidad: "1", desperdicioPorcentaje: "10", costoCotizacion: "5" }
        ],
        operaciones: []
      }
    ]);

    const categoria = await abrirCategoria(user);
    const bloque = await abrirInsumosComunes(user, categoria);
    expect(within(bloque).getByLabelText("Total insumos")).toHaveDisplayValue("$25.50");
    expect(within(bloque).getByText("TOTAL INSUMOS:")).toBeInTheDocument();
  });

  it("muestra el tipo real del insumo en la columna Tipo", async () => {
    const { user } = renderConEstado([
      {
        id: 101,
        categoriaId: 1,
        nombre: "Primaria",
        insumos: [
          { id: 11, codigo: "INS-11", nombre: "Tubo", unidadMedida: "m", tipoInsumo: "HERRERIA", cantidad: "2", costoCotizacion: "10" },
          { id: 12, codigo: "INS-12", nombre: "Madera", unidadMedida: "pz", tipoInsumo: "CARPINTERIA", cantidad: "1", costoCotizacion: "5" }
        ],
        operaciones: []
      }
    ]);

    const categoria = await abrirCategoria(user);
    const bloque = await abrirInsumosComunes(user, categoria);
    expect(within(bloque).getByText("Herreria")).toBeInTheDocument();
    expect(within(bloque).getByText("Carpinteria")).toBeInTheDocument();
    expect(within(bloque).queryByText("Insumo directo")).not.toBeInTheDocument();
  });

  it("muestra minutos, costo por minuto y subtotal de operaciones", async () => {
    const { user } = renderConEstado([
      {
        id: 101,
        categoriaId: 1,
        nombre: "Primaria",
        insumos: [],
        operaciones: [
          {
            id: 31,
            codigo: "CORTE-01",
            nombre: "Corte tubular",
            centroTrabajoNombre: "Cortadora MACC",
            tiempoOperacion: 6,
            costoMinuto: 2.5,
            cantidad: 2
          },
          {
            id: 32,
            codigo: "DOBLEZ-01",
            nombre: "Doblez tubular",
            centroTrabajoNombre: "Dobladora",
            tiempoOperacion: 3,
            costoMinuto: 1.25,
            cantidad: 4
          }
        ]
      }
    ]);

    const categoria = await abrirCategoria(user);
    const operaciones = await abrirOperaciones(user, categoria);
    expect(within(operaciones).getByText("Min/op.")).toBeInTheDocument();
    expect(within(operaciones).getByText("Costo/min")).toBeInTheDocument();
    expect(within(operaciones).getByText("6.00 min")).toBeInTheDocument();
    expect(within(operaciones).getByText("$2.50")).toBeInTheDocument();
    expect(within(operaciones).getByText("$30.00")).toBeInTheDocument();
    expect(within(operaciones).getByText("$15.00")).toBeInTheDocument();
    expect(within(operaciones).getByText("TOTAL MINUTOS:")).toBeInTheDocument();
    expect(within(operaciones).getAllByText("24.00 min")).not.toHaveLength(0);
    expect(within(operaciones).getByText("TOTAL OPERACIONES:")).toBeInTheDocument();
  });

  it("sincroniza operaciones de la categoria con sus variantes", async () => {
    sincronizarOperacionesVariantes.mockResolvedValue({
      productosActualizados: 2,
      operacionesAgregadas: 1,
      operacionesActualizadas: 1,
      operacionesEliminadas: 3
    });

    const { user } = renderConEstado([
      {
        id: 101,
        categoriaId: 1,
        nombre: "Primaria",
        insumos: [],
        operaciones: [
          { id: 31, codigo: "CORTE-01", nombre: "Corte tubular", cantidad: 6 },
          { id: 32, codigo: "DOBLEZ-01", nombre: "Doblez tubular", cantidad: 4 }
        ]
      }
    ], { modeloId: 55 });

    const categoria = screen.getByRole("region", { name: "Categoria Primaria" });
    const botonesSincronizar = within(categoria).getAllByRole("button", { name: /Sincronizar variantes/i });
    await user.click(botonesSincronizar[botonesSincronizar.length - 1]);

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Se reemplazaran las operaciones"));
    expect(sincronizarOperacionesVariantes).toHaveBeenCalledWith(55, 101, [
      { id: 31, cantidad: 6, orden: 1 },
      { id: 32, cantidad: 4, orden: 2 }
    ]);
    expect(await within(categoria).findByText("Operaciones sincronizadas: 2. Agregadas: 1, actualizadas: 1, eliminadas: 3.")).toBeInTheDocument();
  });

  it("muestra el conjunto vigente sin eliminar el insumo directo repetido", async () => {
    obtenerConjuntos.mockResolvedValue([{ id: 50, nombre: "Soldadura", costoCotizacion: 26, unidadMedida: "pz",
      componentes: [{ insumoId: 11, nombre: "Microalambre", cantidad: 1, unidadMedida: "kg" }, { insumoId: 12, nombre: "CO2", cantidad: .6, unidadMedida: "kg" }] }]);
    const { user } = renderConEstado([{ id: 1, nombre: "Primaria", operaciones: [], insumos: [
      { id: 50, nombre: "Soldadura anterior", conjunto: true, cantidad: 10, costoCotizacion: 1 },
      { id: 11, nombre: "Microalambre directo", cantidad: 1 }
    ] }]);
    expect(await screen.findByText("Soldadura")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleccionar insumo Microalambre directo" })).toBeInTheDocument();
    await user.click(screen.getByText("Despiece"));
    expect(screen.getByText("CO2: 6 kg")).toBeInTheDocument();
    expect(screen.getByText("Microalambre: 10 kg")).toBeInTheDocument();
    expect(screen.getByDisplayValue("26")).toHaveAttribute("readonly");
  });

  it("selecciona insumos, los copia y los pega en otra categoria con sus cantidades", async () => {
    const { user } = renderConEstado();

    const primaria = screen.getByRole("region", { name: "Categoria Primaria" });
    const secundaria = screen.getByRole("region", { name: "Categoria Secundaria" });

    await user.click(within(primaria).getByRole("checkbox", { name: "Seleccionar insumo Tornillo" }));

    expect(within(primaria).getByText("1 seleccionados")).toBeInTheDocument();

    await user.click(within(primaria).getByRole("button", { name: /Copiar insumos seleccionados/i }));
    await user.click(within(secundaria).getByRole("button", { name: /Pegar insumos/i }));

    expect(within(secundaria).getByText(/Tornillo/)).toBeInTheDocument();
    expect(within(secundaria).getByDisplayValue("2.5")).toBeInTheDocument();

    const clipboard = JSON.parse(window.localStorage.getItem("mobilesco:modelos:insumosClipboard"));
    expect(clipboard).toEqual([
      expect.objectContaining({ id: 11, codigo: "INS-11", nombre: "Tornillo", cantidad: "2.5" })
    ]);
  });

  it("selecciona todos los insumos de una categoria y omite duplicados al pegar", async () => {
    const { user } = renderConEstado([
      categoriasBase[0],
      {
        ...categoriasBase[1],
        insumos: [
          { id: 11, codigo: "INS-11", nombre: "Tornillo", unidadMedida: "pz", cantidad: "9" }
        ]
      }
    ]);

    const primaria = screen.getByRole("region", { name: "Categoria Primaria" });
    const secundaria = screen.getByRole("region", { name: "Categoria Secundaria" });

    await user.click(within(primaria).getByRole("checkbox", { name: "Seleccionar todos los insumos de Insumos comunes" }));
    expect(within(primaria).getByText("2 seleccionados")).toBeInTheDocument();

    await user.click(within(primaria).getByRole("button", { name: /Copiar insumos seleccionados/i }));
    await user.click(within(secundaria).getByRole("button", { name: /Pegar insumos/i }));

    expect(within(secundaria).getAllByText(/Tornillo/)).toHaveLength(1);
    expect(within(secundaria).getByDisplayValue("9")).toBeInTheDocument();
    expect(within(secundaria).getByText(/Pintura/)).toBeInTheDocument();
    expect(within(secundaria).getByText("1 insumo pegado.")).toBeInTheDocument();
  });

  it("copia y pega operaciones sin habilitar el pegado de insumos", async () => {
    const { user } = renderConEstado([
      {
        id: 101,
        categoriaId: 1,
        nombre: "Primaria",
        insumos: [],
        operaciones: [
          {
            id: 31,
            codigo: "CORTE-01",
            nombre: "Corte tubular",
            centroTrabajoNombre: "Cortadora MACC",
            tiempoOperacion: 0.3,
            costoMinuto: 0.83,
            cantidad: 6
          }
        ]
      },
      {
        id: 102,
        categoriaId: 2,
        nombre: "Secundaria",
        insumos: [],
        operaciones: []
      }
    ]);

    const primaria = await abrirCategoria(user, "Primaria");
    const secundaria = await abrirCategoria(user, "Secundaria");
    const operacionesPrimaria = await abrirOperaciones(user, primaria);

    await user.click(within(operacionesPrimaria).getByRole("checkbox", { name: "Seleccionar operacion Corte tubular" }));
    expect(within(operacionesPrimaria).getByText("1 seleccionadas")).toBeInTheDocument();

    await user.click(within(operacionesPrimaria).getByRole("button", { name: /Copiar operaciones seleccionadas/i }));

    const insumosSecundaria = await abrirInsumosComunes(user, secundaria);
    expect(within(insumosSecundaria).getByRole("button", { name: /Pegar insumos/i })).toBeDisabled();

    const operacionesSecundaria = await abrirOperaciones(user, secundaria);
    await user.click(within(operacionesSecundaria).getByRole("button", { name: /Pegar operaciones/i }));

    expect(within(operacionesSecundaria).getByText(/Corte tubular/)).toBeInTheDocument();
    expect(within(operacionesSecundaria).getByDisplayValue("6")).toBeInTheDocument();
    expect(window.localStorage.getItem("mobilesco:modelos:insumosClipboard")).toBeNull();
    expect(JSON.parse(window.localStorage.getItem("mobilesco:modelos:operacionesClipboard"))).toEqual([
      expect.objectContaining({ id: 31, codigo: "CORTE-01", nombre: "Corte tubular", cantidad: 6 })
    ]);
  });

  it("agrega un insumo solo al material seleccionado", async () => {
    obtenerInsumos.mockResolvedValue([
      { id: 21, codigo: "7500000002286", nombre: "ADHESIVO AMARILLO", unidadMedida: "pz" }
    ]);

    const materiales = [
      { id: 1, codigo: "F", nombre: "FORMICA" },
      { id: 2, codigo: "FD", nombre: "FORMICA DURANGO" },
      { id: 3, codigo: "FM", nombre: "FORMICA MERIDA" }
    ];
    const { user, container } = renderConMateriales([
      { id: 101, categoriaId: 1, nombre: "Primaria", insumos: [], operaciones: [] }
    ], materiales);

    const formica = screen.getByRole("group", { name: "Material [F] FORMICA" });
    const durango = screen.getByRole("group", { name: "Material [FD] FORMICA DURANGO" });

    await user.click(within(formica).getByText("[F] FORMICA"));
    await user.click(await within(formica).findByPlaceholderText("Buscar insumo o conjunto..."));
    await user.click(within(formica).getByRole("button", { name: "[7500000002286] ADHESIVO AMARILLO" }));

    expect(container.querySelectorAll('[data-modelo-material-id="1"][data-modelo-insumo-id="21"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-modelo-material-id="2"][data-modelo-insumo-id="21"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-modelo-material-id="3"][data-modelo-insumo-id="21"]')).toHaveLength(0);

    await user.click(within(durango).getByText("[FD] FORMICA DURANGO"));
    await user.click(await within(durango).findByPlaceholderText("Buscar insumo o conjunto..."));
    await user.click(within(durango).getByRole("button", { name: "[7500000002286] ADHESIVO AMARILLO" }));
    await user.click(within(formica).getByRole("button", { name: "Eliminar ADHESIVO AMARILLO de [F] FORMICA" }));

    expect(container.querySelectorAll('[data-modelo-material-id="1"][data-modelo-insumo-id="21"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-modelo-material-id="2"][data-modelo-insumo-id="21"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-modelo-material-id="3"][data-modelo-insumo-id="21"]')).toHaveLength(0);
  });
});
