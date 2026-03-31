/**
 * file: account-state.test.ts
 * description: Юнит-тесты для проверки состояния аккаунта получателя
 * dependencies: account-state.ts
 * created: 2026-03-31
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAccountState } from './account-state';

vi.mock('../ton/client', () => ({
  getTonClient: vi.fn(),
}));

import { getTonClient } from '../ton/client';

const mockGetContractState = vi.fn();
const mockClient = { getContractState: mockGetContractState };

// Адреса для тестов (из address-format.test.ts)
const BOUNCEABLE = 'EQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq8Uk';
const NON_BOUNCEABLE = 'UQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq5jh';

beforeEach(() => {
  vi.mocked(getTonClient).mockReturnValue(mockClient as never);
  mockGetContractState.mockReset();
});

describe('checkAccountState', () => {
  it('возвращает пустой массив для active аккаунта', async () => {
    mockGetContractState.mockResolvedValue({ state: 'active' });
    const result = await checkAccountState(NON_BOUNCEABLE);
    expect(result).toEqual([]);
  });

  it('возвращает [account_uninit] для uninit + non-bounceable адреса', async () => {
    mockGetContractState.mockResolvedValue({ state: 'uninit' });
    const result = await checkAccountState(NON_BOUNCEABLE);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('account_uninit');
    expect(result[0].severity).toBe('warning');
    expect(result[0].blocking).toBe(true);
  });

  it('возвращает [account_uninit, bounce_risk] для uninit + bounceable адреса', async () => {
    mockGetContractState.mockResolvedValue({ state: 'uninit' });
    const result = await checkAccountState(BOUNCEABLE);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('account_uninit');
    expect(result[1].type).toBe('bounce_risk');
    expect(result[1].severity).toBe('error');
    expect(result[1].blocking).toBe(true);
  });

  it('возвращает [account_frozen] для frozen аккаунта', async () => {
    mockGetContractState.mockResolvedValue({ state: 'frozen' });
    const result = await checkAccountState(NON_BOUNCEABLE);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('account_frozen');
    expect(result[0].severity).toBe('error');
    expect(result[0].blocking).toBe(true);
  });

  it('возвращает пустой массив при ошибке сети', async () => {
    mockGetContractState.mockRejectedValue(new Error('network error'));
    const result = await checkAccountState(NON_BOUNCEABLE);
    expect(result).toEqual([]);
  });

  it('возвращает пустой массив при невалидном адресе', async () => {
    const result = await checkAccountState('not-an-address');
    expect(result).toEqual([]);
  });
});
