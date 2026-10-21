import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const node = process.execPath;
const children = [
  spawn(node, [root + '/node_modules/wrangler/bin/wrangler.js', 'dev', '--ip', '127.0.0.1', '--port', '8787'], { cwd: root + '/apps/server', stdio: 'inherit', windowsHide: true }),
  spawn(node, [root + '/node_modules/vite/bin/vite.js', '--host', '0.0.0.0'], { cwd: root + '/apps/client', stdio: 'inherit', windowsHide: true }),
];
let stopping = false;
function stop() { if (stopping) return; stopping = true; for (const child of children) child.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
for (const child of children) { child.on('error', (error) => { console.error(error); stop(); process.exitCode = 1; }); child.on('exit', (code) => { if (!stopping) { stop(); process.exitCode = code || 0; } }); }

