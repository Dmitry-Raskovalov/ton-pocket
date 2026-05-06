/**
 * file: address-similarity.ts
 * description: Check if recipient address is similar to addresses in address book
 *              (protection from clipboard poisoning)
 * dependencies: address-book.ts, types.ts
 * created: 2026-04-01
 */

import { addressBook } from '../address-book';
import type { Warning } from './types';

/**
 * Checks if recipient address is similar to addresses in address book.
 * Returns Warning with severity='critical', blocking=true if similar addresses found.
 * Returns null if no similar addresses or address exactly matches.
 *
 * @param recipientRaw - recipient address in normalized raw format (0:hex)
 */
export function checkAddressSimilarity(recipientRaw: string): Warning | null {
  const similar = addressBook.findSimilar(recipientRaw);

  if (similar.length === 0) {
    return null;
  }

  const details = similar.map((match) => {
    const label = match.entry.label ?? match.entry.displayAddress;
    const part = match.matchType === 'prefix'
      ? 'prefix'
      : match.matchType === 'suffix'
        ? 'suffix'
        : 'prefix and suffix';
    return `${label} (matches ${part}: ${match.matchedChars})`;
  });

  return {
    type: 'address_similarity',
    message: `Entered address is similar to ${details.length === 1 ? 'an address' : 'addresses'} in your address book: ${details.join('; ')}. Ensure the address was not substituted.`,
    severity: 'warning',
    blocking: true,
  };
}
