import { expect, test } from '@playwright/test';
import { installMockApi, seedSession } from './support/mockApi';

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`conjuntos: crea, edita y reabre el despiece a ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await installMockApi(page);
    await seedSession(page);
    const componentes = [
      { id: 11, nombre: 'Microalambre', unidadMedidaId: 1, unidadMedidaSimbolo: 'kg', costoCotizacion: 20 },
      { id: 12, nombre: 'CO2', unidadMedidaId: 1, unidadMedidaSimbolo: 'kg', costoCotizacion: 10 }
    ];
    let conjuntos = [];
    await page.route('**/api/v1/insumos**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes('/conjuntos')) {
        if (route.request().method() === 'GET') return route.fulfill({ json: conjuntos });
        const data = route.request().postDataJSON();
        const saved = { ...data, id: 50, version: (data.version ?? -1) + 1, unidadMedida: 'pz',
          componentes: data.componentes.map((c) => ({ ...c, nombre: componentes.find((i) => i.id === c.insumoId).nombre,
            unidadMedida: 'kg', costoCotizacion: componentes.find((i) => i.id === c.insumoId).costoCotizacion })) };
        saved.costoCotizacion = saved.componentes.reduce((total, c) => total + c.cantidad * c.costoCotizacion, 0);
        conjuntos = [saved];
        return route.fulfill({ json: saved });
      }
      return route.fulfill({ json: { content: componentes, totalElements: 2, totalPages: 1 } });
    });
    await page.route('**/api/v1/unidades-medida**', (route) => route.fulfill({ json: [{ id: 1, nombre: 'Pieza', simbolo: 'pz', estado: true }] }));
    await page.goto('/insumos');
    await page.getByRole('button', { name: 'Conjuntos de insumos', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Conjuntos de insumos' });
    await dialog.getByRole('button', { name: 'Nuevo conjunto', exact: true }).click();
    await dialog.getByLabel('Nombre', { exact: true }).fill('Soldadura');
    await dialog.getByRole('combobox', { name: 'Unidad', exact: true }).selectOption('1');
    await dialog.getByPlaceholder('Agregar insumo...').click();
    await dialog.getByRole('button', { name: 'Microalambre', exact: true }).click();
    await dialog.getByPlaceholder('Agregar insumo...').click();
    await dialog.getByRole('button', { name: 'CO2', exact: true }).click();
    await dialog.getByLabel('Cantidad de CO2', { exact: true }).fill('0.6');
    await dialog.getByRole('button', { name: 'Crear conjunto', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Guardar para todos los modelos', exact: true })).toBeVisible();
    await expect(dialog.getByText('$26.00', { exact: true })).toBeVisible();
    await dialog.getByLabel('Cantidad de Microalambre', { exact: true }).fill('2');
    await dialog.getByRole('button', { name: 'Guardar para todos los modelos', exact: true }).click();
    await expect(dialog.getByText('$46.00', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Guardar para todos los modelos', exact: true })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Cerrar conjuntos' }).click();
    await page.getByRole('button', { name: 'Conjuntos de insumos', exact: true }).click();
    await dialog.getByRole('button', { name: 'Soldadura 2 insumos' }).click();
    await expect(dialog.getByLabel('Cantidad de Microalambre')).toHaveValue('2');
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.screenshot({ path: `test-results/conjuntos-${viewport.width}.png` });
  });
}
