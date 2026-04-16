/**
 * E2E: Unlock flow — after wallet exists, reload shows unlock modal.
 * Enter correct password → Main Screen.
 */

import { test, expect } from '@playwright/test';

test.describe('Unlock Flow', () => {
  const PASSWORD = 'Unlock-E2E-Pass!42';

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

  test('unlock modal appears after page reload', async ({ page }) => {
    await page.reload();

    // Unlock modal should appear
    await expect(page.getByRole('heading', { name: 'Unlock Wallet' })).toBeVisible({ timeout: 5_000 });
  });

  test('correct password unlocks wallet', async ({ page }) => {
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Unlock Wallet' })).toBeVisible({ timeout: 5_000 });

    // Enter correct password
    await page.getByPlaceholder(/password/i).fill(PASSWORD);

    // Click unlock button
    await page.getByRole('button', { name: 'Unlock' }).click();

    // Should navigate to main
    await expect(page).toHaveURL(/\/main/, { timeout: 10_000 });
  });

  test('wrong password shows error', async ({ page }) => {
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Unlock Wallet' })).toBeVisible({ timeout: 5_000 });

    await page.getByPlaceholder(/password/i).fill('wrong-password');
    await page.getByRole('button', { name: 'Unlock' }).click();

    // Should show error
    await expect(page.getByText(/incorrect|wrong/i)).toBeVisible({ timeout: 5_000 });
  });
});
