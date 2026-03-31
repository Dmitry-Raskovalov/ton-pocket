/**
 * file: self-send.test.ts
 * description: Юнит-тесты для проверки self-send
 * dependencies: self-send.ts
 * created: 2026-03-31
 */

import { describe, it, expect } from 'vitest';
import { checkSelfSend } from './self-send';

// Публичный ключ отправителя (детерминированный для тестов)
const SENDER_KEY = Buffer.alloc(32, 0x01);

// Адреса кошелька отправителя по версиям (сгенерированы из SENDER_KEY)
const SENDER_V3R2 = '0:da4dece78f93f82707cc1bcc379e47b8d4c7af7ecc35685689f58201a230b390';
const SENDER_V4R2 = '0:f2ff337431e97b308b4671342bd24c442716bb760ffe386bfbfd74e84cc4ca4f';
const SENDER_V5R1 = '0:34e353fe68e7874cf5a8124af5cba7540cd306169f4ad4039151e318174a76c9';

// Адрес другого пользователя
const OTHER_ADDRESS = '0:2d885435e4c641829006c03d637c99ba99acf9a2d04e3de7f2c3d59cdcc56632';

describe('checkSelfSend', () => {
  it('возвращает Warning при совпадении с адресом v4R2', () => {
    const result = checkSelfSend(SENDER_V4R2, SENDER_KEY);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('self_send');
    expect(result?.severity).toBe('warning');
    expect(result?.blocking).toBe(false);
  });

  it('возвращает Warning при совпадении с адресом v3R2', () => {
    const result = checkSelfSend(SENDER_V3R2, SENDER_KEY);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('self_send');
  });

  it('возвращает Warning при совпадении с адресом v5R1', () => {
    const result = checkSelfSend(SENDER_V5R1, SENDER_KEY);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('self_send');
  });

  it('возвращает null при отправке на чужой адрес', () => {
    const result = checkSelfSend(OTHER_ADDRESS, SENDER_KEY);
    expect(result).toBeNull();
  });

  it('возвращает null для другого публичного ключа с тем же адресом', () => {
    const otherKey = Buffer.alloc(32, 0x02);
    // SENDER_V4R2 принадлежит SENDER_KEY, не otherKey
    const result = checkSelfSend(SENDER_V4R2, otherKey);
    expect(result).toBeNull();
  });
});
