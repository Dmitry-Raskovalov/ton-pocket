/**
 * file: address-book.ts
 * description: CRUD operations for address book with localStorage persistence
 *              and similar address detection for clipboard poisoning protection
 * dependencies: types.ts
 * created: 2026-03-31
 */

import type { AddressBookEntry, SimilarAddressMatch } from './types';

const STORAGE_KEY = 'ton_pocket_address_book';
const SIMILARITY_CHARS = 6;

export class AddressBook {
  private entries: Map<string, AddressBookEntry>;

  constructor() {
    this.entries = this.load();
  }

  private load(): Map<string, AddressBookEntry> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Map();
      const parsed = JSON.parse(raw) as AddressBookEntry[];
      return new Map(parsed.map((e) => [e.address, e]));
    } catch {
      return new Map();
    }
  }

  private save(): void {
    const list = Array.from(this.entries.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  /**
   * Add new entry or update lastUsed/usageCount if address already exists.
   * All comparisons are done via normalised raw address.
   */
  addOrUpdateEntry(entry: Partial<AddressBookEntry> & { address: string }): void {
    const existing = this.entries.get(entry.address);
    if (existing) {
      this.entries.set(entry.address, {
        ...existing,
        label: entry.label ?? existing.label,
        displayAddress: entry.displayAddress ?? existing.displayAddress,
        source: entry.source ?? existing.source,
        lastUsed: Date.now(),
        usageCount: existing.usageCount + 1,
      });
    } else {
      this.entries.set(entry.address, {
        address: entry.address,
        displayAddress: entry.displayAddress ?? entry.address,
        label: entry.label,
        lastUsed: Date.now(),
        usageCount: 1,
        source: entry.source ?? 'manual',
      });
    }
    this.save();
  }

  /** Return all entries sorted by lastUsed descending */
  getEntries(): AddressBookEntry[] {
    return Array.from(this.entries.values()).sort((a, b) => b.lastUsed - a.lastUsed);
  }

  /** Find entry by raw address */
  getByAddress(address: string): AddressBookEntry | undefined {
    return this.entries.get(address);
  }

  /**
   * Find entries whose raw address shares first or last SIMILARITY_CHARS characters
   * with the given address, but is not identical to it.
   */
  findSimilar(address: string): SimilarAddressMatch[] {
    const hexPart = extractHexPart(address);
    const prefix = hexPart.slice(0, SIMILARITY_CHARS);
    const suffix = hexPart.slice(-SIMILARITY_CHARS);

    const results: SimilarAddressMatch[] = [];

    for (const entry of this.entries.values()) {
      if (entry.address === address) continue;

      const entryHex = extractHexPart(entry.address);
      const matchesPrefix = entryHex.startsWith(prefix);
      const matchesSuffix = entryHex.endsWith(suffix);

      if (matchesPrefix && matchesSuffix) {
        results.push({ entry, matchType: 'both', matchedChars: `${prefix}...${suffix}` });
      } else if (matchesPrefix) {
        results.push({ entry, matchType: 'prefix', matchedChars: prefix });
      } else if (matchesSuffix) {
        results.push({ entry, matchType: 'suffix', matchedChars: suffix });
      }
    }

    return results;
  }

  /** Get label for a raw address, or undefined if not in book */
  getLabelForAddress(rawAddress: string): string | undefined {
    return this.entries.get(rawAddress)?.label;
  }
}

/**
 * Extract the hex part after "0:" from a raw address for comparison.
 * If address doesn't contain ":", return as-is (already hex).
 */
function extractHexPart(raw: string): string {
  const colonIdx = raw.indexOf(':');
  return colonIdx !== -1 ? raw.slice(colonIdx + 1) : raw;
}

export const addressBook = new AddressBook();
