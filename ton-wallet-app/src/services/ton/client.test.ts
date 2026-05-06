/**
 * file: client.test.ts
 * description: Unit tests for TonClient wrapper
 * dependencies: client.ts
 * created: 2026-03-31
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, NetworkError, RateLimitError, ApiError, getTonClient, resetTonClient } from './client';

// --- withRetry ---

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on NetworkError and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError('fail'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    // advance past first backoff (1s)
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries 3 times total then throws NetworkError', async () => {
    const fn = vi.fn().mockRejectedValue(new NetworkError('fail'));

    const settled = withRetry(fn).then(
      (v) => ({ status: 'fulfilled', value: v }),
      (e) => ({ status: 'rejected', reason: e }),
    );
    // advance through all backoffs: 1s + 2s
    await vi.advanceTimersByTimeAsync(3000);

    const result = await settled;
    expect(result.status).toBe('rejected');
    expect((result as { status: 'rejected'; reason: unknown }).reason).toBeInstanceOf(NetworkError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries on RateLimitError respecting Retry-After (capped at 5s) and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RateLimitError(2000))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('caps RateLimitError wait at 5s even if Retry-After is larger', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RateLimitError(60_000)) // server asks for 60s
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    // advance only 5s — capped wait should already have elapsed
    await vi.advanceTimersByTimeAsync(5000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('falls back to exponential backoff when RateLimitError has no Retry-After', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RateLimitError())
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws RateLimitError after MAX_RETRIES persistent 429s', async () => {
    const fn = vi.fn().mockRejectedValue(new RateLimitError(1000));

    const settled = withRetry(fn).then(
      (v) => ({ status: 'fulfilled', value: v }),
      (e) => ({ status: 'rejected', reason: e }),
    );
    await vi.advanceTimersByTimeAsync(3000);

    const result = await settled;
    expect(result.status).toBe('rejected');
    expect((result as { status: 'rejected'; reason: unknown }).reason).toBeInstanceOf(
      RateLimitError,
    );
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry on 4xx ApiError (400)', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Bad Request', 400));
    await expect(withRetry(fn)).rejects.toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 4xx ApiError (499)', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Client Error', 499));
    await expect(withRetry(fn)).rejects.toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on 5xx ApiError and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('Internal Server Error', 500))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries 5xx ApiError 3 times then throws ApiError', async () => {
    const fn = vi.fn().mockRejectedValue(new ApiError('Service Unavailable', 503));

    const settled = withRetry(fn).then(
      (v) => ({ status: 'fulfilled', value: v }),
      (e) => ({ status: 'rejected', reason: e }),
    );
    await vi.advanceTimersByTimeAsync(3000);

    const result = await settled;
    expect(result.status).toBe('rejected');
    expect((result as { status: 'rejected'; reason: unknown }).reason).toBeInstanceOf(ApiError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries ApiError with undefined statusCode', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new ApiError('Unknown error'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('wraps unknown error in NetworkError after max retries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('unexpected'));

    const settled = withRetry(fn).then(
      (v) => ({ status: 'fulfilled', value: v }),
      (e) => ({ status: 'rejected', reason: e }),
    );
    await vi.advanceTimersByTimeAsync(3000);

    const result = await settled;
    expect(result.status).toBe('rejected');
    expect((result as { status: 'rejected'; reason: unknown }).reason).toBeInstanceOf(NetworkError);
  });
});

// --- getTonClient ---

describe('getTonClient', () => {
  beforeEach(() => {
    resetTonClient();
  });

  afterEach(() => {
    resetTonClient();
  });

  it('returns a TonClient instance', () => {
    const client = getTonClient();
    expect(client).toBeDefined();
    expect(client.parameters).toBeDefined();
  });

  it('uses default testnet endpoint when env var is not set', () => {
    const client = getTonClient();
    expect(client.parameters.endpoint).toBe(
      'https://testnet.toncenter.com/api/v2/jsonRPC'
    );
  });

  it('returns the same singleton on multiple calls', () => {
    const c1 = getTonClient();
    const c2 = getTonClient();
    expect(c1).toBe(c2);
  });

  it('returns a new instance after reset', () => {
    const c1 = getTonClient();
    resetTonClient();
    const c2 = getTonClient();
    expect(c1).not.toBe(c2);
  });
});

// --- Typed errors ---

describe('error types', () => {
  it('NetworkError has correct name', () => {
    const err = new NetworkError('msg');
    expect(err.name).toBe('NetworkError');
    expect(err.message).toBe('msg');
  });

  it('RateLimitError has correct name and retryAfterMs', () => {
    const err = new RateLimitError(3000);
    expect(err.name).toBe('RateLimitError');
    expect(err.retryAfterMs).toBe(3000);
  });

  it('ApiError has correct name and statusCode', () => {
    const err = new ApiError('Not Found', 404);
    expect(err.name).toBe('ApiError');
    expect(err.statusCode).toBe(404);
  });
});
