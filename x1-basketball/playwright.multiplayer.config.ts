import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', timeout: 45_000, workers: 1,
  testMatch: ['base.spec.ts', 'multiplayer.spec.ts', 'security.spec.ts'],
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://127.0.0.1:5184', headless: true, launchOptions: { args: ['--use-angle=swiftshader', '--enable-webgl'] } },
  webServer: { command: 'npm run dev:multiplayer', url: 'http://127.0.0.1:5184', reuseExistingServer: false, timeout: 60_000, env: { X1_DEV_PORT: '5184', X1_SERVER_PORT: '8887' } },
});

