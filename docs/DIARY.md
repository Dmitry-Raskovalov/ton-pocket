# Дневник разработки TON Testnet Wallet

## 2026-03-31 — Задача 4.4: Сервис отправки транзакций
### Наблюдения
- `WalletContract.createTransfer()` ожидает сообщения в формате `internal()` из `@ton/ton`, а не raw объект с `info.type = 'internal'`.
- При успешном increment seqno транзакция подтверждена, но hash нужно запрашивать отдельно через `getTransactions(address, { limit: 1 })`.
- `getContractState()` возвращает `seqno` только если контракт deployed (`state === 'active'`), иначе — undefined или 0.

### Решения
- Использована функция `internal({ to, value, bounce, body })` для создания сообщений — это правильный API для `WalletContractV4/V3R2/V5R1`.
- Поддержка двух форматов адреса получателя: строка (user-friendly или raw) или готовый объект `Address` — гибкость для UI и внутренних вызовов.
- Константа `ESTIMATED_FEE = 10_000_000n` экспортируется для использования в валидации и UI (кнопка MAX).
- Polling реализован через `while` цикл с `sleep(2000)` и проверкой `Date.now() - startTime < 30000`.

### Проблемы
- Первичная реализация использовала неверный формат сообщений — `contract.createTransfer()` выбрасывал "Cannot convert undefined to a BigInt". Исправлено через `internal()` из `@ton/ton`.
- Тестовые адреса должны быть валидными — генерировались через `WalletContractV4.create()` с разными public keys.

---

## 2026-03-31 — Задача 5.3: UI Store
### Наблюдения
- `isLoading`, `toasts`, `unlockAttempts` — эфемерные: при перезагрузке всегда начинают с дефолта. Persist нужен только для `lockedUntil`.
- `incrementUnlockAttempts` объединяет логику подсчёта и блокировки в одном action — это предотвращает race condition между двумя отдельными вызовами.
- Toast id генерируется через `Date.now() + Math.random()` — достаточно для клиентского использования без UUID-библиотеки.

### Решения
- Persist-ключ `'ton-pocket-ui'` (отдельный от `'ton-pocket-wallet'`) — сторы независимы в localStorage.
- При достижении лимита (≥ 5) сразу сбрасываем `unlockAttempts` в 0 — пользователь может снова пробовать после истечения блокировки без лишнего сброса.

### Проблемы
- Нет. 22 теста прошли с первого запуска (165 всего).

---

## 2026-03-31 — Задача 7.3: Проверка состояния аккаунта получателя

### Наблюдения
- `getContractState` возвращает объект с полем `state: 'active' | 'uninit' | 'frozen'` — типы из `@ton/ton` не экспортируют этот union явно, поэтому аннотируем локально через `{ state: string }`.
- Bounce-риск возникает только при комбинации bounceable-адреса + uninit-состояния — оба условия должны выполняться одновременно.

### Решения
- При любой ошибке (сеть или невалидный адрес) возвращаем `[]` — не блокируем отправку из-за недоступности API.
- `frozen` → немедленный return без добавления uninit-предупреждения — не смешиваем независимые проблемы.

### Проблемы
- Нет. 6 тестов прошли с первого запуска.

---

## 2026-03-31 — Задача 7.2: Проверка self-send

### Наблюдения
- `createContract()` из `contract-factory.ts` уже умеет генерировать адреса всех трёх версий из publicKey — переиспользуем без дублирования логики.
- Тип `Warning` добавлен в `types.ts` (не в отдельный файл) — он является частью validation-слоя и логически принадлежит там.

### Решения
- `blocking: false` для self-send — это предупреждение, а не блокирующая ошибка: пользователь может осознанно отправить себе.
- Сравнение через `toRawString()` — нормализованный формат устраняет различия bounceable/non-bounceable.

### Проблемы
- Нет. 5 тестов прошли с первого запуска.

---

## 2026-03-31 — Задача 7.1: Валидация формата адреса

### Наблюдения
- `Address.parseFriendly()` автоматически определяет `isBounceable` и `isTestOnly` флаги — не нужна ручная проверка префикса.
- Raw-формат (`0:hex`) определяется по наличию `:` в строке; все остальные форматы обрабатываются через `parseFriendly`.
- `Address.toRawString()` возвращает строку в формате `workchain:hexhash` — это канонический формат для хранения и сравнения адресов.

### Решения
- Нормализация через единую точку `normalizeAddress()` — все downstream проверки (7.2–7.5) будут работать с raw.
- Raw-адрес при `parseAddress` возвращает `bounceable: false, isTestnet: false` — это разумный default для raw-формата.

### Проблемы
- Нет. 20 тестов прошли с первого запуска.

---

## 2026-03-31 — Задача 6.5: Адресная книга

### Наблюдения
- `findSimilar` сравнивает hex-часть адреса (после `0:`), чтобы не зависеть от формата prefixа workchain.
- Константа `SIMILARITY_CHARS = 6` вынесена в модуль — соответствует PLAN.md (первые/последние 6 символов).
- Singleton `addressBook` экспортируется для использования из validation pipeline (задача 7.3).

### Решения
- Хранение — `Map<rawAddress, entry>` в памяти + сериализация в localStorage как JSON-массив; восстановление при создании экземпляра.
- `matchType: 'both'` возвращается если одновременно совпадают prefix и suffix — это наиболее опасный случай clipboard poisoning.

### Проблемы
- Нет. Все 15 тестов прошли с первого запуска.

