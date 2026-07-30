import { describe, expect, it } from 'vitest';
import {
  puedeAjustarStockManual,
  puedeGestionarCatalogoInsumos,
  puedeGestionarCostosInsumos
} from './costosPermisos';

describe('permisos de inventario', () => {
  it('separa catálogo, costos y ajustes para un perfil de almacén', () => {
    const user = { roles: ['ALMACEN'], permisos: [] };
    expect(puedeGestionarCatalogoInsumos(user)).toBe(true);
    expect(puedeAjustarStockManual(user)).toBe(true);
    expect(puedeGestionarCostosInsumos(user)).toBe(false);
  });

  it('habilita costos y ajustes mediante permisos granulares', () => {
    const user = {
      roles: ['VENTAS'],
      permisos: ['ACTION_INSUMOS_COSTS', 'ACTION_STOCK_ADJUSTMENTS']
    };
    expect(puedeGestionarCostosInsumos(user)).toBe(true);
    expect(puedeAjustarStockManual(user)).toBe(true);
    expect(puedeGestionarCatalogoInsumos(user)).toBe(false);
  });

  it('maneja usuarios ausentes sin conceder acceso', () => {
    expect(puedeGestionarCostosInsumos(null)).toBe(false);
    expect(puedeGestionarCatalogoInsumos(undefined)).toBe(false);
    expect(puedeAjustarStockManual({})).toBe(false);
  });
});
