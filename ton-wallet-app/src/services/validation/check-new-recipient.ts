/**
 * file: check-new-recipient.ts
 * description: Предупреждение, если пользователь впервые отправляет
 *              на данный адрес (нет в адресной книге с source='sent').
 * dependencies: address-book.ts, types.ts
 */

import { addressBook } from '../address-book';
import type { Warning } from './types';

/**
 * Возвращает Warning, если на этот адрес ещё не было исходящих переводов.
 * Если адрес уже "доверенный" (были и sent, и received) — возвращает null.
 */
export function checkNewRecipient(recipientRaw: string): Warning | null {
    // Доверенный адрес — предупреждать не нужно
    if (addressBook.isTrusted(recipientRaw)) return null;

    const entry = addressBook.getByAddress(recipientRaw);
    const hasSentBefore = entry?.sources.includes('sent') ?? false;

    if (hasSentBefore) return null;

    return {
        type: 'new_recipient',
        message:
            'Вы впервые отправляете TON на этот адрес. ' +
            'Убедитесь, что адрес введён правильно.',
        severity: 'warning',
        blocking: false,
    };
}
