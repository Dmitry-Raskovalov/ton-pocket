/**
 * file: client.ts
 * description: TonClient wrapper with singleton pattern, retry and exponential backoff
 * dependencies: @ton/ton, axios
 * created: 2026-03-31
 */

import { TonClient } from '@ton/ton';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// --- Typed errors ---

export class NetworkError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

export class RateLimitError extends Error {
  readonly retryAfterMs?: number;
  constructor(retryAfterMs?: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class ApiError extends Error {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// --- Retry ---

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute `fn` with retry logic: up to MAX_RETRIES attempts,
 * exponential backoff (1s, 2s, 4s).
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // RateLimitError and ApiError are not retried
      if (err instanceof RateLimitError || err instanceof ApiError) {
        throw err;
      }

      if (attempt < MAX_RETRIES - 1) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  if (lastError instanceof NetworkError) {
    throw lastError;
  }

  throw new NetworkError('Request failed after max retries', lastError);
}

// --- Axios adapter with error handling ---

function buildHttpAdapter(apiKey?: string) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const url = config.url ?? '';
    const method = (config.method ?? 'post').toUpperCase();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    // Merge any headers from axios config
    if (config.headers) {
      for (const [k, v] of Object.entries(config.headers)) {
        if (typeof v === 'string') {
          headers[k] = v;
        }
      }
    }

    const body = config.data != null
      ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data))
      : undefined;

    return withRetry(async () => {
      let response: Response;

      try {
        response = await globalThis.fetch(url, { method, headers, body });
      } catch (err: unknown) {
        throw new NetworkError('Network request failed', err);
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined);
      }

      if (!response.ok) {
        throw new ApiError(`HTTP ${response.status}`, response.status);
      }

      const data = await response.json();

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: {} as AxiosResponse['headers'],
        config,
      } satisfies AxiosResponse;
    });
  };
}

// --- Singleton ---

let _client: TonClient | null = null;

function getEnv(key: string): string | undefined {
  try {
    return (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key];
  } catch {
    return undefined;
  }
}

/**
 * Return the singleton TonClient configured for TON Testnet.
 *   VITE_TON_ENDPOINT — defaults to https://testnet.toncenter.com/api/v2/jsonRPC
 *   VITE_TON_API_KEY  — optional
 */
export function getTonClient(): TonClient {
  if (_client) {
    return _client;
  }

  const endpoint =
    getEnv('VITE_TON_ENDPOINT') ??
    'https://testnet.toncenter.com/api/v2/jsonRPC';

  const apiKey = getEnv('VITE_TON_API_KEY') || undefined;

  _client = new TonClient({
    endpoint,
    apiKey,
    httpAdapter: buildHttpAdapter(apiKey),
  });

  return _client;
}

/**
 * Reset the singleton — used in tests.
 */
export function resetTonClient(): void {
  _client = null;
}
