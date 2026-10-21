import { test, expect } from '@playwright/test';
test('etapa 0: cena WebGL e Worker com Durable Object', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /X1.*Basketball/ })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1000);
  expect(await page.locator('canvas').evaluate(canvas => !!(canvas as HTMLCanvasElement).getContext('webgl2'))).toBe(true);
  await page.screenshot({ path: 'artifacts/inicio.png' });
  const health = await request.get('/api/health');
  expect(health.ok()).toBeTruthy();
  expect((await health.json()).ok).toBe(true);
  const room = await request.get('/api/health/room');
  expect((await room.json()).storage).toBe('sqlite');
  expect(errors).toEqual([]);
});

