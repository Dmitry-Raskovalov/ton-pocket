# Changelog

Все заметные изменения в проекте TON Testnet Wallet будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

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
