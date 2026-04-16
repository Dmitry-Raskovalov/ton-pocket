/**
 * E2E: Import wallet by mnemonic.
 * Welcome → Import → Mnemonic → Password → Main Screen
 */

import { test, expect } from '@playwright/test';

const TEST_MNEMONIC = [
  'art', 'student', 'cycle', 'broken',
  'weather', 'reopen', 'seed', 'usual',
  'topic', 'success', 'rally', 'mimic',
  'stuff', 'kidney', 'once', 'opinion',
  'waste', 'avoid', 'wear', 'capital',
  'crowd', 'identify', 'child', 'weird',
].join(' ');

test.describe('Import Wallet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('import wallet with valid mnemonic', async ({ page }) => {
    // Welcome screen
    await page.goto('/');
    await page.getByText('Import Existing Wallet').click();

    // Step 1: Mnemonic input — real placeholder text from ImportMnemonicScreen
    await expect(page.getByText(/24-word recovery/i)).toBeVisible({ timeout: 5_000 });

    // Type mnemonic into textarea
    await page.getByPlaceholder('Enter words separated by spaces...').fill(TEST_MNEMONIC);

    // Click Continue
    await page.locator('button', { hasText: 'Continue' }).first().click();

    // Step 2: Password screen
    await expect(page.getByPlaceholder('Enter secure password')).toBeVisible({ timeout: 10_000 });

    const password = 'Import-E2E-Password!99';
    await page.getByPlaceholder('Enter secure password').fill(password);
    await page.getByPlaceholder('Repeat your password').fill(password);

    // Click continue/import
    await page.locator('button', { hasText: /continue|import/i }).last().click();

    // Should end up on Main Screen — PBKDF2 is slow
    await expect(page).toHaveURL(/\/main/, { timeout: 120_000 });
  });

  test('back button returns to welcome from import screen', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Import Existing Wallet').click();

    // Click back
    await page.getByLabel('Go back').click();

    // Should be back on welcome
    await expect(page.getByText('Create New Wallet')).toBeVisible();
  });
});
