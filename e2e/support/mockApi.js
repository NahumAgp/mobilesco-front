export const adminUser = {
  id: 1,
  email: 'qa@mobilesco.test',
  nombre: 'QA Mobilesco',
  roles: ['ADMIN'],
  permisos: []
};

const compra = {
  id: 101,
  folio: 'CMP-E2E-001',
  fechaCompra: '2026-07-15',
  proveedorId: 8,
  proveedorRazonSocial: 'Proveedor Determinista SA',
  proveedorRfc: 'PDE010101AA1',
  metodoPago: 'CREDITO',
  total: 1160,
  estado: 'PENDIENTE',
  activo: true,
  detalles: []
};

const cuenta = {
  id: 501,
  compraId: compra.id,
  compraFolio: compra.folio,
  fechaCompra: compra.fechaCompra,
  fechaCuenta: '2026-07-15',
  proveedorId: compra.proveedorId,
  proveedorRazonSocial: compra.proveedorRazonSocial,
  proveedorRfc: compra.proveedorRfc,
  montoTotal: 1160,
  montoPagado: 300,
  saldoPendiente: 860,
  estado: 'PARCIAL'
};

const insumo = {
  id: 301,
  codigo: 'INS-E2E-001',
  codigoBarras: 'INS-E2E-001',
  nombre: 'Tablero MDF de prueba',
  tipoInsumo: 'MATERIA_PRIMA',
  ubicacion: 'A-01',
  unidadMedidaSimbolo: 'pza',
  stockActual: 18,
  stockMinimo: 5,
  ultimoCosto: 125,
  costoPromedio: 120,
  costoCotizacion: 130,
  activo: true
};

function pageOf(content) {
  return {
    content,
    number: 0,
    page: 0,
    size: 10,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0
  };
}

export async function installMockApi(page) {
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/auth/login') && request.method() === 'POST') {
      return route.fulfill({
        json: { accessToken: 'e2e-access', refreshToken: 'e2e-refresh' }
      });
    }
    if (path.endsWith('/auth/me')) return route.fulfill({ json: adminUser });
    if (path.includes('/notificaciones')) return route.fulfill({ json: [] });

    if (path.endsWith('/compras')) return route.fulfill({ json: pageOf([compra]) });
    if (path.endsWith('/compras/101')) return route.fulfill({ json: compra });

    if (path.endsWith('/cuentas-por-pagar')) {
      return route.fulfill({
        json: url.searchParams.has('page') ? pageOf([cuenta]) : [cuenta]
      });
    }
    if (path.endsWith('/cuentas-por-pagar/501')) {
      return route.fulfill({ json: { ...cuenta, compra, pagos: [] } });
    }

    if (path.endsWith('/insumos')) return route.fulfill({ json: pageOf([insumo]) });
    if (path.includes('/cotizaciones/productos')) {
      return route.fulfill({
        json: [{
          id: 701,
          sku: 'PROD-E2E-001',
          nombre: 'Mesa escolar determinista',
          costoTotal: 1000,
          cotizable: true,
          faltantes: []
        }]
      });
    }
    if (path.endsWith('/cotizaciones') && request.method() === 'POST') {
      return route.fulfill({
        json: {
          id: 801,
          folio: 'COT-E2E-001',
          clienteNombre: 'Público general',
          total: 2076.92,
          detalles: [],
          subtotalVenta: 1538.46,
          montoDescuento: 0,
          flete: 0,
          ivaPorcentaje: 16,
          montoIva: 246.15
        }
      });
    }
    if (path.includes('/clientes')) return route.fulfill({ json: [] });

    return route.fulfill({ json: [] });
  });
}

export async function seedSession(page, user = adminUser) {
  await page.addInitScript(({ sessionUser }) => {
    localStorage.setItem('token', 'e2e-access');
    localStorage.setItem('refreshToken', 'e2e-refresh');
    localStorage.setItem('user', JSON.stringify(sessionUser));
  }, { sessionUser: user });
}
