import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModeloPlantillaProductivaFields from "./ModeloPlantillaProductivaFields.jsx";
import { obtenerInsumos } from "../../insumos/services/insumos.js";
import { obtenerConjuntos } from "../../insumos/services/conjuntos.js";

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

function renderConEstado(categoriasIniciales = categoriasBase) {
  const onCategoriasChange = vi.fn();

  function Wrapper() {
    const [categorias, setCategorias] = useState(categoriasIniciales);
    return (
      <ModeloPlantillaProductivaFields
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
  });

  it("separa el bloque de insumos de las medidas y conserva sus controles", async () => {
    renderConEstado();
    const bloques = await screen.findAllByRole("region", { name: /^Insumos de / });
    expect(bloques).toHaveLength(2);
    for (const bloque of bloques) {
      expect(within(bloque).getByRole("heading", { name: "Insumos" })).toBeInTheDocument();
      expect(within(bloque).getByRole("button", { name: /Nuevo insumo/ })).toBeInTheDocument();
      expect(within(bloque).getByPlaceholderText("Buscar insumo o conjunto...")).toBeInTheDocument();
      expect(within(bloque).getByRole("table")).toBeInTheDocument();
      expect(within(bloque).queryByText("Medidas y pesos")).not.toBeInTheDocument();
    }
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

    await user.click(within(primaria).getByRole("button", { name: /Copiar seleccionados/i }));
    await user.click(within(secundaria).getByRole("button", { name: /Pegar/i }));

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

    await user.click(within(primaria).getByRole("button", { name: /Copiar seleccionados/i }));
    await user.click(within(secundaria).getByRole("button", { name: /Pegar/i }));

    expect(within(secundaria).getAllByText(/Tornillo/)).toHaveLength(1);
    expect(within(secundaria).getByDisplayValue("9")).toBeInTheDocument();
    expect(within(secundaria).getByText(/Pintura/)).toBeInTheDocument();
    expect(within(secundaria).getByText("1 insumo pegado.")).toBeInTheDocument();
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

    await user.click(await within(formica).findByPlaceholderText("Buscar insumo o conjunto..."));
    await user.click(within(formica).getByRole("button", { name: "[7500000002286] ADHESIVO AMARILLO" }));

    expect(container.querySelectorAll('[data-modelo-material-id="1"][data-modelo-insumo-id="21"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-modelo-material-id="2"][data-modelo-insumo-id="21"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-modelo-material-id="3"][data-modelo-insumo-id="21"]')).toHaveLength(0);

    await user.click(await within(durango).findByPlaceholderText("Buscar insumo o conjunto..."));
    await user.click(within(durango).getByRole("button", { name: "[7500000002286] ADHESIVO AMARILLO" }));
    await user.click(within(formica).getByRole("button", { name: "Eliminar ADHESIVO AMARILLO de [F] FORMICA" }));

    expect(container.querySelectorAll('[data-modelo-material-id="1"][data-modelo-insumo-id="21"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-modelo-material-id="2"][data-modelo-insumo-id="21"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-modelo-material-id="3"][data-modelo-insumo-id="21"]')).toHaveLength(0);
  });
});
