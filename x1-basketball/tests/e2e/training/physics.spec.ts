import {test,expect} from '@playwright/test';
import {boardDistance} from '../../../packages/shared/src/gameplay/boardCollision';
import {BALL} from '../../../packages/shared/src/gameplay/config';
test('bloco A 3.0: impacto real na tabela, normal e volume de depuração',async({page})=>{
  await page.clock.install();await page.goto('/?physics=1&scenario=board-front');
  await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+10000);
  await page.clock.runFor(300);
  const state=await page.evaluate(()=>(window as any).__X1_TEST__.read());
  expect(state.ball.lastContact).toBe('board');expect(state.ball.velocity.z).toBeGreaterThan(0);
  expect(state.ball.contactNormal.z).toBeGreaterThan(.99);
  await expect(page.locator('#physics-contact')).toContainText('board');
  await page.screenshot({path:'artifacts/v3-tabela-frontal.png'});
});

for(const [label,hold] of [['cedo',500],['ideal',800]] as const) {
  test(`relato de longa distância: soltura ${label}, física sem penetração`,async({page})=>{
    test.setTimeout(120_000);
    await page.clock.install();await page.goto('/?physics=1');
    await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
    await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+10000);
    await page.clock.runFor(100);
    await page.keyboard.down('Space');await page.clock.runFor(hold);await page.keyboard.up('Space');
    let contact=false,captured=false;
    for(let elapsed=0;elapsed<2700;elapsed+=60) {
      await page.clock.runFor(60);
      const state=await page.evaluate(()=>(window as any).__X1_TEST__.read());
      expect(boardDistance(state.ball.position).distance).toBeGreaterThanOrEqual(BALL.radius-.00001);
      contact ||= (state.ball.boardHits??0)>0;
      if(!captured && (label==='cedo'?contact:elapsed>=1680)) {
        await page.screenshot({path:`artifacts/v3-longo-${label}.png`});captured=true;
      }
    }
    const state=await page.evaluate(()=>(window as any).__X1_TEST__.read());
    expect(state.attempts).toBe(1);
    expect(state.makes).toBe(label==='ideal'?1:0);
    if(label==='cedo')expect(contact).toBe(true);
    expect(captured).toBe(true);
  });
}
