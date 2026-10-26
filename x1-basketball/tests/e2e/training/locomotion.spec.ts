import {test,expect} from '@playwright/test';
test('bloco B 3.0: corrida, lateral, recuo e frenagem no rig articulado',async({page})=>{
  await page.clock.install();await page.goto('/');await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+10000);
  const read=()=>page.evaluate(()=>(window as any).__X1_TEST__.read());
  await page.keyboard.down('Shift');await page.keyboard.down('w');await page.clock.runFor(700);
  expect((await read()).player.locomotion.kind).toBe('run');await page.screenshot({path:'artifacts/v3-corrida.png'});
  await page.keyboard.up('w');await page.keyboard.up('Shift');await page.keyboard.down('d');await page.clock.runFor(500);
  expect((await read()).player.locomotion.kind).toBe('strafe');await page.screenshot({path:'artifacts/v3-lateral.png'});
  await page.keyboard.up('d');await page.keyboard.down('s');await page.clock.runFor(500);
  expect((await read()).player.locomotion.kind).toBe('backpedal');await page.screenshot({path:'artifacts/v3-recuo.png'});
  await page.keyboard.up('s');await page.clock.runFor(1200);
  expect((await read()).player.locomotion.kind).toBe('idle');
});
