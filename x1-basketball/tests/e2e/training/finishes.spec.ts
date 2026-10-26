import {test,expect,type Page} from '@playwright/test';
const read=(page:Page)=>page.evaluate(()=>(window as any).__X1_TEST__.read());
async function prepare(page:Page,url='/'){
  await page.clock.install();await page.goto(url);await expect(page.locator('canvas[data-scene-ready=true]')).toBeVisible();
  await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+10000);await page.clock.runFor(100);
}
test('3.0: enterrada por aproximação real, fases e aterrissagem sem duplicar cesta',async({page})=>{
  test.setTimeout(120000);await prepare(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.keyboard.down('Shift');await page.keyboard.down('w');await page.clock.runFor(1000);await page.keyboard.press('e');
  expect((await read(page)).action).toBe('dunk');
  await page.keyboard.up('w');await page.keyboard.up('Shift');await page.keyboard.press('f');await page.keyboard.press('e');
  await page.clock.runFor(150);expect((await read(page)).attempts).toBe(0);
  await page.screenshot({path:'artifacts/v3-enterrada-impulsao.png'});
  await page.clock.runFor(350);const apex=await read(page);
  expect(apex.player.y).toBeGreaterThan(1);expect(apex.player.hasBall).toBe(true);expect(apex.ball.position.y).toBeGreaterThan(3.17);
  await page.screenshot({path:'artifacts/v3-enterrada-elevacao.png'});
  await page.clock.runFor(150);expect((await read(page)).attempts).toBe(1);
  await page.screenshot({path:'artifacts/v3-enterrada-soltura.png'});
  await page.keyboard.press('r');await page.clock.runFor(900);
  const landed=await read(page);expect(landed.makes).toBe(1);expect(landed.player.y).toBe(0);expect(landed.player.hasBall).toBe(true);
  await page.screenshot({path:'artifacts/v3-enterrada-aterrissagem.png'});expect(errors).toEqual([]);
});
test('3.0: bandeja esquerda usa a tabela durante jogo por teclado',async({page})=>{
  test.setTimeout(120000);await prepare(page,'/?physics=1');
  await page.keyboard.down('a');await page.clock.runFor(300);await page.keyboard.up('a');await page.clock.runFor(300);
  await page.keyboard.down('w');await page.clock.runFor(1200);await page.keyboard.press('e');
  expect((await read(page)).action).toBe('layup');expect((await read(page)).player.action.hand).toBe(-1);
  await page.keyboard.up('w');await page.clock.runFor(400);
  await page.screenshot({path:'artifacts/v3-bandeja-preparacao.png'});
  await page.clock.runFor(600);expect((await read(page)).ball.boardHits).toBeGreaterThan(0);
  await page.screenshot({path:'artifacts/v3-bandeja-tabela.png'});
  await page.clock.runFor(1000);expect((await read(page)).attempts).toBe(1);expect((await read(page)).makes).toBe(1);
});
test('3.0: finta, conflito com Espaço e arremesso curto parado',async({page},testInfo)=>{
  test.setTimeout(120000);await prepare(page);
  await page.keyboard.press('f');await page.clock.runFor(250);
  expect((await read(page)).action).toBe('pump_fake');expect((await read(page)).player.hasBall).toBe(true);
  await page.screenshot({path:'artifacts/v3-finta.png'});
  await page.keyboard.down('Space');await page.keyboard.press('f');await page.keyboard.up('Space');await page.clock.runFor(650);
  expect((await read(page)).attempts).toBe(0);
  await page.keyboard.down('w');await page.clock.runFor(1650);await page.keyboard.up('w');await page.clock.runFor(400);
  await testInfo.attach('antes-do-arremesso-curto',{body:JSON.stringify(await read(page),null,2),contentType:'application/json'});
  await page.keyboard.press('e');expect((await read(page)).action).toBe('short_shot');await page.clock.runFor(250);
  await page.screenshot({path:'artifacts/v3-arremesso-curto.png'});await page.clock.runFor(1400);
  await testInfo.attach('apos-arremesso-curto',{body:JSON.stringify(await read(page),null,2),contentType:'application/json'});
  expect((await read(page)).attempts).toBe(1);expect((await read(page)).makes).toBe(1);
});
