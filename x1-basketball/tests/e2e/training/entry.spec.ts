import { test, expect } from '@playwright/test';

test('bloco A: entrada direta, sem API/sala, um personagem e movimento local', async ({ page }) => {
  const errors: string[] = [], sockets: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('websocket', socket => sockets.push(socket.url()));
  page.on('request', request => { if (request.url().includes('/api/')) requests.push(request.url()); });
  await page.addInitScript(() => sessionStorage.setItem('x1-session-v1', JSON.stringify({ code: 'AABBCCDDEEFF', nickname: 'Anterior', token: 'a'.repeat(64) })));
  await page.goto('/?sala=AABBCCDDEEFF');
  await expect(page.getByText('Modo treino', { exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar minha quadra' })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Sua sala' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => !!(window as any).__X1_TEST__)).toBe(true);
  const initial = await page.evaluate(() => (window as any).__X1_TEST__.read().player);
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => (window as any).__X1_TEST__.read().player.z)).toBeLessThan(initial.z - .5);
  await page.keyboard.up('w');
  expect(sockets.filter(url => url.includes('/socket'))).toEqual([]);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'artifacts/solo-bloco-a.png' });
});