## 2026-03-31 — Задача 5.1: Wallet Store
### Наблюдения
- Zustand v5 persist middleware пишет в localStorage **асинхронно** (через microtask). Прямая проверка `localStorage.getItem` сразу после `set()` возвращает `null` — нужен `await new Promise(r => setTimeout(r, 0))`.
- Старый `walletStore.ts` использовал вложенный объект `wallet: WalletState | null` — не соответствует PLAN.md. Новый store плоский.
- `Object.defineProperty(globalThis, 'localStorage', ...)` в тестах не перехватывает запись persist — лучше использовать встроенный jsdom localStorage с `localStorage.clear()` в `beforeEach`.

### Решения
- `WalletVersion` определён в `store/types.ts` и переиспользуется во всём проекте.
- `partialize` явно ограничивает сохраняемые поля: `address`, `version`, `publicKey`; `balance` и `isUnlocked` всегда сбрасываются при перезагрузке.
- Селекторы `isWalletCreated()` и `hasWallet()` — обычные функции (не хуки), вызываемые вне React (например, в guards роутера).

### Проблемы
- Нет. После замены localStorage-мока на нативный jsdom все 16 тестов прошли.

---

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
---

## 2026-03-31 — Задача 4.1: TonClient wrapper

### Наблюдения
- `TonClient` из `@ton/ton` принимает `httpAdapter?: AxiosAdapter` (не кастомный fetch), где `AxiosAdapter = (config: InternalAxiosRequestConfig) => AxiosPromise`.
- Внутри адаптера используется `globalThis.fetch` для отправки запросов — это позволяет заменить transport без мока axios.
- Retry-логика вынесена в отдельную `withRetry<T>()` утилиту и тестируется независимо от клиента.
- `vi.useFakeTimers()` + `mockRejectedValue` создаёт "unhandled rejection" если Promise не обёрнут перед `advanceTimersByTimeAsync`. Решено через `.then(v => ..., e => ...)` паттерн.

### Решения
- Singleton сбрасывается через `resetTonClient()` в тестах — не нужно моковать модуль целиком.
- HTTP 429 → `RateLimitError`, network fail → `NetworkError`, другие non-2xx → `ApiError`. `RateLimitError` и `ApiError` не ретраятся.
- `import.meta.env` читается через безопасный try/catch чтобы работало в jsdom.

### Проблемы
- Нет. Все 13 тестов прошли с первого прогона (после правки unhandled rejection).

---

## 2026-03-31 — Задача 4.2: Сервис получения баланса
### Наблюдения
- `TonClient.getBalance(Address)` принимает объект `Address`, не строку — необходим `Address.parse()`.
- Несуществующий аккаунт бросает ошибку с текстом "not found"; перехватываем и возвращаем `0n`.
- `formatTon` реализована через bigint арифметику без `Number` — избегает потери точности при больших суммах.

### Решения
- TonClient мокается через `vi.mock('./client')` — тесты не зависят от сети.
- Негативное значение обрабатывается через `abs = nanotons < 0n ? -nanotons : nanotons`.

### Проблемы
- Нет. 12/12 тестов с первого прогона.

---

## 2026-03-31 — Задача 4.3: Сервис истории транзакций

### Наблюдения
- `TonClient.getTransactions` возвращает `Transaction[]` из `@ton/core` — сложная структура с `inMessage`, `outMessages` (Dictionary) и `totalFees`.
- Text comment cell: первые 32 бита = opcode 0x00000000, затем UTF-8 строка через `loadStringTail()`. Нераспознанный opcode → `null`.
- `Address.parse()` принимает только user-friendly формат. Для raw (`0:...`) нужен `Address.parseRaw()`. Добавил автодетекцию по наличию `:` в строке — теперь оба формата работают в `getBalance` и `getTransactions`.
- Deploy-транзакция: `inMessage` — `external-in`, out-messages пустые → direction `'out'`, amount `0n`.
- Bounce: флаг `bounced` на inMessage не меняет логику парсинга — транзакция всё равно `'in'`.

### Решения
- Мок `Transaction` строится через реальные `@ton/core` классы (`beginCell`, `Dictionary.empty()`) — гарантирует правильные типы без полного мока библиотеки.
- Параметры пагинации `lt`/`hash` пробрасываются напрямую в `TonClient.getTransactions`.

### Проблемы
- Адрес `EQBvW8Z...` в тесте имел невалидную контрольную сумму. Решено переходом на `Address.parseRaw()` с raw-адресами в тестах.

---

## 2026-03-31 — Задача 4.5: Contract Factory и автодетекция версий

### Наблюдения
- `WalletContractV3R2`, `WalletContractV4`, `WalletContractV5R1` — все создаются через `ClassName.create({ workchain, publicKey })`. Один и тот же publicKey даёт три разных адреса.
- `TonClient.getContractState(address)` возвращает `{ state: 'active' | 'uninitialized' | 'frozen', balance, ... }`. Deployed = `state === 'active'`.
- `Promise.all` на три параллельных запроса — оптимально для автодетекции. Ошибка одного версии не ломает остальные (возвращаем `null`, потом фильтруем).
- `Address.toString({ bounceable: true, testOnly: true })` — правильный формат для testnet user-friendly адреса (начинается с `k`).

### Решения
- `detectVersions` объединяет фабрику и детекцию в одном файле — нет смысла разделять по отдельным файлам для MVP.
- При ошибке `getContractState` версия молча пропускается (возвращается `null`) — graceful degradation для нестабильного API.
- `pickDefaultWallet` — простая утилита, возвращает первый элемент; порядок в `ALL_VERSIONS` (`v3R2`, `v4R2`, `v5R1`) определяет приоритет.

### Проблемы
- Нет. 12/12 тестов с первого прогона.

