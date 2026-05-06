/**
 * file: validate-send.test.ts
 * description: Unit tests for validateSend orchestrator
 * dependencies: validate-send.ts
 * created: 2026-04-01
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSend } from './validate-send';
import type { Warning } from './types';

// --- mocks for all dependencies ---

const mockIsValidAddress = vi.fn();
const mockNormalizeAddress = vi.fn();
vi.mock('./address-format', () => ({
  isValidAddress: (...args: unknown[]) => mockIsValidAddress(...args),
  normalizeAddress: (...args: unknown[]) => mockNormalizeAddress(...args),
}));

const mockCheckSelfSend = vi.fn();
vi.mock('./self-send', () => ({
  checkSelfSend: (...args: unknown[]) => mockCheckSelfSend(...args),
}));

const mockCheckAccountState = vi.fn();
vi.mock('./account-state', () => ({
  checkAccountState: (...args: unknown[]) => mockCheckAccountState(...args),
}));

const mockCheckBalance = vi.fn();
vi.mock('./balance-check', () => ({
  checkBalance: (...args: unknown[]) => mockCheckBalance(...args),
}));

const mockCheckAddressSimilarity = vi.fn();
vi.mock('./address-similarity', () => ({
  checkAddressSimilarity: (...args: unknown[]) => mockCheckAddressSimilarity(...args),
}));

const mockCheckNewRecipient = vi.fn();
vi.mock('./check-new-recipient', () => ({
  checkNewRecipient: (...args: unknown[]) => mockCheckNewRecipient(...args),
}));

// --- common constants ---

const VALID_ADDRESS = 'EQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq8Uk';
const RAW_ADDRESS = '0:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
const SENDER_KEY = Buffer.alloc(32, 0x01);
const AMOUNT = 1_000_000_000n; // 1 TON
const BALANCE = 2_000_000_000n; // 2 TON

const WARNING_SELF_SEND: Warning = {
  type: 'self_send',
  message: 'You are sending funds to your own address.',
  severity: 'warning',
  blocking: false,
};

const WARNING_LOW_REMAINDER: Warning = {
  type: 'low_remainder',
  message: 'After transfer, wallet balance will be less than 0.05 TON.',
  severity: 'warning',
  blocking: false,
};

const WARNING_ACCOUNT_UNINIT: Warning = {
  type: 'account_uninit',
  message: 'Recipient account is not initialized.',
  severity: 'warning',
  blocking: true,
};

const WARNING_ACCOUNT_FROZEN: Warning = {
  type: 'account_frozen',
  message: 'Recipient account is frozen.',
  severity: 'error',
  blocking: true,
};

const WARNING_SIMILARITY: Warning = {
  type: 'address_similarity',
  message: 'Address is similar to address in address book.',
  severity: 'warning',
  blocking: true,
};

beforeEach(() => {
  vi.clearAllMocks();

  // By default: valid address, no warnings
  mockIsValidAddress.mockReturnValue(true);
  mockNormalizeAddress.mockReturnValue(RAW_ADDRESS);
  mockCheckSelfSend.mockReturnValue(null);
  mockCheckAddressSimilarity.mockReturnValue(null);
  mockCheckNewRecipient.mockReturnValue(null);
  mockCheckAccountState.mockResolvedValue([]);
  mockCheckBalance.mockReturnValue([]);
});

describe('validateSend', () => {
  describe('early return on invalid address', () => {
    it('returns isValid=false and single error on invalid address', async () => {
      mockIsValidAddress.mockReturnValue(false);

      const result = await validateSend({
        recipientAddress: 'not-a-valid-address',
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('invalid_address_format');
      expect(result.warnings[0].severity).toBe('error');
      expect(result.warnings[0].blocking).toBe(true);
    });

    it('does not call other checks on invalid address', async () => {
      mockIsValidAddress.mockReturnValue(false);

      await validateSend({
        recipientAddress: 'bad',
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(mockCheckSelfSend).not.toHaveBeenCalled();
      expect(mockCheckAddressSimilarity).not.toHaveBeenCalled();
      expect(mockCheckAccountState).not.toHaveBeenCalled();
      expect(mockCheckBalance).not.toHaveBeenCalled();
    });
  });

  describe('clean send without warnings', () => {
    it('returns isValid=true and empty warnings array', async () => {
      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('passes normalized address to checkSelfSend and checkAddressSimilarity', async () => {
      await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(mockNormalizeAddress).toHaveBeenCalledWith(VALID_ADDRESS);
      expect(mockCheckSelfSend).toHaveBeenCalledWith(RAW_ADDRESS, SENDER_KEY);
      expect(mockCheckAddressSimilarity).toHaveBeenCalledWith(RAW_ADDRESS);
    });
  });

  describe('warning combinations', () => {
    it('collects self_send and low_remainder together, isValid=true', async () => {
      mockCheckSelfSend.mockReturnValue(WARNING_SELF_SEND);
      mockCheckBalance.mockReturnValue([WARNING_LOW_REMAINDER]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings.map((w) => w.type)).toEqual(
        expect.arrayContaining(['self_send', 'low_remainder']),
      );
    });

    it('account_uninit + low_remainder → isValid=true, 2 warnings', async () => {
      mockCheckAccountState.mockResolvedValue([WARNING_ACCOUNT_UNINIT]);
      mockCheckBalance.mockReturnValue([WARNING_LOW_REMAINDER]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it('account_frozen → isValid=false (severity=error)', async () => {
      mockCheckAccountState.mockResolvedValue([WARNING_ACCOUNT_FROZEN]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('account_frozen');
    });

    it('address_similarity is present in warnings', async () => {
      mockCheckAddressSimilarity.mockReturnValue(WARNING_SIMILARITY);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.warnings.some((w) => w.type === 'address_similarity')).toBe(true);
    });

    it('new_recipient warning is included in warnings array', async () => {
      mockCheckNewRecipient.mockReturnValue({
        type: 'new_recipient',
        message: 'First transfer to this address',
        severity: 'warning',
        blocking: true,
      });

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });
      expect(result.warnings.some((w) => w.type === 'new_recipient')).toBe(true);
      expect(result.isValid).toBe(true); // warning does not make form invalid
    });

    it('all 4 types of warnings at once', async () => {
      mockCheckSelfSend.mockReturnValue(WARNING_SELF_SEND);
      mockCheckAddressSimilarity.mockReturnValue(WARNING_SIMILARITY);
      mockCheckAccountState.mockResolvedValue([WARNING_ACCOUNT_UNINIT]);
      mockCheckBalance.mockReturnValue([WARNING_LOW_REMAINDER]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.warnings).toHaveLength(4);
      // similarity — severity critical, not 'error', so isValid=true
      expect(result.isValid).toBe(true);
    });
  });

  describe('network error resilience', () => {
    it('on checkAccountState error — skips it, others execute', async () => {
      mockCheckAccountState.mockRejectedValue(new Error('Network error'));
      mockCheckBalance.mockReturnValue([WARNING_LOW_REMAINDER]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      // balance warning should be present, account state — not
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('low_remainder');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isValid determined only by error-severity presence', () => {
    it('warning severity does not affect isValid', async () => {
      mockCheckSelfSend.mockReturnValue(WARNING_SELF_SEND);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
    });

    it('single error makes isValid=false', async () => {
      mockCheckBalance.mockReturnValue([
        {
          type: 'insufficient_balance',
          message: 'Amount exceeds balance.',
          severity: 'error',
          blocking: true,
        } satisfies Warning,
      ]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(false);
    });
  });
});
