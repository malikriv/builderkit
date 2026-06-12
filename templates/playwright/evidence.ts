// Named screenshot evidence — the proof artifact attached to Linear/PRs.
// Naming convention: <R-id>-<step>, e.g. evidence(page, 'R3-after-save').
import type { Page } from '@playwright/test';

export async function evidence(page: Page, name: string) {
  await page.screenshot({ path: `{{EVIDENCE_DIR}}/${name}.png` });
}
