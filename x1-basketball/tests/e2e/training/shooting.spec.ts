import { test, expect, type Page } from '@playwright/test';

const read = (page: Page) => page.evaluate(() => (window as any).__X1_TEST__.read());
async function prepare(page: Page) {
  // Instalar antes de React/Three evita trocar a origem de performance.now no meio da cena.
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  // Use o tempo da própria página; Node e o relógio virtual podem divergir sob carga.
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 10_000);
  await page.clock.runFor(100);
}
test('bloco C: arremesso real, cesta única, recuperação e novo treino', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width:1366, height:768 });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await prepare(page);
  await page.keyboard.down('Space'); await page.clock.runFor(800);
  await expect(page.getByRole('meter')).toBeVisible();
  expect((await read(page)).meter).toBeGreaterThan(.69);
  expect((await read(page)).meter).toBeLessThan(.75);
  await expect.poll(async () => Number(await page.getByRole('meter').getAttribute('aria-valuenow'))).toBeGreaterThan(65);
  await page.screenshot({ path: 'artifacts/treino-medidor.png' });
  await page.keyboard.up('Space');
  await page.clock.runFor(500);
  const flight = await read(page);
  expect(flight.ball.mode).toBe('flight'); expect(flight.ball.position.y).toBeGreaterThan(4);
  await expect(page.getByTestId('attempts')).toHaveText('1');
  await page.screenshot({ path: 'artifacts/treino-arremesso.png' });
  await page.clock.runFor(1800);
  expect((await read(page)).makes).toBe(1);
  await expect(page.getByTestId('makes')).toHaveText('1');
  await expect(page.getByTestId('percentage')).toHaveText('100%');
  await page.screenshot({ path: 'artifacts/treino-cesta.png' });
  await page.clock.runFor(500); expect((await read(page)).makes).toBe(1);
  await page.keyboard.press('r'); await page.clock.runFor(100);
  expect((await read(page)).player.hasBall).toBe(true);
  await page.keyboard.down('Space'); await page.clock.runFor(200); await page.keyboard.up('Space');
  await page.clock.runFor(2400);
  await expect(page.getByTestId('attempts')).toHaveText('2');
  await expect(page.getByTestId('makes')).toHaveText('1');
  await expect(page.getByTestId('percentage')).toHaveText('50%');
  await page.getByRole('button', { name: 'Reiniciar treino' }).click();
  await expect(page.getByTestId('attempts')).toHaveText('0');
  await expect(page.getByTestId('makes')).toHaveText('0');
  expect((await read(page)).ball.mode).toBe('held'); expect(errors).toEqual([]);
});
test('medidor acompanha a carga com relógio real do navegador', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.keyboard.down('Space');
  await expect.poll(async () => Number(await page.getByRole('meter').getAttribute('aria-valuenow'))).toBeGreaterThan(65);
  await page.keyboard.up('Space');
  await expect(page.getByTestId('attempts')).toHaveText('1');
  await expect(page.getByRole('meter')).toHaveCount(0);
  await page.keyboard.press('r');
  expect((await read(page)).player.hasBall).toBe(true);
});
test('drible, perda de foco e Fullscreen API', async ({ page }) => {
  test.setTimeout(90_000);
  await prepare(page);
  await page.keyboard.down('w'); await page.clock.runFor(350);
  const first = await read(page);
  expect(first.ball.mode).toBe('dribbling'); expect(first.player.z).toBeLessThan(1);
  await page.clock.runFor(100);
  expect((await read(page)).ball.position.y).not.toBe(first.ball.position.y);
  await page.screenshot({ path: 'artifacts/treino-drible.png' });
  await page.keyboard.up('w'); await page.clock.runFor(300);
  await page.keyboard.down('Space'); await page.clock.runFor(200);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('Space'); await page.clock.runFor(100);
  expect((await read(page)).attempts).toBe(0); expect((await read(page)).charging).toBe(false);
  await page.getByRole('button', {name:'Tela cheia', exact:true}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await page.getByRole('button', {name:'Sair da tela cheia'}).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});
