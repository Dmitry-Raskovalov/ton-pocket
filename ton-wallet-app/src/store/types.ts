/**
 * file: store/types.ts
 * description: Типы для Zustand stores кошелька, транзакций и UI
 * dependencies: services/ton/transactions (ParsedTransaction)
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
  /** Развернут ли контракт на блокчейне (не персистируется) */
  isActivated: boolean;
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
  /** Установить статус активации (развернут ли контракт) */
  setActivated: (isActivated: boolean) => void;
}

export type WalletStore = WalletState & WalletActions;

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Длительность показа в мс (0 = не скрывать автоматически) */
  duration: number;
}

// ─── UI Store ─────────────────────────────────────────────────────────────────

export interface UIState {
  /** Глобальный флаг загрузки */
  isLoading: boolean;
  /** Список активных toast-уведомлений */
  toasts: Toast[];
  /** Количество неверных попыток разблокировки */
  unlockAttempts: number;
  /** Timestamp до которого UI заблокирован (null = не заблокирован) */
  lockedUntil: number | null;
}

export interface UIActions {
  setLoading: (isLoading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  /** Инкрементировать счётчик попыток; при ≥ 5 — установить блокировку на 5 минут */
  incrementUnlockAttempts: () => void;
  resetUnlockAttempts: () => void;
  setLockedUntil: (lockedUntil: number | null) => void;
}

export type UIStore = UIState & UIActions;

// ─── Transaction Store ────────────────────────────────────────────────────────

export type DirectionFilter = 'all' | 'in' | 'out';

export interface TransactionState {
  /** Список загруженных транзакций */
  transactions: import('@/services/ton/transactions').ParsedTransaction[];
  /** Флаг загрузки списка */
  isLoading: boolean;
  /** Есть ли ещё транзакции для подгрузки (пагинация) */
  hasMore: boolean;
  /** Строка текстового поиска */
  searchQuery: string;
  /** Фильтр направления */
  directionFilter: DirectionFilter;
  /** Timestamp последнего обновления (unix ms, null если не загружали) */
  lastUpdateTimestamp: number | null;
}

export interface TransactionActions {
  /** Установить (заменить) список транзакций */
  setTransactions: (
    transactions: import('@/services/ton/transactions').ParsedTransaction[],
    hasMore?: boolean,
  ) => void;
  /** Добавить транзакции к существующему списку (пагинация) */
  appendTransactions: (
    transactions: import('@/services/ton/transactions').ParsedTransaction[],
    hasMore?: boolean,
  ) => void;
  setSearchQuery: (query: string) => void;
  setDirectionFilter: (filter: DirectionFilter) => void;
  setLoading: (isLoading: boolean) => void;
}

export type TransactionStore = TransactionState & TransactionActions;
