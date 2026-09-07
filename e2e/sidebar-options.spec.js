import { expect, test } from '@playwright/test';
import { installMockApi, seedSession } from './support/mockApi';

for (const width of [1440, 820]) {
  test(`todas las opciones incluye la barra y agrupa mosaicos a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await installMockApi(page);
    await seedSession(page);
    await page.goto('/insumos');
    const accesos = page.getByRole('navigation', { name: 'Accesos mas usados' });
    await expect(accesos.getByRole('link').first()).toBeVisible();
    const rutasBarra = await accesos.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    const abrir = page.getByRole('button', { name: 'Mostrar todas las opciones' });
    await abrir.click();
    const panel = page.getByRole('navigation', { name: 'Todas las opciones', exact: true });
    await expect(panel).toBeVisible();
    for (const ruta of rutasBarra) await expect(panel.locator(`a[href="${ruta}"]`)).toHaveCount(1);
    await expect(panel.getByRole('region', { name: 'Productos', exact: true }).getByRole('link', { name: 'Modelos', exact: true })).toHaveCount(1);
    const grid = panel.locator('.sidebar-more-grid').first();
    expect(await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBeGreaterThan(1);
    expect(await panel.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await panel.screenshot({ path: `test-results/sidebar-options-${width}.png` });
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(abrir).toBeFocused();
    await abrir.click();
    await panel.getByRole('link', { name: 'Insumos', exact: true }).click();
    await expect(panel).toHaveCount(0);
    await expect(page).toHaveURL(/\/insumos$/);
  });
}
