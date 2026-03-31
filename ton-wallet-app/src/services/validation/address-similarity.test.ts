/**
 * file: address-similarity.test.ts
 * description: Юнит-тесты для проверки похожих адресов (clipboard poisoning)
 * dependencies: address-similarity.ts
 * created: 2026-04-01
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkAddressSimilarity } from './address-similarity';
import type { AddressBookEntry, SimilarAddressMatch } from '../address-book/types';

// Мокаем addressBook singleton
const mockFindSimilar = vi.fn();

vi.mock('../address-book/address-book', () => ({
  AddressBook: vi.fn(),
  addressBook: {
    findSimilar: (...args: unknown[]) => mockFindSimilar(...args),
  },
}));

// Тестовые данные
const ENTRY_ABC: AddressBookEntry = {
  address: '0:ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890',
  displayAddress: 'EQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq8Uk',
  label: 'Alice',
  lastUsed: Date.now(),
  usageCount: 3,
  source: 'sent',
};

const ENTRY_XYZ: AddressBookEntry = {
  address: '0:XYZDEF1234567890XYZDEF1234567890XYZDEF1234567890XYZDEF1234567890',
  displayAddress: 'UQDrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq9Vk',
  label: 'Bob',
  lastUsed: Date.now(),
  usageCount: 1,
  source: 'received',
};

beforeEach(() => {
  mockFindSimilar.mockReset();
});

describe('checkAddressSimilarity', () => {
  it('возвращает null если нет похожих адресов', () => {
    mockFindSimilar.mockReturnValue([]);
    const result = checkAddressSimilarity('0:0000000000000000000000000000000000000000000000000000000000000000');
    expect(result).toBeNull();
    expect(mockFindSimilar).toHaveBeenCalledWith('0:0000000000000000000000000000000000000000000000000000000000000000');
  });

  it('возвращает critical warning при совпадении prefix', () => {
    const match: SimilarAddressMatch = {
      entry: ENTRY_ABC,
      matchType: 'prefix',
      matchedChars: 'ABCDEF',
    };
    mockFindSimilar.mockReturnValue([match]);

    const result = checkAddressSimilarity('0:ABCDEF9999999999');

    expect(result).not.toBeNull();
    expect(result!.type).toBe('address_similarity');
    expect(result!.severity).toBe('critical');
    expect(result!.blocking).toBe(true);
    expect(result!.message).toContain('Alice');
    expect(result!.message).toContain('начало');
  });

  it('возвращает critical warning при совпадении suffix', () => {
    const match: SimilarAddressMatch = {
      entry: ENTRY_XYZ,
      matchType: 'suffix',
      matchedChars: '567890',
    };
    mockFindSimilar.mockReturnValue([match]);

    const result = checkAddressSimilarity('0:999999567890');

    expect(result).not.toBeNull();
    expect(result!.type).toBe('address_similarity');
    expect(result!.message).toContain('Bob');
    expect(result!.message).toContain('конец');
  });

  it('возвращает critical warning при совпадении и prefix и suffix (matchType=both)', () => {
    const match: SimilarAddressMatch = {
      entry: ENTRY_ABC,
      matchType: 'both',
      matchedChars: 'ABCDEF...567890',
    };
    mockFindSimilar.mockReturnValue([match]);

    const result = checkAddressSimilarity('0:ABCDEF...567890');

    expect(result).not.toBeNull();
    expect(result!.message).toContain('начало и конец');
  });

  it('включает все похожие адреса в сообщение', () => {
    const matches: SimilarAddressMatch[] = [
      { entry: ENTRY_ABC, matchType: 'prefix', matchedChars: 'ABCDEF' },
      { entry: ENTRY_XYZ, matchType: 'suffix', matchedChars: '567890' },
    ];
    mockFindSimilar.mockReturnValue(matches);

    const result = checkAddressSimilarity('0:ABCDEF1234567890');

    expect(result).not.toBeNull();
    expect(result!.message).toContain('Alice');
    expect(result!.message).toContain('Bob');
    expect(result!.message).toContain('адреса');
  });

  it('не возвращает warning при полном совпадении (findSimilar фильтрует)', () => {
    // addressBook.findSimilar уже исключает полное совпадение
    mockFindSimilar.mockReturnValue([]);

    const result = checkAddressSimilarity(ENTRY_ABC.address);
    expect(result).toBeNull();
  });

  it('использует displayAddress если label не задан', () => {
    const entryNoLabel: AddressBookEntry = {
      ...ENTRY_ABC,
      label: undefined,
    };
    const match: SimilarAddressMatch = {
      entry: entryNoLabel,
      matchType: 'prefix',
      matchedChars: 'ABCDEF',
    };
    mockFindSimilar.mockReturnValue([match]);

    const result = checkAddressSimilarity('0:ABCDEF999');

    expect(result!.message).toContain(entryNoLabel.displayAddress);
  });
});
