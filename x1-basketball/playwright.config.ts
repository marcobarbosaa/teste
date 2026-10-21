import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e/training', timeout: 60_000, workers: 1,
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://127.0.0.1:5183', headless: true, launchOptions: { args: ['--use-angle=swiftshader', '--enable-webgl'] } },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5183', reuseExistingServer: false, timeout: 60_000, env: { X1_DEV_PORT: '5183', VITE_ENABLE_MULTIPLAYER: 'false', VITE_TEST_MODE: 'true' } },
});

