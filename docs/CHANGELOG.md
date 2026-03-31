# Changelog

Все заметные изменения в проекте TON Testnet Wallet будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

---

## [2026-03-31] - Валидация формата адреса (Задача 7.1)

### Добавлено
- `src/services/validation/address-format.ts` — `isValidAddress()`, `normalizeAddress()`, `parseAddress()`
- Поддержка форматов: bounceable (EQ/kQ), non-bounceable (UQ/0Q), raw (0:hex)
- `src/services/validation/address-format.test.ts` — 20 тестов (все прошли)
- Экспорт из `src/services/validation/index.ts`

---

## [2026-03-31] - Адресная книга (Задача 6.5)

### Добавлено
- `src/services/address-book/types.ts` — типы `AddressBookEntry`, `SimilarAddressMatch`
- `src/services/address-book/address-book.ts` — класс `AddressBook`: CRUD, persist в localStorage, `findSimilar` (защита от clipboard poisoning), `getLabelForAddress`
- `src/services/address-book/index.ts` — barrel export
- `src/services/address-book/address-book.test.ts` — 15 тестов (все прошли)

---

## [2026-03-31] - Contract Factory и автодетекция версий (Задача 4.5)

### Добавлено
- `src/services/wallet/contract-factory.ts` — `createContract(publicKey, version)`, `detectVersions(publicKey)`, `pickDefaultWallet(detected)`
- Тип `DetectedWallet` — version, addressRaw, addressFriendly, balance, isDeployed
- Параллельный опрос трёх версий контрактов (v3R2, v4R2, v5R1) через `Promise.all`
- Fallback на v4R2 (isDeployed=false) если ни одна версия не найдена
- `src/services/wallet/contract-factory.test.ts` — 12 тестов

---

## [2026-03-31] - Wallet Store (Задача 5.1)

### Добавлено
- `src/store/types.ts` — тип `WalletVersion = 'v3R2' | 'v4R2' | 'v5R1'`, интерфейсы `WalletState`, `WalletActions`, `WalletStore`
- `src/store/wallet-store.ts` — Zustand store с persist middleware; persists: `address`, `version`, `publicKey`; не persists: `balance` (0n при старте), `isUnlocked` (false при старте)
- Селекторы `isWalletCreated()` (проверяет vault в localStorage) и `hasWallet()` (проверяет address в store)
- `src/store/wallet-store.test.ts` — 16 юнит-тестов: начальное состояние, все actions, persist (записывает нужное / не записывает лишнее), селекторы

### Изменено
- `src/store/index.ts` — экспортирует `wallet-store.ts` вместо `walletStore.ts`
- `src/hooks/useWallet.ts` — переработан под новый API store (плоский state, `isUnlocked` вместо `isLocked`)

### Удалено
- `src/store/walletStore.ts` — заменён на `wallet-store.ts` с правильной структурой и persist

---

## [2026-03-31] - Сервис истории транзакций (Задача 4.3)

### Добавлено
- `src/services/ton/transactions.ts` — `getTransactions(address, limit, lt?, hash?)` с пагинацией
- Тип `ParsedTransaction` — hash, timestamp, direction, amount, counterpartyAddress, comment, fee, lt
- Парсинг входящих/исходящих/deploy транзакций, декодирование text comment (opcode 0x00000000)
- `src/services/ton/transactions.test.ts` — 15 тестов
- `balance.ts` — поддержка raw-адресов (формат `0:...`)

---

## [2026-03-31] - Сервис получения баланса (Задача 4.2)

### Добавлено
- `src/services/ton/balance.ts` — `getBalance(address)` возвращает баланс в нанотон, `formatTon(nanotons)` форматирует для UI
- Несуществующий аккаунт возвращает `0n` без броска ошибки
- `src/services/ton/balance.test.ts` — 12 тестов (getBalance, formatTon, edge cases)

---

## [2026-03-31] - TonClient wrapper (Задача 4.1)

### Добавлено
- `src/services/ton/client.ts` — singleton `getTonClient()`, Axios adapter поверх `fetch`
- Типизированные ошибки: `NetworkError`, `RateLimitError`, `ApiError`
- `withRetry<T>()` — retry 3 попытки, exponential backoff (1s→2s→4s)
- `resetTonClient()` — сброс singleton для тестов
- `src/services/ton/client.test.ts` — 13 тестов (withRetry, singleton, ошибки)

---

## [2026-03-31] - Оценка силы пароля (Задача 3.3)

### Добавлено

