/**
 * E2E: Create new wallet flow.
 * Welcome → Create → Password → Backup Mnemonic → Main Screen
 */

import { test, expect } from '@playwright/test';

test.describe('Create Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('complete wallet creation flow', async ({ page }) => {
    // Step 1: Welcome screen
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'TON Testnet Wallet' })).toBeVisible();

    // Click "Create New Wallet"
    await page.getByText('Create New Wallet').click();

    // Step 2: Create password screen
    await expect(page.getByText('Step 1 of 2')).toBeVisible();

    // Fill password fields
    const password = 'Test-E2E-Password!42';
    await page.getByPlaceholder('Enter secure password').fill(password);
    await page.getByPlaceholder('Repeat your password').fill(password);

    // Click Continue (first one — in Step 1)
    await page.locator('button', { hasText: 'Continue' }).first().click();

    // Step 3: Mnemonic backup screen — wait for PBKDF2 encryption
    await expect(page.getByText('Step 2 of 2')).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText('Back Up Recovery Phrase')).toBeVisible();

    // Verify 24 words are displayed
    const wordElements = page.locator('.grid .font-mono.text-on-surface');
    await expect(wordElements).toHaveCount(24);

    // Check the "I have saved" checkbox
    await page.getByRole('checkbox').check();

    // Click Continue to complete (Step 2 button)
    await page.locator('button:has-text("Continue"):not([disabled])').last().click();

    // Step 4: Should be on Main Screen
    await expect(page).toHaveURL(/\/main/, { timeout: 10_000 });

    // Verify address is displayed — HighlightedAddress splits into spans
    // Address may be EQ... or UQ... depending on bounceable/non-bounceable format
    await expect(page.locator('.rounded-full').filter({ hasText: /^(EQ|UQ)/ })).toBeVisible({ timeout: 10_000 });
  });

  test('back button returns to welcome from create screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create New Wallet').click();
    await expect(page.getByText('Step 1 of 2')).toBeVisible();

    // Click back
    await page.getByLabel('Go back').click();

    // Should be back on welcome
    await expect(page.getByText('Import Existing Wallet')).toBeVisible();
  });

  test('continue button disabled when passwords do not match', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Create New Wallet').click();

    await page.getByPlaceholder('Enter secure password').fill('StrongPassword1!');
    await page.getByPlaceholder('Repeat your password').fill('DifferentPassword1!');

    // Continue button should be disabled
    const continueBtn = page.locator('button:has-text("Continue")').first();
    await expect(continueBtn).toBeDisabled();
  });
});
