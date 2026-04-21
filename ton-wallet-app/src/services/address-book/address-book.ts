/**
 * file: address-book.ts
 * description: CRUD operations for address book with localStorage persistence
 *              and similar address detection for clipboard poisoning protection
 * dependencies: types.ts
 * created: 2026-03-31
 */

import { Address } from '@ton/core';
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
      const parsed = JSON.parse(raw) as unknown[];
      return new Map<string, AddressBookEntry>(
        (parsed as Record<string, unknown>[]).map((e) => {
          // Migration: if entry has old 'source' field, convert to 'sources' array
          const entry = { ...e };
          if (entry.source && !entry.sources) {
            entry.sources = [entry.source];
            delete entry.source;
          } else if (!entry.sources) {
            entry.sources = ['manual'];
          }
          return [entry.address as string, entry as unknown as AddressBookEntry];
        }),
      );
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
  addOrUpdateEntry(entry: { address: string; displayAddress?: string; label?: string; source?: 'manual' | 'sent' | 'received' }): void {
    try {
      Address.parseRaw(entry.address);
    } catch {
      throw new Error(`Invalid raw address format: ${entry.address}`);
    }

    const existing = this.entries.get(entry.address);
    if (existing) {
      const newSource = entry.source ?? 'manual';
      const updatedSources = existing.sources.includes(newSource)
        ? existing.sources
        : [...existing.sources, newSource];

      this.entries.set(entry.address, {
        ...existing,
        label: entry.label ?? existing.label,
        displayAddress: entry.displayAddress ?? existing.displayAddress,
        sources: updatedSources,
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
        sources: [entry.source ?? 'manual'],
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

  /**
   * Адрес считается "проверенным", если с ним уже были
   * и входящие, и исходящие транзакции.
   */
  isTrusted(address: string): boolean {
    const entry = this.entries.get(address);
    if (!entry) return false;
    return entry.sources.includes('sent') && entry.sources.includes('received');
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
