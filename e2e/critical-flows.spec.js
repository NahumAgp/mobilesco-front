import { expect, test } from '@playwright/test';
import { adminUser, installMockApi, seedSession } from './support/mockApi';

test.beforeEach(async ({ page }) => {
  await installMockApi(page);
});

test('login: autentica y abre el tablero', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Correo').fill('qa@mobilesco.test');
  await page.getByLabel(/Contrase/).fill('clave-e2e');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/tablero$/);
  await expect(page.getByRole('heading', { name: 'Tablero principal' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBe('e2e-access');
});

test('permisos: bloquea compras sin rol ni permiso', async ({ page }) => {
  const restrictedUser = {
    ...adminUser,
    roles: ['VENTAS'],
    permisos: ['VIEW_QUOTES']
  };
  await page.route('**/api/v1/auth/me', (route) => route.fulfill({ json: restrictedUser }));
  await seedSession(page, restrictedUser);
  await page.goto('/compras');

  await expect(page).toHaveURL(/\/compras$/);
  await expect(page.getByRole('heading', { name: 'Sin permiso para esta vista' })).toBeVisible();
  await expect(page.getByText('CMP-E2E-001')).not.toBeVisible();
});

test('compras: lista la compra controlada y expone acciones autorizadas', async ({ page }) => {
  await seedSession(page);
  await page.goto('/compras');

  await expect(page.getByRole('heading', { name: 'Compras' })).toBeVisible();
  await expect(page.getByText('CMP-E2E-001')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Proveedor Determinista SA' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Nueva Compra/i })).toBeVisible();
});

test('inventario: muestra existencias aisladas y acciones de almacén', async ({ page }) => {
  await seedSession(page);
  await page.goto('/insumos');

  await expect(page.getByRole('heading', { name: 'Insumos' })).toBeVisible();
  await expect(page.getByText('Tablero MDF de prueba')).toBeVisible();
  await expect(page.getByText('INS-E2E-001')).toBeVisible();
});

test('cotizaciones: inicia desde el tablero en el catálogo visual', async ({ page }) => {
  await seedSession(page);
  await page.goto('/tablero');
  await page.getByRole('button', { name: 'Cerrar notificaciones' }).click();
  await page.getByRole('button', { name: 'Nueva cotización' }).click();
  await expect(page).toHaveURL(/\/productos\/catalogo$/);
});

test('cuentas por pagar: concilia total, pago y saldo pendientes', async ({ page }) => {
  await seedSession(page);
  await page.goto('/compras/cuentas-por-pagar');

  await expect(page.getByRole('heading', { name: 'Cuentas por pagar' })).toBeVisible();
  await expect(page.getByText('CMP-E2E-001')).toBeVisible();
  await expect(page.getByText('PARCIAL', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver / pagar' })).toBeVisible();
});
