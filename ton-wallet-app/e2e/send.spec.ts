/**
 * E2E: Send transaction flow.
 * Main → Send → Fill form → Validate
 */

import { test, expect } from '@playwright/test';

test.describe('Send Transaction', () => {
  const PASSWORD = 'Send-E2E-Pass!42';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Create wallet
    await page.getByText('Create New Wallet').click();
    await page.getByPlaceholder('Enter secure password').fill(PASSWORD);
    await page.getByPlaceholder('Repeat your password').fill(PASSWORD);
    await page.locator('button', { hasText: 'Continue' }).first().click();

    await expect(page.getByText('Step 2 of 2')).toBeVisible({ timeout: 120_000 });
    await page.getByRole('checkbox').check();
    await page.locator('button:has-text("Continue"):not([disabled])').last().click();

    await expect(page).toHaveURL(/\/main/, { timeout: 10_000 });
  });

  test('send screen validates recipient address', async ({ page }) => {
    // Navigate to send using the button
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page).toHaveURL(/\/send/);

    // Enter invalid address (placeholder is "UQ...")
    await page.getByPlaceholder('UQ...').fill('invalid-address');
    await page.getByPlaceholder('0.00').fill('0.1');

    // Should show validation error — message may be in Russian or English
    await expect(page.getByText(/invalid|невалидный/i)).toBeVisible({ timeout: 5_000 });
  });

  test('send screen shows no format error for valid address', async ({ page }) => {
    await page.getByRole('button', { name: 'Send' }).click();

    // Enter valid-looking address (testnet format)
    await page.getByPlaceholder('UQ...').fill('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
    await page.getByPlaceholder('0.00').fill('0.01');

    // Wait a moment for validation
    await page.waitForTimeout(1000);

    // The form should not show "invalid address" error
    await expect(page.getByText(/invalid address/i)).not.toBeVisible();
  });

  test('back button returns to main from send screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByLabel('Go back').click();
    await expect(page).toHaveURL(/\/main/);
  });
});
