/**
 * file: crypto/session.ts
 * description: Module-level session state — password stored in a closure, not in
 *   Zustand, so it cannot be read via global store inspection or DevTools.
 * dependencies: none
 * created: 2026-04-21
 */

let _password: string | null = null;

export function setSessionPassword(password: string | null): void {
  _password = password;
}

export function getSessionPassword(): string | null {
  return _password;
}

export function clearSession(): void {
  _password = null;
}
