/**
 * file: store/types.ts
 * description: Типы для Zustand stores кошелька, транзакций и UI
 * dependencies: crypto/vault (hasVault)
 * created: 2026-03-31
 */

// ─── Wallet Version ───────────────────────────────────────────────────────────

export type WalletVersion = 'v3R2' | 'v4R2' | 'v5R1';

// ─── Wallet Store ─────────────────────────────────────────────────────────────

export interface WalletState {
  /** Адрес кошелька в raw-формате (null если кошелёк не создан) */
  address: string | null;
  /** Версия контракта */
  version: WalletVersion | null;
  /** Баланс в нанотон (не персистируется, сбрасывается при перезагрузке) */
  balance: bigint;
  /** Авторизован ли пользователь (всегда false при старте) */
  isUnlocked: boolean;
  /** Публичный ключ в hex (персистируется) */
  publicKey: string | null;
}

export interface WalletActions {
  /** Установить данные кошелька после создания/импорта */
  setWallet: (params: { address: string; version: WalletVersion; publicKey: string }) => void;
  /** Очистить все данные кошелька */
  clearWallet: () => void;
  /** Обновить баланс */
  updateBalance: (balance: bigint) => void;
  /** Установить статус авторизации */
  setUnlocked: (isUnlocked: boolean) => void;
}

export type WalletStore = WalletState & WalletActions;
