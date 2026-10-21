import { test, expect, type Page } from '@playwright/test';
import type { RoomSnapshot } from '@x1/shared';

function observe(page: Page) {
  let latest: RoomSnapshot | undefined;
  const errors: string[] = [];
  let sawDisconnect = false;
  page.on('pageerror', e => errors.push(e.message));
  page.on('websocket', ws => ws.on('framereceived', frame => {
    try { const data=JSON.parse(frame.payload.toString()); if(data.type==='snapshot') { latest=data.state; if(latest?.phase==='waiting' && latest.players.length===2 && latest.players.some(p=>!p.connected)) sawDisconnect=true; } } catch { /* not JSON */ }
  }));
  return { get state() { return latest; }, get sawDisconnect() { return sawDisconnect; }, errors };
}
test('dois navegadores independentes: sala, controles isolados, sincronização e reconexão', async ({ browser }) => {
  test.setTimeout(90_000);
  const options = { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 900 } };
  const a = await browser.newContext(options), b = await browser.newContext(options), c = await browser.newContext(options);
  const pa=await a.newPage(), pb=await b.newPage(), pc=await c.newPage();
  await pb.addInitScript(() => {
    const Native = window.WebSocket;
    (window as unknown as { testSockets: WebSocket[] }).testSockets = [];
    window.WebSocket = class extends Native {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        if (String(url).includes('/socket')) (window as unknown as { testSockets: WebSocket[] }).testSockets.push(this);
      }
    };
  });
  const oa=observe(pa), ob=observe(pb);
  await pa.goto('/'); await pa.getByLabel('Como você joga por aqui?').fill('Ana');
  await pa.getByRole('button',{name:'Criar minha quadra'}).click();
  await expect(pa.getByTestId('room-code')).toHaveText(/^[A-F0-9]{12}$/);
  const code=(await pa.getByTestId('room-code').textContent())!;
  await pb.goto('/?sala='+code); await pb.getByLabel('Como você joga por aqui?').fill('Beto');
  await pb.getByRole('button',{name:'Entrar na quadra'}).click();
  await expect(pa.getByText('Beto',{exact:true})).toBeVisible();
  await expect(pb.getByText('Ana',{exact:true})).toBeVisible();
  await pa.getByRole('button',{name:'Estou pronto'}).click();
  await pb.getByRole('button',{name:'Estou pronto'}).click();
  await expect(pa.getByText('Movimentação liberada')).toBeVisible();
  await expect(pb.getByText('Movimentação liberada')).toBeVisible();
  const initialA=oa.state!.players.find(p=>p.id==='p1')!;
  const initialB=oa.state!.players.find(p=>p.id==='p2')!;
  await pa.bringToFront(); await pa.keyboard.down('w');
  await expect.poll(()=>oa.state!.players.find(p=>p.id==='p1')!.z).toBeLessThan(initialA.z-1);
  await pa.keyboard.up('w');
  await pa.waitForTimeout(350);
  expect(oa.state!.players.find(p=>p.id==='p2')!.z).toBe(initialB.z);
  await expect.poll(()=>Math.abs(oa.state!.players[0].z-ob.state!.players[0].z)).toBeLessThan(.01);
  const beforeB=ob.state!.players[1].x;
  await pb.bringToFront(); await pb.keyboard.down('d');
  await expect.poll(()=>ob.state!.players[1].x).toBeGreaterThan(beforeB+.8);
  await pb.keyboard.up('d'); await pb.waitForTimeout(350);
  await expect.poll(()=>Math.abs(oa.state!.players[1].x-ob.state!.players[1].x)).toBeLessThan(.01);
  await pa.screenshot({path:'artifacts/jogador-ana.png'});
  await pb.screenshot({path:'artifacts/jogador-beto.png'});
  // Terceiro navegador não pode ocupar vaga nem afetar a sessão.
  await pc.goto('/?sala='+code); await pc.getByLabel('Como você joga por aqui?').fill('Carlos');
  await pc.getByRole('button',{name:'Entrar na quadra'}).click();
  await expect(pc.getByRole('alert')).toContainText('dois jogadores', {timeout:15_000});
  await pb.evaluate(() => (window as unknown as { testSockets: WebSocket[] }).testSockets[0].close(4000, 'Interrupção de teste'));
  await expect.poll(()=>oa.sawDisconnect,{timeout:15_000}).toBe(true);
  await expect(pb.getByRole('button',{name:'Estou pronto'})).toBeVisible({timeout:15_000});
  await expect.poll(()=>oa.state?.players.filter(p=>p.connected).length).toBe(2);
  await pa.getByRole('button',{name:'Estou pronto'}).click(); await pb.getByRole('button',{name:'Estou pronto'}).click();
  await expect(pb.getByText('Movimentação liberada')).toBeVisible();
  await pb.reload();
  await expect(pb.getByRole('button',{name:'Estou pronto'})).toBeVisible();
  await expect.poll(()=>oa.state?.players.filter(p=>p.connected).length).toBe(2);
  expect(ob.state?.players[1].nickname).toBe('Beto');
  expect(oa.errors).toEqual([]); expect(ob.errors).toEqual([]);
  await a.close(); await b.close(); await c.close();
});

