/**
 * file: address-format.ts
 * description: Валидация формата TON-адреса и нормализация к raw-формату
 * dependencies: @ton/core
 * created: 2026-03-31
 */

import { Address } from '@ton/core';

export interface ParsedAddress {
  raw: string;
  bounceable: boolean;
  isTestnet: boolean;
}

/**
 * Проверяет, является ли строка валидным TON-адресом
 * (поддерживаются форматы: bounceable EQ..., non-bounceable UQ..., raw 0:hex...).
 */
export function isValidAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  try {
    // raw format: "0:<64 hex chars>"
    if (input.includes(':')) {
      Address.parseRaw(input);
    } else {
      Address.parseFriendly(input);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Нормализует TON-адрес любого формата к raw-формату "workchain:hex".
 * Бросает ошибку, если адрес невалиден.
 */
export function normalizeAddress(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid address: empty input');
  }
  try {
    let address: Address;
    if (input.includes(':')) {
      address = Address.parseRaw(input);
    } else {
      address = Address.parseFriendly(input).address;
    }
    return address.toRawString();
  } catch {
    throw new Error(`Invalid TON address: ${input}`);
  }
}

/**
 * Парсит TON-адрес любого формата и возвращает объект Address.
 * Бросает ошибку, если адрес невалиден.
 */
export function parseToAddress(input: string): Address {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid address: empty input');
  }
  try {
    return input.includes(':') ? Address.parseRaw(input) : Address.parseFriendly(input).address;
  } catch {
    throw new Error(`Invalid TON address: ${input}`);
  }
}

/**
 * Разбирает TON-адрес и возвращает raw-форму и флаги.
 * Бросает ошибку, если адрес невалиден.
 */
export function parseAddress(input: string): ParsedAddress {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid address: empty input');
  }
  try {
    if (input.includes(':')) {
      const address = Address.parseRaw(input);
      return {
        raw: address.toRawString(),
        bounceable: false,
        isTestnet: false,
      };
    } else {
      const result = Address.parseFriendly(input);
      return {
        raw: result.address.toRawString(),
        bounceable: result.isBounceable,
        isTestnet: result.isTestOnly,
      };
    }
  } catch {
    throw new Error(`Invalid TON address: ${input}`);
  }
}
