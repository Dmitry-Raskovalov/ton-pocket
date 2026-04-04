/**
 * file: validate-send.test.ts
 * description: Юнит-тесты для оркестратора валидации validateSend
 * dependencies: validate-send.ts
 * created: 2026-04-01
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSend } from './validate-send';
import type { Warning } from './types';

// --- моки всех зависимостей ---

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

// --- общие константы ---

const VALID_ADDRESS = 'EQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq8Uk';
const RAW_ADDRESS = '0:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234';
const SENDER_KEY = Buffer.alloc(32, 0x01);
const AMOUNT = 1_000_000_000n; // 1 TON
const BALANCE = 2_000_000_000n; // 2 TON

const WARNING_SELF_SEND: Warning = {
  type: 'self_send',
  message: 'Вы отправляете средства на свой собственный адрес.',
  severity: 'warning',
  blocking: false,
};

const WARNING_LOW_REMAINDER: Warning = {
  type: 'low_remainder',
  message: 'После перевода на кошельке останется менее 0.05 TON.',
  severity: 'warning',
  blocking: false,
};

const WARNING_ACCOUNT_UNINIT: Warning = {
  type: 'account_uninit',
  message: 'Аккаунт получателя не инициализирован.',
  severity: 'warning',
  blocking: true,
};

const WARNING_ACCOUNT_FROZEN: Warning = {
  type: 'account_frozen',
  message: 'Аккаунт получателя заморожен.',
  severity: 'error',
  blocking: true,
};

const WARNING_SIMILARITY: Warning = {
  type: 'address_similarity',
  message: 'Адрес похож на адрес из адресной книги.',
  severity: 'warning',
  blocking: true,
};

beforeEach(() => {
  vi.clearAllMocks();

  // По умолчанию: валидный адрес, нет предупреждений
  mockIsValidAddress.mockReturnValue(true);
  mockNormalizeAddress.mockReturnValue(RAW_ADDRESS);
  mockCheckSelfSend.mockReturnValue(null);
  mockCheckAddressSimilarity.mockReturnValue(null);
  mockCheckNewRecipient.mockReturnValue(null);
  mockCheckAccountState.mockResolvedValue([]);
  mockCheckBalance.mockReturnValue([]);
});

describe('validateSend', () => {
  describe('ранний возврат при невалидном адресе', () => {
    it('возвращает isValid=false и единственный error при невалидном адресе', async () => {
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

    it('не вызывает остальные проверки при невалидном адресе', async () => {
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

  describe('чистая отправка без предупреждений', () => {
    it('возвращает isValid=true и пустой массив warnings', async () => {
      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    it('передаёт нормализованный адрес в checkSelfSend и checkAddressSimilarity', async () => {
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

  describe('комбинации предупреждений', () => {
    it('собирает self_send и low_remainder вместе, isValid=true', async () => {
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

    it('address_similarity присутствует в warnings', async () => {
      mockCheckAddressSimilarity.mockReturnValue(WARNING_SIMILARITY);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.warnings.some((w) => w.type === 'address_similarity')).toBe(true);
    });

    it('new_recipient warning включается в массив warnings', async () => {
      mockCheckNewRecipient.mockReturnValue({
        type: 'new_recipient',
        message: 'Первый перевод на этот адрес',
        severity: 'warning',
        blocking: false,
      });

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });
      expect(result.warnings.some((w) => w.type === 'new_recipient')).toBe(true);
      expect(result.isValid).toBe(true); // warning не делает форму невалидной
    });

    it('все 4 типа предупреждений одновременно', async () => {
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
      // similarity — severity critical, не 'error', поэтому isValid=true
      expect(result.isValid).toBe(true);
    });
  });

  describe('устойчивость к ошибкам сети', () => {
    it('при ошибке checkAccountState — пропускает её, остальные выполняются', async () => {
      mockCheckAccountState.mockRejectedValue(new Error('Network error'));
      mockCheckBalance.mockReturnValue([WARNING_LOW_REMAINDER]);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      // balance warning должен присутствовать, account state — нет
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('low_remainder');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isValid определяется только наличием error-severity', () => {
    it('warning severity не влияет на isValid', async () => {
      mockCheckSelfSend.mockReturnValue(WARNING_SELF_SEND);

      const result = await validateSend({
        recipientAddress: VALID_ADDRESS,
        amount: AMOUNT,
        senderBalance: BALANCE,
        senderPublicKey: SENDER_KEY,
      });

      expect(result.isValid).toBe(true);
    });

    it('единственный error делает isValid=false', async () => {
      mockCheckBalance.mockReturnValue([
        {
          type: 'insufficient_balance',
          message: 'Сумма превышает баланс.',
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
