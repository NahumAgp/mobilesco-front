import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../../../services/api', () => ({ default: request }));

import {
  crearCompra,
  confirmarBorradorCompra,
  obtenerCuentasPorPagar,
  registrarPagoCuentaPorPagar
} from './compras';

describe('servicio de compras y cuentas por pagar', () => {
  beforeEach(() => request.mockReset());

  it('crea una compra con el contrato esperado', async () => {
    request.mockResolvedValue({ id: 1 });
    const payload = { proveedorId: 4, detalles: [{ insumoId: 8, cantidad: 2 }] };
    await crearCompra(payload);
    expect(request).toHaveBeenCalledWith('/api/v1/compras', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  });

  it('confirma una compra en borrador', async () => {
    request.mockResolvedValue({ estado: 'PENDIENTE' });
    await confirmarBorradorCompra(21);
    expect(request).toHaveBeenCalledWith('/api/v1/compras/21/confirmar-borrador', {
      method: 'POST'
    });
  });

  it('serializa filtros omitiendo valores vacíos', async () => {
    request.mockResolvedValue([]);
    await obtenerCuentasPorPagar({ estado: 'PENDIENTE', busqueda: '', page: 0, size: 10 });
    expect(request).toHaveBeenCalledWith('/api/v1/cuentas-por-pagar?estado=PENDIENTE&page=0&size=10');
  });

  it('registra un pago sobre la cuenta indicada', async () => {
    request.mockResolvedValue({ estado: 'PARCIAL' });
    const pago = { monto: 250, metodoPago: 'TRANSFERENCIA' };
    await registrarPagoCuentaPorPagar(12, pago);
    expect(request).toHaveBeenCalledWith('/api/v1/cuentas-por-pagar/12/pagos', {
      method: 'POST',
      body: JSON.stringify(pago)
    });
  });
});
