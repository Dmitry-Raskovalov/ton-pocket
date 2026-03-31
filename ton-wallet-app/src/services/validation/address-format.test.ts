/**
 * file: address-format.test.ts
 * description: Юнит-тесты для валидации и нормализации TON-адресов
 * dependencies: address-format.ts
 * created: 2026-03-31
 */

import { describe, it, expect } from 'vitest';
import { isValidAddress, normalizeAddress, parseAddress } from './address-format';

// Тестовые адреса одного и того же кошелька в разных форматах
// Workchain 0, hash 0xabab...ab (32 байта)
const RAW = '0:abababababababababababababababababababababababababababababababab';
const BOUNCEABLE = 'EQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq8Uk';
const NON_BOUNCEABLE = 'UQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq5jh';
const TESTNET_BOUNCEABLE = 'kQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq36u';

describe('isValidAddress', () => {
  it('валидирует bounceable адрес', () => {
    expect(isValidAddress(BOUNCEABLE)).toBe(true);
  });

  it('валидирует non-bounceable адрес', () => {
    expect(isValidAddress(NON_BOUNCEABLE)).toBe(true);
  });

  it('валидирует testnet bounceable адрес', () => {
    expect(isValidAddress(TESTNET_BOUNCEABLE)).toBe(true);
  });

  it('валидирует raw адрес', () => {
    expect(isValidAddress(RAW)).toBe(true);
  });

  it('отклоняет пустую строку', () => {
    expect(isValidAddress('')).toBe(false);
  });

  it('отклоняет произвольную строку', () => {
    expect(isValidAddress('not-an-address')).toBe(false);
  });

  it('отклоняет частично валидный адрес', () => {
    expect(isValidAddress('EQCrq6ur')).toBe(false);
  });

  it('отклоняет строку с пробелами', () => {
    expect(isValidAddress('  ')).toBe(false);
  });
});

describe('normalizeAddress', () => {
  it('нормализует bounceable к raw', () => {
    expect(normalizeAddress(BOUNCEABLE)).toBe(RAW);
  });

  it('нормализует non-bounceable к raw', () => {
    expect(normalizeAddress(NON_BOUNCEABLE)).toBe(RAW);
  });

  it('нормализует testnet bounceable к raw', () => {
    expect(normalizeAddress(TESTNET_BOUNCEABLE)).toBe(RAW);
  });

  it('нормализует raw к raw (идемпотентно)', () => {
    expect(normalizeAddress(RAW)).toBe(RAW);
  });

  it('все три формата нормализуются к одному raw', () => {
    const r1 = normalizeAddress(BOUNCEABLE);
    const r2 = normalizeAddress(NON_BOUNCEABLE);
    const r3 = normalizeAddress(RAW);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it('бросает ошибку для невалидного адреса', () => {
    expect(() => normalizeAddress('invalid')).toThrow();
  });

  it('бросает ошибку для пустой строки', () => {
    expect(() => normalizeAddress('')).toThrow();
  });
});

describe('parseAddress', () => {
  it('корректно определяет bounceable флаг для EQ... адреса', () => {
    const result = parseAddress(BOUNCEABLE);
    expect(result.raw).toBe(RAW);
    expect(result.bounceable).toBe(true);
    expect(result.isTestnet).toBe(false);
  });

  it('корректно определяет non-bounceable флаг для UQ... адреса', () => {
    const result = parseAddress(NON_BOUNCEABLE);
    expect(result.raw).toBe(RAW);
    expect(result.bounceable).toBe(false);
    expect(result.isTestnet).toBe(false);
  });

  it('корректно определяет testnet флаг для kQ... адреса', () => {
    const result = parseAddress(TESTNET_BOUNCEABLE);
    expect(result.raw).toBe(RAW);
    expect(result.bounceable).toBe(true);
    expect(result.isTestnet).toBe(true);
  });

  it('парсит raw адрес без ошибок', () => {
    const result = parseAddress(RAW);
    expect(result.raw).toBe(RAW);
    expect(result.bounceable).toBe(false);
    expect(result.isTestnet).toBe(false);
  });

  it('бросает ошибку для невалидного адреса', () => {
    expect(() => parseAddress('garbage')).toThrow();
  });
});