- `src/crypto/password-strength.ts` — модуль оценки пароля через `zxcvbn-ts`: `evaluatePassword` возвращает score (0–4), label, color, warning, suggestions, isAcceptable
- `src/crypto/password-strength.test.ts` — 10 юнит-тестов: простые пароли (score < 2), сложные (score ≥ 2), короткий пароль (isAcceptable = false), метки, цвета, структура результата

---

## [2026-03-31] - Encrypted Vault (Задача 3.2)

### Добавлено

- `src/crypto/vault.ts` — AES-256-GCM шифрование/расшифровка: `encrypt`, `decrypt`, `saveVault`, `loadVault`, `hasVault`, `clearVault`
- `src/crypto/vault.test.ts` — 16 юнит-тестов: round-trip, ошибка при неверном пароле, tampered ciphertext/IV, unicode, localStorage round-trip с декриптом
- `src/crypto/types.ts` — добавлены `KdfParamsSerialized`, `Argon2ParamsSerialized`, `Pbkdf2ParamsSerialized` для JSON-совместимого хранения

### Исправлено

- `vault.ts`: `keyBytes.buffer`, `iv.buffer`, `ciphertext.buffer` → прямая передача TypedArray в Web Crypto
- `vault.ts`: `kdfParams.salt` сериализуется в base64 при сохранении и восстанавливается в `Uint8Array` при загрузке (JSON.parse разрушал TypedArray)

---

## [2026-03-31] - KDF модуль (Задача 3.1)

### Добавлено

- `src/crypto/types.ts` — типы `KdfAlgorithm`, `KdfParams` (Argon2Params / Pbkdf2Params), `KdfResult`, `EncryptedVault`
- `src/crypto/kdf.ts` — модуль деривации ключа: `generateSalt`, `isArgon2Available`, `deriveKey`, `deriveKeyWithParams`
- `src/crypto/kdf.test.ts` — 11 юнит-тестов: generateSalt, PBKDF2, Argon2id (мок), fallback, воспроизводимость

### Исправлено

- `kdf.ts`: передача `salt` (Uint8Array) вместо `salt.buffer as ArrayBuffer` в `crypto.subtle.deriveBits` — устраняет ошибку в jsdom/Node окружении

---

## [2026-03-31] - Инициализация проекта (Задача 1.1)

### Добавлено

- Проект инициализирован через Vite 8 с шаблоном `react-ts`
- Настроен Tailwind CSS 4 с `@tailwindcss/postcss`
- Установлены зависимости:
  - `wouter` — роутинг
  - `zustand` — управление состоянием
  - `@ton/ton`, `@ton/crypto` — TON SDK
  - `argon2-browser` — KDF (Argon2id)
  - `zxcvbn-ts` — проверка силы пароля
  - `qrcode.react` — генерация QR-кодов
- Настроен Vitest + React Testing Library + jsdom для юнит-тестов
- TypeScript strict mode включён с расширенными проверками
- Path aliases `@/*` → `src/*` настроены
- Создана структура директорий:
  - `src/crypto/` — криптографические модули
  - `src/services/ton/` — TON blockchain сервис
  - `src/services/wallet/` — Wallet сервис
  - `src/services/validation/` — Validation pipeline
  - `src/store/` — Zustand stores
  - `src/screens/` — экраны приложения
  - `src/components/` — UI компоненты
  - `src/hooks/` — React hooks
  - `src/types/` — type declarations
- Добавлены type declarations для `argon2-browser`
- Создан `.env.example` с переменными `VITE_TON_API_KEY` и `VITE_TON_ENDPOINT`
- Добавлены npm scripts: `test`, `test:watch`, `test:coverage`

### Созданные модули (заглушки)

- `crypto/types.ts` — типы для KDF и Vault
- `crypto/kdf.ts` — Key Derivation Function (Argon2id/PBKDF2)
- `crypto/vault.ts` — AES-256-GCM шифрование мнемоники
- `services/ton/TonService.ts` — сервис взаимодействия с TON testnet
- `services/wallet/WalletService.ts` — сервис управления кошельком
- `services/validation/ValidationPipeline.ts` — pipeline валидации транзакций
- `store/walletStore.ts` — Zustand store для состояния кошелька
- `screens/WelcomeScreen.tsx` — приветственный экран
- `screens/MainScreen.tsx` — главный экран с балансом и историей
- `components/PasswordInput.tsx` — компонент ввода пароля
- `components/HighlightedAddress.tsx` — подсвеченный адрес
- `components/WarningCard.tsx` — карточка предупреждения
- `components/CopyButton.tsx` — кнопка копирования
- `hooks/useWallet.ts` — hook для работы с кошельком

### Проверено

- `npm run dev` — dev-сервер запускается без ошибок
- `npm run build` — production сборка успешна
- `npm run test` — тесты проходят (1 заглушка)
