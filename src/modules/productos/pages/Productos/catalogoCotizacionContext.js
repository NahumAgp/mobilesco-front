import { createContext, useContext } from "react";

export const CatalogoCotizacionContext = createContext(null);

export function useCatalogoCotizacion() {
  const context = useContext(CatalogoCotizacionContext);
  if (!context) throw new Error("useCatalogoCotizacion debe usarse dentro de CatalogoCotizacionProvider");
  return context;
}
