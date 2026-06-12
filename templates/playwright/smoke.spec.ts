import { test, expect } from '@playwright/test';
import { evidence } from './evidence';

// @smoke — boot sentinel + primary-nav sweep (web twin of the Maestro smoke).
test('smoke: boots signed-in and sweeps primary nav @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('{{BOOT_SENTINEL_TESTID}}')).toBeVisible();
  // {{NAV_SWEEP}} — one getByTestId(...).click() + assert per primary surface
  await evidence(page, 'smoke-home');
});
