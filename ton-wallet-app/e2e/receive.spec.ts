/**
 * E2E: Receive screen — QR code and address copy.
 */

import { test, expect } from '@playwright/test';

test.describe('Receive Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Create wallet
    await page.getByText('Create New Wallet').click();
    const password = process.env.E2E_TEST_PASSWORD ?? 'E2E-Test-Password!';
    await page.getByPlaceholder('Enter secure password').fill(password);
    await page.getByPlaceholder('Repeat your password').fill(password);
    await page.locator('button', { hasText: 'Continue' }).first().click();

    // Wait for mnemonic step
    await expect(page.getByText('Step 2 of 2')).toBeVisible({ timeout: 120_000 });
    await page.getByRole('checkbox').check();
    await page.locator('button:has-text("Continue"):not([disabled])').last().click();

    // Wait for main screen
    await expect(page).toHaveURL(/\/main/, { timeout: 10_000 });
  });

  test('shows QR code and address on receive screen', async ({ page }) => {
    // Navigate to receive using the button
    await page.getByRole('button', { name: 'Receive' }).click();

    await expect(page).toHaveURL(/\/receive/);

    // QR code should be visible (rendered as SVG by qrcode.react)
    const qrSvg = page.locator('svg');
    await expect(qrSvg.first()).toBeVisible({ timeout: 5_000 });

    // Address should be displayed — HighlightedAddress splits text into spans
    // Address may be EQ... or UQ... depending on bounceable/non-bounceable format
    await expect(page.getByText(/^(EQ|UQ)/)).toBeVisible({ timeout: 5_000 });

    // Copy button should exist
    await expect(page.getByText('Copy')).toBeVisible();
  });
});
