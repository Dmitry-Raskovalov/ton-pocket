/**
 * E2E: Export mnemonic — password verification, mnemonic display, auto-hide.
 */

import { test, expect } from '@playwright/test';

test.describe('Export Recovery Phrase', () => {
  const PASSWORD = 'Export-E2E-Pass!42';

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

  test('export shows mnemonic after password verification', async ({ page }) => {
    // Navigate to settings
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Click Export
    await page.getByText(/export recovery phrase/i).click();

    // Verify password step
    await expect(page.getByRole('heading', { name: 'Export Recovery Phrase' })).toBeVisible();

    // Enter password
    await page.getByPlaceholder('Enter Password').fill(PASSWORD);

    // Check "I understand" checkbox
    await page.getByRole('checkbox').check();

    // Click "View Phrase"
    await page.getByRole('button', { name: 'View Phrase' }).click();

    // Mnemonic should be displayed
    await expect(page.getByRole('heading', { name: 'Recovery Phrase' })).toBeVisible({ timeout: 120_000 });

    // Copy All button should be visible
    await expect(page.getByText('Copy All')).toBeVisible();

    // Auto-hide countdown should be visible
    await expect(page.getByText(/auto-hiding/i)).toBeVisible();
  });

  test('export shows error on wrong password', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByText(/export recovery phrase/i).click();

    await page.getByPlaceholder('Enter Password').fill('wrong-password');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'View Phrase' }).click();

    // Should show error
    await expect(page.getByText(/incorrect/i)).toBeVisible({ timeout: 10_000 });
  });
});
