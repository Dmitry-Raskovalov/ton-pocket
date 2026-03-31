# Дневник разработки TON Testnet Wallet

## 2026-03-31 — Задача 3.3: Оценка силы пароля

### Наблюдения

- Установленный пакет `zxcvbn-ts` v2 — монолитный (не `@zxcvbn-ts/core`). API прост: `import { zxcvbn } from 'zxcvbn-ts'`, функция синхронная.
- `result.feedback.warning` может быть `undefined` при высоком score (> 2) — нужна защита `?? ''`.
- Пороговые значения (score ≥ 2, length ≥ 8) вынесены в именованные константы для читаемости и удобства будущих изменений.

### Решения

- `evaluatePassword` реализована как чистая синхронная функция без side effects — удобно тестировать и использовать в хуках React.
- Маппинги score → label и score → color определены как `Record<StrengthScore, string>` — TypeScript гарантирует полноту маппинга.

### Проблемы

- Нет. Задача выполнена без неожиданных препятствий.

---

## 2026-03-31 — Задача 3.2: Encrypted Vault

### Наблюдения

- `JSON.stringify/parse` уничтожает `Uint8Array` — после десериализации получается plain object `{0: 1, 1: 2, ...}`, который Web Crypto не принимает. Стандартная ловушка при хранении бинарных данных в localStorage.
- Web Crypto API принимает `Uint8Array` (TypedArray = `BufferSource`) напрямую — не нужно `.buffer as ArrayBuffer`.

### Решения

- Введены serializable-типы `KdfParamsSerialized` с `salt: string` (base64). Vault хранит только JSON-совместимые данные, при операциях — восстановление через `deserializeKdfParams`.
- `uint8ToBase64` / `base64ToUint8` используются как единая точка сериализации бинарных данных.

### Проблемы

- Нет. Архитектурное решение с отдельными serializable-типами устраняет проблему чисто.

---

## 2026-03-31 — Задача 3.1: Модуль KDF

### Наблюдения

- `argon2-browser` требует WASM, который недоступен в jsdom/Node — в тестах необходимо мокировать через `vi.doMock`.
- `vi.resetModules()` обязателен для сброса singleton `argon2Available` между тестами с разными моками.
- `crypto.subtle.deriveBits` в jsdom принимает `Uint8Array` напрямую, но не `salt.buffer as ArrayBuffer` — это поведение отличается от спецификации Web Crypto, где `BufferSource = ArrayBuffer | ArrayBufferView`.

### Решения

- Исправлен `kdf.ts`: `salt.buffer as ArrayBuffer` → `salt` (Uint8Array реализует `ArrayBufferView`, что корректно принимается и в реальных браузерах, и в jsdom).
- Argon2id тестируется через `vi.doMock` с фейковым `hashHex`; PBKDF2 — напрямую через реальный Web Crypto (600k итераций ~230ms на тест).

### Проблемы

- Тесты PBKDF2 медленные (~230–500ms каждый) из-за 600k итераций. Для ускорения тестов можно добавить отдельный helper с меньшим числом итераций, но пока это не критично.

---

## 2026-03-31 — Задача 1.1: Инициализация проекта

### Наблюдения

- Vite 8 + React 19 + TypeScript создают современный шаблон с уже включённым strict mode в tsconfig.
- Tailwind CSS 4 требует отдельный пакет `@tailwindcss/postcss` для работы через PostCSS — старый способ с `tailwindcss` напрямую больше не работает.
- TypeScript-опция `erasableSyntaxOnly` (новая в TS 5.9+) запрещает parameter properties в конструкторах (`constructor(private config)`), требуя явного объявления полей.
- Argon2-browser не имеет встроенных типов — требуется создать `.d.ts` файл с декларациями модуля.
- Web Crypto API имеет строгую типизацию для `ArrayBuffer` vs `SharedArrayBuffer` — требуется явное приведение типов через `as ArrayBuffer`.
- Vite использует Rolldown (новый bundler, форк Rollup) вместо esbuild в версии 8.

### Решения

- Создан проект через `npm create vite@latest` с шаблоном `react-ts` в текущую директорию (с использованием временной папки).
- Tailwind CSS 4 настроен через `@tailwindcss/postcss` в `postcss.config.js`.
- Для TypeScript path aliases добавлен `@types/node` и настройка `paths` в `tsconfig.app.json`.
- Vitest настроен через `defineConfig` из `vitest/config` (не из `vite`) для корректной типизации поля `test`.
- Создана полная структура директорий согласно ТЗ: `crypto/`, `services/ton/`, `services/wallet/`, `services/validation/`, `store/`, `screens/`, `components/`, `hooks/`.
- Реализованы заглушки для всех модулей с типами и базовой структурой:
  - `crypto/kdf.ts` — Argon2id/PBKDF2 деривация
  - `crypto/vault.ts` — AES-256-GCM шифрование
  - `services/ton/TonService.ts` — заглушка для TON API
  - `services/wallet/WalletService.ts` — заглушка для wallet операций
  - `services/validation/ValidationPipeline.ts` — заглушка для валидации
  - `store/walletStore.ts` — Zustand store
  - `screens/WelcomeScreen.tsx`, `MainScreen.tsx` — базовые экраны
  - `components/PasswordInput.tsx`, `HighlightedAddress.tsx`, `WarningCard.tsx`, `CopyButton.tsx` — UI компоненты

### Проблемы

- **Tailwind CSS 4 PostCSS plugin**: первоначальная конфигурация с `tailwindcss` в `postcss.config.js` вызывала ошибку. Решено установкой `@tailwindcss/postcss`.
- **TypeScript unused variables**: strict mode с `noUnusedLocals` и `noUnusedParameters` требовал использования всех объявленных переменных. Для заглушек добавлены методы (например, `getConfig()`) или использованы underscore-префиксы.
- **Vitest types**: первоначальная конфигурация с `defineConfig` из `vite` не распознавала поле `test`. Решено использованием `defineConfig` из `vitest/config`.
- **ArrayBuffer typing**: Web Crypto API требует `ArrayBuffer`, а не `ArrayBufferLike`. Решено явным приведением типов.

### Следующие шаги

- Задача 3.1: Реализация модуля KDF с полноценной Argon2id интеграцией и тестами.
- Задача 3.2: Реализация Encrypted Vault с тестами.
