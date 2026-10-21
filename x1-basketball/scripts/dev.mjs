import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const node = process.execPath;
const multiplayer = process.argv.includes('--multiplayer');
const port = process.env.X1_DEV_PORT ?? '5173';
const serverPort = process.env.X1_SERVER_PORT ?? '8787';
const origins = process.env.ALLOWED_ORIGINS ?? (port !== '5173' ? 'http://localhost:' + port + ',http://127.0.0.1:' + port + ',http://127.0.0.1:5173' : undefined);
const env = { ...process.env, VITE_ENABLE_MULTIPLAYER: multiplayer ? 'true' : (process.env.VITE_ENABLE_MULTIPLAYER ?? 'false') };
const children = [
  ...(multiplayer ? [spawn(node, [root + '/node_modules/wrangler/bin/wrangler.js', 'dev', '--ip', '127.0.0.1', '--port', serverPort, ...(origins ? ['--var', 'ALLOWED_ORIGINS:' + origins] : [])], { cwd: root + '/apps/server', stdio: 'inherit', windowsHide: true })] : []),
  spawn(node, [root + '/node_modules/vite/bin/vite.js', '--host', '0.0.0.0', '--port', port], { cwd: root + '/apps/client', stdio: 'inherit', windowsHide: true, env }),
];
let stopping = false;
function stop() { if (stopping) return; stopping = true; for (const child of children) child.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
for (const child of children) { child.on('error', (error) => { console.error(error); stop(); process.exitCode = 1; }); child.on('exit', (code) => { if (!stopping) { stop(); process.exitCode = code || 0; } }); }

