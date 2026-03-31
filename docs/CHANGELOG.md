# Changelog

Все заметные изменения в проекте TON Testnet Wallet будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

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
