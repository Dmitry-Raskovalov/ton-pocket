/**
 * file: password-strength.test.ts
 * description: Unit tests for password-strength.ts module.
 * dependencies: password-strength.ts, vitest
 * created: 2026-03-31
 */

import { describe, it, expect } from 'vitest';
import { evaluatePassword } from './password-strength';

describe('evaluatePassword', () => {
  it('возвращает score < 2 для простого пароля "12345678"', () => {
    const result = evaluatePassword('12345678');
    expect(result.score).toBeLessThan(2);
  });

  it('возвращает score >= 2 для сложного пароля "Tr0ub4dor&3"', () => {
    const result = evaluatePassword('Tr0ub4dor&3');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('isAcceptable = false для пароля короче 8 символов, даже сложного', () => {
    const result = evaluatePassword('X#9kP!2'); // 7 символов
    expect(result.isAcceptable).toBe(false);
  });

  it('isAcceptable = false для простого пароля >= 8 символов (score < 2)', () => {
    const result = evaluatePassword('12345678');
    expect(result.isAcceptable).toBe(false);
  });

  it('isAcceptable = true для сложного пароля >= 8 символов', () => {
    const result = evaluatePassword('Tr0ub4dor&3');
    expect(result.isAcceptable).toBe(true);
  });

  it('возвращает корректную текстовую метку для каждого score', () => {
    const labels: Record<number, string> = {
      0: 'Very weak',
      1: 'Weak',
      2: 'Fair',
      3: 'Strong',
      4: 'Very strong',
    };
    const result = evaluatePassword('Tr0ub4dor&3');
    expect(labels[result.score]).toBeDefined();
    expect(result.label).toBe(labels[result.score]);
  });

  it('возвращает непустой color для любого результата', () => {
    const result = evaluatePassword('password');
    expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('возвращает строку warning (может быть пустой)', () => {
    const result = evaluatePassword('password');
    expect(typeof result.warning).toBe('string');
  });

  it('возвращает массив suggestions', () => {
    const result = evaluatePassword('password');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('пустой пароль — isAcceptable = false', () => {
    const result = evaluatePassword('');
    expect(result.isAcceptable).toBe(false);
  });

  it('пароль из пробелов — isAcceptable = false', () => {
    const result = evaluatePassword('        '); // 8 пробелов
    expect(result.isAcceptable).toBe(false);
  });

  it('очень длинный пароль (256 символов) обрабатывается', () => {
    const longPassword = 'A'.repeat(256);
    const result = evaluatePassword(longPassword);
    expect(typeof result.score).toBe('number');
    expect(typeof result.isAcceptable).toBe('boolean');
  });

  it('пароль с unicode символами', () => {
    const result = evaluatePassword('Пароль123!@#');
    expect(typeof result.score).toBe('number');
  });
});
