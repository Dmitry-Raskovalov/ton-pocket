/**
 * file: ValidationPipeline.test.ts
 * description: Unit tests for ValidationPipeline class
 * dependencies: ValidationPipeline.ts, types.ts
 * created: 2026-04-15
 */

import { describe, it, expect } from 'vitest';
import { ValidationPipeline } from './ValidationPipeline';
import type { ValidationResult, ValidationContext, ValidationRule } from './types';

const MOCK_CTX: ValidationContext = {
  recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
  amount: 1_000_000_000n,
  senderBalance: 2_000_000_000n,
  senderPublicKey: Buffer.alloc(32, 0x01),
};

describe('ValidationPipeline', () => {
  it('returns valid with no errors/warnings when no rules added', async () => {
    const pipeline = new ValidationPipeline();
    const result = await pipeline.run(MOCK_CTX);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('runs single rule and returns its result', async () => {
    const rule: ValidationRule = {
      id: 'test-rule',
      validate: async () => ({
        valid: false,
        errors: [{ message: 'test error', field: 'address' }],
        warnings: [],
      }),
    };

    const pipeline = new ValidationPipeline().addRule(rule);
    const result = await pipeline.run(MOCK_CTX);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('test error');
  });

  it('aggregates errors and warnings from multiple rules', async () => {
    const rule1: ValidationRule = {
      id: 'rule-1',
      validate: async () => ({
        valid: true,
        errors: [],
        warnings: [{ message: 'warning 1', type: 'test1', severity: 'warning' as const, blocking: false }],
      }),
    };

    const rule2: ValidationRule = {
      id: 'rule-2',
      validate: async () => ({
        valid: false,
        errors: [{ message: 'error 2', field: 'amount' }],
        warnings: [{ message: 'warning 2', type: 'test2', severity: 'warning' as const, blocking: true }],
      }),
    };

    const pipeline = new ValidationPipeline().addRule(rule1).addRule(rule2);
    const result = await pipeline.run(MOCK_CTX);

    expect(result.valid).toBe(false); // has errors
    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(2);
  });

  it('passes context to each rule', async () => {
    const receivedCtx: ValidationContext[] = [];
    const rule: ValidationRule = {
      id: 'spy-rule',
      validate: async (ctx) => {
        receivedCtx.push(ctx);
        return { valid: true, errors: [], warnings: [] };
      },
    };

    const pipeline = new ValidationPipeline().addRule(rule);
    await pipeline.run(MOCK_CTX);

    expect(receivedCtx).toHaveLength(1);
    expect(receivedCtx[0]).toBe(MOCK_CTX);
  });

  it('supports chaining via addRule return value', () => {
    const pipeline = new ValidationPipeline();
    const returned = pipeline.addRule({
      id: 'r1',
      validate: async () => ({ valid: true, errors: [], warnings: [] }),
    });

    expect(returned).toBe(pipeline);
  });

  it('empty pipeline result has correct structure', async () => {
    const pipeline = new ValidationPipeline();
    const result: ValidationResult = await pipeline.run(MOCK_CTX);

    expect(result).toHaveProperty('valid', true);
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
