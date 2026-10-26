import { test, expect } from '@playwright/test';
for (const size of [{ width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  test('bloco B: quadra ocupa a janela em ' + size.width + 'x' + size.height, async ({ page }) => {
    await page.setViewportSize(size);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
    const bounds = await page.locator('canvas').boundingBox();
    expect(bounds?.width).toBe(size.width); expect(bounds?.height).toBe(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'artifacts/v3-quadra-' + size.width + '.png' });
    expect(errors).toEqual([]);
  });
}
test('bloco B: limite lateral e enquadramento depois de deslocar', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.keyboard.down('Shift'); await page.keyboard.down('d');
  await expect.poll(() => page.evaluate(() => (window as any).__X1_TEST__.read().player.x), {timeout:20_000}).toBeGreaterThan(7);
  await page.keyboard.up('d'); await page.keyboard.up('Shift');
  const p = await page.evaluate(() => (window as any).__X1_TEST__.read().player);
  expect(p.x).toBeLessThanOrEqual(7.16);
  await page.screenshot({ path: 'artifacts/treino-lateral.png' });
});
test('perda real de contexto WebGL informa a falha e permite remontar', async ({ page }) => {
  await page.goto('/'); await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext());
  await expect(page.getByRole('alert')).toContainText('contexto gráfico');
  await page.getByRole('button', {name:'Reabrir a quadra'}).click();
  await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
});
test('falha JavaScript de montagem mostra o erro real e permite remontar', async ({ page }) => {
  // Injeta falha somente no módulo servido a este teste; nenhum gatilho entra no produto.
  await page.route('**/src/scene/Player.tsx*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const injected = source.replace(/function Player\(([^)]*)\) \{/, '$& if (!window.__ALLOW_SCENE__) throw new Error("Falha de montagem de teste");');
    expect(injected).not.toBe(source);
    await route.fulfill({ response, body: injected });
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('falha ao montar a cena');
  await expect(page.getByRole('alert')).not.toContainText('aceleração');
  await page.getByText('Detalhes do erro').click();
  await expect(page.getByRole('alert')).toContainText('Falha de montagem de teste');
  await page.evaluate(() => { (window as any).__ALLOW_SCENE__ = true; });
  await page.getByRole('button', { name: 'Reabrir a quadra' }).click();
  await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
});

