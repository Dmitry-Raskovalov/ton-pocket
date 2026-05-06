/**
 * file: check-new-recipient.ts
 * description: Warning when the user sends to an address for the first time
 *              (not present in the address book with source='sent').
 * dependencies: address-book.ts, types.ts
 */

import { addressBook } from '../address-book';
import type { Warning } from './types';

export function checkNewRecipient(recipientRaw: string): Warning | null {
    if (addressBook.isTrusted(recipientRaw)) return null;

    const entry = addressBook.getByAddress(recipientRaw);
    const hasSentBefore = entry?.sources.includes('sent') ?? false;

    if (hasSentBefore) return null;

    return {
        type: 'new_recipient',
        message: 'This is your first time sending TON to this address. Double-check that it is correct.',
        severity: 'warning',
        blocking: true,
    };
}
