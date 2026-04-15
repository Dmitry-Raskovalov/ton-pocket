/**
 * file: check-new-recipient.test.ts
 * description: Unit tests for check-new-recipient validation rule
 * dependencies: check-new-recipient.ts, address-book.ts
 * created: 2026-04-15
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsTrusted = vi.fn();
const mockGetByAddress = vi.fn();

vi.mock('../address-book', () => ({
  addressBook: {
    isTrusted: (...args: unknown[]) => mockIsTrusted(...args),
    getByAddress: (...args: unknown[]) => mockGetByAddress(...args),
  },
}));

const ADDR_NEW = '0:aabbcc112233445566778899aabbcc112233445566778899aabbcc1122334455';

describe('checkNewRecipient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for trusted address (sent + received)', async () => {
    mockIsTrusted.mockReturnValue(true);

    const { checkNewRecipient } = await import('./check-new-recipient');
    const result = checkNewRecipient(ADDR_NEW);

    expect(result).toBeNull();
    expect(mockIsTrusted).toHaveBeenCalledWith(ADDR_NEW);
  });

  it('returns null when address was already sent to', async () => {
    mockIsTrusted.mockReturnValue(false);
    mockGetByAddress.mockReturnValue({
      address: ADDR_NEW,
      sources: ['sent', 'manual'],
      usageCount: 2,
    });

    const { checkNewRecipient } = await import('./check-new-recipient');
    const result = checkNewRecipient(ADDR_NEW);

    expect(result).toBeNull();
  });

  it('returns warning for completely unknown address', async () => {
    mockIsTrusted.mockReturnValue(false);
    mockGetByAddress.mockReturnValue(undefined);

    const { checkNewRecipient } = await import('./check-new-recipient');
    const result = checkNewRecipient(ADDR_NEW);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('new_recipient');
    expect(result!.severity).toBe('warning');
    expect(result!.blocking).toBe(true);
    expect(result!.message).toContain('впервые');
  });

  it('returns warning when address exists but only with received source', async () => {
    mockIsTrusted.mockReturnValue(false);
    mockGetByAddress.mockReturnValue({
      address: ADDR_NEW,
      sources: ['received'],
      usageCount: 1,
    });

    const { checkNewRecipient } = await import('./check-new-recipient');
    const result = checkNewRecipient(ADDR_NEW);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('new_recipient');
  });

  it('returns warning when address exists with only manual source', async () => {
    mockIsTrusted.mockReturnValue(false);
    mockGetByAddress.mockReturnValue({
      address: ADDR_NEW,
      sources: ['manual'],
      usageCount: 1,
    });

    const { checkNewRecipient } = await import('./check-new-recipient');
    const result = checkNewRecipient(ADDR_NEW);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('new_recipient');
  });
});
