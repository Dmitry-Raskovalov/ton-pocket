/**
 * file: address-similarity.ts
 * description: Проверка адреса получателя на похожесть с адресами из адресной книги
 *              (защита от clipboard poisoning)
 * dependencies: address-book.ts, types.ts
 * created: 2026-04-01
 */

import { addressBook } from '../address-book';
import type { Warning } from './types';

/**
 * Проверяет, похож ли адрес получателя на один из адресов в адресной книге.
 * Возвращает Warning с severity='critical', blocking=true если найдены похожие адреса.
 * Возвращает null если похожих адресов нет или адрес полностью совпадает.
 *
 * @param recipientRaw - адрес получателя в нормализованном raw-формате (0:hex)
 */
export function checkAddressSimilarity(recipientRaw: string): Warning | null {
  const similar = addressBook.findSimilar(recipientRaw);

  if (similar.length === 0) {
    return null;
  }

  const details = similar.map((match) => {
    const label = match.entry.label ?? match.entry.displayAddress;
    const part = match.matchType === 'prefix'
      ? 'начало'
      : match.matchType === 'suffix'
        ? 'конец'
        : 'начало и конец';
    return `${label} (совпадает ${part}: ${match.matchedChars})`;
  });

  return {
    type: 'address_similarity',
    message: `Введённый адрес похож на ${details.length === 1 ? 'адрес' : 'адреса'} из вашей адресной книги: ${details.join('; ')}. Убедитесь, что адрес не был подменён.`,
    severity: 'warning',
    blocking: true,
  };
}
