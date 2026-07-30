import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../../../services/api', () => ({ default: request }));

import {
  buscarProductosCotizables,
  cambiarEstadoCotizacion,
  crearCotizacion
} from './cotizaciones';

describe('servicio de cotizaciones', () => {
  beforeEach(() => request.mockReset());

  it('codifica la búsqueda de productos', async () => {
    request.mockResolvedValue([]);
    await buscarProductosCotizables('silla nogal');
    expect(request).toHaveBeenCalledWith('/api/v1/cotizaciones/productos?busqueda=silla+nogal');
  });

  it('envía la cotización como JSON', async () => {
    request.mockResolvedValue({ id: 5 });
    const payload = { clienteId: 2, detalles: [{ productoId: 9, cantidad: 1 }] };
    await crearCotizacion(payload);
    expect(request).toHaveBeenCalledWith('/api/v1/cotizaciones', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });

  it('cambia el estado mediante PATCH', async () => {
    request.mockResolvedValue({ estado: 'ACEPTADA' });
    await cambiarEstadoCotizacion(5, 'ACEPTADA');
    expect(request).toHaveBeenCalledWith('/api/v1/cotizaciones/5/estado?estado=ACEPTADA', {
      method: 'PATCH'
    });
  });
});
