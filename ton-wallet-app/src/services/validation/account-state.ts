/**
 * file: account-state.ts
 * description: Проверка состояния аккаунта получателя (uninit, active, frozen)
 * dependencies: client.ts, address-format.ts, types.ts
 * created: 2026-03-31
 */

import { Address } from '@ton/core';
import { getTonClient } from '../ton/client';
import { parseAddress } from './address-format';
import type { Warning } from './types';

/**
 * Проверяет состояние аккаунта получателя и возвращает массив предупреждений.
 * При ошибке сети возвращает пустой массив — не блокируем отправку.
 *
 * @param recipientAddress - адрес получателя в любом формате (friendly или raw)
 */
export async function checkAccountState(recipientAddress: string): Promise<Warning[]> {
  let parsed: ReturnType<typeof parseAddress>;
  try {
    parsed = parseAddress(recipientAddress);
  } catch {
    return [];
  }

  let state: { state: string };
  try {
    const client = getTonClient();
    const address = Address.parseRaw(parsed.raw);
    state = await client.getContractState(address);
  } catch {
    // Ошибка сети — пропускаем проверку
    return [];
  }

  const warnings: Warning[] = [];

  if (state.state === 'frozen') {
    warnings.push({
      type: 'account_frozen',
      message: 'Аккаунт получателя заморожен. Перевод может быть потерян.',
      severity: 'error',
      blocking: true,
    });
    return warnings;
  }

  if (state.state === 'uninit') {
    if (parsed.bounceable) {
      // Bounceable + uninit: funds will bounce back — error, blocking
      warnings.push({
        type: 'account_uninit',
        message: 'Аккаунт получателя не инициализирован. Средства вернутся отправителю.',
        severity: 'error',
        blocking: true,
      });
      warnings.push({
        type: 'bounce_risk',
        message: 'Адрес bounceable — средства вернутся отправителю, если аккаунт не инициализирован.',
        severity: 'error',
        blocking: true,
      });
    } else {
      // Non-bounceable + uninit: funds will be credited — inform, don't block
      warnings.push({
        type: 'account_uninit',
        message: 'Аккаунт получателя не инициализирован. Средства будут зачислены, но получатель не сможет ими воспользоваться до активации.',
        severity: 'warning',
        blocking: false,
      });
    }
  }

  return warnings;
}
