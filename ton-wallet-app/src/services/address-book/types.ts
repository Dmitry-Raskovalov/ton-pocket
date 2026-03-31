/**
 * file: types.ts
 * description: Types for address book service
 * dependencies: none
 * created: 2026-03-31
 */

export interface AddressBookEntry {
  /** Raw address in 0:hex format */
  address: string;
  /** User-friendly address (EQ... or UQ...) */
  displayAddress: string;
  /** Optional user-defined label */
  label?: string;
  /** Timestamp of last usage (ms) */
  lastUsed: number;
  /** How many times this address was used */
  usageCount: number;
  /** How the entry was created */
  source: 'manual' | 'sent' | 'received';
}

export interface SimilarAddressMatch {
  entry: AddressBookEntry;
  /** Which part of the address matches */
  matchType: 'prefix' | 'suffix' | 'both';
  /** The matching characters */
  matchedChars: string;
}
