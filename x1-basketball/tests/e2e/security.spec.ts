import { test, expect } from '@playwright/test';

test('Worker rejeita origem, payloads e mensagens malformadas em WebSocket real', async ({ page, request }) => {
  const forbidden=await request.post('/api/rooms',{headers:{Origin:'https://exemplo-invalido.test'},data:{nickname:'Ana'}});
  expect(forbidden.status()).toBe(403);
  const malformed=await request.post('/api/rooms',{headers:{Origin:'http://127.0.0.1:5173'},data:{nickname:'<script>'}});
  expect(malformed.status()).toBe(400);
  const large=await request.post('/api/rooms',{headers:{Origin:'http://127.0.0.1:5173'},data:{nickname:'x'.repeat(1024)}});
  expect(large.status()).toBe(413);
  const created=await request.post('/api/rooms',{headers:{Origin:'http://127.0.0.1:5173'},data:{nickname:'Teste'}});
  expect(created.status()).toBe(201);
  const room=await created.json();
  await page.goto('/');
  const result = await page.evaluate(async (room) => {
    return new Promise<{code:string;close:number}>(resolve=>{
      const ws=new WebSocket(location.origin.replace('http','ws')+'/api/rooms/'+room.code+'/socket');
      let error='';
      ws.onopen=()=>ws.send(JSON.stringify({type:'hello',version:1,nickname:'Teste',token:room.token}));
      ws.onmessage=event=>{
        const m=JSON.parse(event.data);
        if(m.type==='welcome') ws.send(JSON.stringify({type:'input',seq:0,x:1000,z:0,playerId:'p2'}));
        if(m.type==='error') error=m.code;
      };
      ws.onclose=event=>resolve({code:error,close:event.code});
    });
  },room);
  expect(result).toEqual({code:'MESSAGE',close:1008});
});

test('flood de comandos é encerrado pelo servidor', async ({ page, request }) => {
  const created=await request.post('/api/rooms',{headers:{Origin:'http://127.0.0.1:5173'},data:{nickname:'Limite'}});
  const room=await created.json(); await page.goto('/');
  const code=await page.evaluate(async(room)=>new Promise<string>(resolve=>{
    const ws=new WebSocket(location.origin.replace('http','ws')+'/api/rooms/'+room.code+'/socket');
    ws.onopen=()=>ws.send(JSON.stringify({type:'hello',version:1,nickname:'Limite',token:room.token}));
    ws.onmessage=event=>{
      const m=JSON.parse(event.data);
      if(m.type==='welcome') for(let i=0;i<50;i++) ws.send(JSON.stringify({type:'ping',time:i}));
      if(m.type==='error') { resolve(m.code); ws.close(); }
    };
  }),room);
  expect(code).toBe('RATE');
});

