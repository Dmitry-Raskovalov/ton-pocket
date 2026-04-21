/**
 * file: crypto/session.test.ts
 * description: Юнит-тесты для модульного хранилища сессионного пароля
 * dependencies: crypto/session
 * created: 2026-04-21
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setSessionPassword, getSessionPassword, clearSession } from './session';

describe('session', () => {
  beforeEach(() => {
    clearSession();
  });

  it('возвращает null до установки пароля', () => {
    expect(getSessionPassword()).toBeNull();
  });

  it('сохраняет и возвращает пароль', () => {
    setSessionPassword('mySecret123');
    expect(getSessionPassword()).toBe('mySecret123');
  });

  it('перезаписывает ранее сохранённый пароль', () => {
    setSessionPassword('first');
    setSessionPassword('second');
    expect(getSessionPassword()).toBe('second');
  });

  it('clearSession сбрасывает пароль в null', () => {
    setSessionPassword('somePass');
    clearSession();
    expect(getSessionPassword()).toBeNull();
  });

  it('setSessionPassword(null) очищает пароль', () => {
    setSessionPassword('pass');
    setSessionPassword(null);
    expect(getSessionPassword()).toBeNull();
  });

  it('сохраняет пароль с пустой строкой', () => {
    setSessionPassword('');
    expect(getSessionPassword()).toBe('');
  });

  it('сохраняет пароль с Unicode-символами', () => {
    const pw = 'Пароль123!@#';
    setSessionPassword(pw);
    expect(getSessionPassword()).toBe(pw);
  });
});
