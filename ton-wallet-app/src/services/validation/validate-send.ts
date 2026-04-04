/**
 * file: validate-send.ts
 * description: Оркестратор валидации — единая точка входа для проверок перед отправкой
 * dependencies: address-format.ts, self-send.ts, account-state.ts, balance-check.ts,
 *               address-similarity.ts, types.ts
 * created: 2026-04-01
 */

import { isValidAddress, normalizeAddress } from './address-format';
import { checkSelfSend } from './self-send';
import { checkAccountState } from './account-state';
import { checkBalance } from './balance-check';
import { checkAddressSimilarity } from './address-similarity';
import { checkNewRecipient } from './check-new-recipient';
import type { Warning } from './types';

/** Параметры для валидации отправки */
export interface ValidateSendParams {
  /** Адрес получателя в любом формате (friendly или raw) */
  recipientAddress: string;
  /** Сумма перевода в нанотонах */
  amount: bigint;
  /** Текущий баланс отправителя в нанотонах */
  senderBalance: bigint;
  /** Публичный ключ отправителя (Buffer или hex-строка) */
  senderPublicKey: Buffer;
}

/** Результат валидации отправки */
export interface SendValidationResult {
  /** true — нет error-level предупреждений (можно продолжать) */
  isValid: boolean;
  /** Все предупреждения от всех проверок */
  warnings: Warning[];
}

/**
 * Оркестратор валидации перед отправкой транзакции.
 *
 * Шаг 1 — валидация формата адреса (early return при невалидном).
 * Шаг 2 — параллельный запуск проверок: self-send, similarity, account state, balance.
 * Собирает все Warning в единый массив.
 *
 * @param params - параметры отправки
 */
export async function validateSend(params: ValidateSendParams): Promise<SendValidationResult> {
  const { recipientAddress, amount, senderBalance, senderPublicKey } = params;
  const warnings: Warning[] = [];

  // Шаг 1: валидация формата адреса — early return
  if (!isValidAddress(recipientAddress)) {
    warnings.push({
      type: 'invalid_address_format',
      message: 'Невалидный формат TON-адреса.',
      severity: 'error',
      blocking: true,
    });
    return { isValid: false, warnings };
  }

  const recipientRaw = normalizeAddress(recipientAddress);

  // Шаг 2: параллельный запуск независимых проверок
  const [selfSendWarning, similarityWarning, newRecipientWarning, accountStateWarnings, balanceWarnings] =
    await Promise.all([
      Promise.resolve(checkSelfSend(recipientRaw, senderPublicKey)),
      Promise.resolve(checkAddressSimilarity(recipientRaw)),
      Promise.resolve(checkNewRecipient(recipientRaw)),
      checkAccountState(recipientAddress).catch(() => [] as Warning[]),
      Promise.resolve(checkBalance(amount, senderBalance)),
    ]);

  // Собираем результаты
  if (selfSendWarning) warnings.push(selfSendWarning);
  if (similarityWarning) warnings.push(similarityWarning);
  if (newRecipientWarning) warnings.push(newRecipientWarning);
  warnings.push(...accountStateWarnings);
  warnings.push(...balanceWarnings);

  const isValid = !warnings.some((w) => w.severity === 'error');

  return { isValid, warnings };
}
