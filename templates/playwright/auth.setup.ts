// BuilderKit phase-1 dev-login: produces a signed-in/seeded storageState that
// every spec loads. Wire as a Playwright "setup" project; gitignore .auth/.
import { test as setup, expect } from '@playwright/test';

const STATE = '{{FLOWS_DIR}}/.auth/state.json';

setup('dev-login', async ({ page }) => {
  // --- Variant A: server-auth app -------------------------------------
  // await page.goto('/login');
  // await page.getByTestId('email').fill(process.env.E2E_DEV_LOGIN_EMAIL!);
  // await page.getByTestId('password').fill(process.env.E2E_DEV_LOGIN_PASSWORD!);
  // await page.getByTestId('submit').click();
  // await expect(page.getByTestId('{{BOOT_SENTINEL_TESTID}}')).toBeVisible();

  // --- Variant B: local-first PWA (no server auth) ---------------------
  await page.goto('/');
  await page.evaluate(() => {
    // Seed the known fixture state (phase 2). Import/inline {{SEED_MODULE}}.
    // localStorage.setItem('…', JSON.stringify(fixture));
  });
  await page.reload();

  await page.context().storageState({ path: STATE });
});
