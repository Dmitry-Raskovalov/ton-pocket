# Техническое задание: TON Testnet Wallet

---

## 1. Общие сведения

### 1.1 Назначение

Self-custodial криптокошелёк для TON testnet — веб-приложение (SPA), позволяющее создавать, импортировать и управлять кошельками без собственного backend-сервера.

### 1.2 Целевая платформа

Standalone SPA, работающее в любом современном браузере (Chrome, Firefox, Safari, Edge).

### 1.3 Ограничения

- Без собственного backend
- Только TON testnet
- Минималистичный UI
- Шифрование ключей обязательно
- Production-grade безопасность не требуется, но архитектурные решения должны быть обоснованы

### 1.4 Сеть и API

| Параметр | Значение |
|----------|----------|
| Сеть | TON Testnet |
| API endpoint | `https://testnet.toncenter.com/api/v2/jsonRPC` |
| API key | Бесплатный, через `@tonapibot` в Telegram |

---

## 2. Технологический стек

| Компонент | Технология | Обоснование |
|-----------|-----------|-------------|
| Фреймворк | React 18 + TypeScript | Экосистема, типизация, совместимость с TON SDK |
| Сборка | Vite | Быстрый dev/build, нативная поддержка TS |
| Роутинг | Wouter | 1.3KB, достаточен для 5-7 экранов |
| Состояние | Zustand | 1KB, минимум бойлерплейта, persist middleware |
| Стили | Tailwind CSS | Utility-first, минимальный CSS в проде |
| Блокчейн | `@ton/ton`, `@ton/crypto` | Официальный SDK, TypeScript, все версии контрактов |
| KDF | `argon2-browser` (WASM) | Memory-hard, OWASP #1 |
| KDF fallback | Web Crypto API (PBKDF2) | Если WASM недоступен |
| Шифрование | Web Crypto API (AES-256-GCM) | Нативная поддержка, zero dependencies |
| Оценка пароля | `zxcvbn-ts` | Tree-shakeable (~50KB vs 400KB у zxcvbn) |
| QR-код | `qrcode.react` | React-компонент, SVG |

**Оценка бандла: ~300KB gzip** (из них ~150KB — `@ton/ton`).

---

## 3. Архитектура

### 3.1 Высокоуровневая структура

```
┌─────────────────────────────────────────────────┐
│                  SPA (React)                     │
├──────────┬──────────┬──────────┬────────────────┤
│ Onboard  │  Main    │  Send    │   Receive      │
│ Screen   │  Screen  │  Screen  │   Screen       │
├──────────┴──────────┴──────────┴────────────────┤
│               State Management                   │
│                  (Zustand)                        │
├─────────────────────────────────────────────────┤
│             Wallet Service Layer                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Key Mgmt │  │ TX Build │  │  Validation   │  │
│  │ & Vault  │  │ & Sign   │  │  & Warnings   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
├─────────────────────────────────────────────────┤
│          TON SDK (@ton/ton + @ton/crypto)        │
│            + TonClient (testnet RPC)             │
├─────────────────────────────────────────────────┤
│           Encrypted localStorage                 │
│    mnemonic / address book / settings            │
└─────────────────────────────────────────────────┘
```

### 3.2 Структура проекта

```
src/
├── crypto/
│   ├── vault.ts               # EncryptedVault: encrypt/decrypt мнемоники
│   ├── kdf.ts                 # Argon2id + PBKDF2 fallback
│   └── types.ts               # EncryptedVault interface
│
├── services/
│   ├── wallet/
│   │   ├── create.ts          # Создание нового кошелька
│   │   ├── import-mnemonic.ts # Импорт по мнемонике
│   │   ├── import-key.ts      # [ОПЦИЯ] Импорт по приватному ключу
│   │   ├── export.ts          # Экспорт мнемоники (+ [ОПЦИЯ] ключа)
│   │   ├── contract-factory.ts# Фабрика контрактов (v3R2/v4R2/v5R1)
│   │   ├── detect-version.ts  # Автодетекция версии при импорте
│   │   └── types.ts
│   │
│   ├── ton/
│   │   ├── client.ts          # TonClient wrapper (testnet)
│   │   ├── balance.ts         # Получение баланса
│   │   ├── transactions.ts    # История транзакций
│   │   └── transfer.ts        # Формирование и отправка TX
│   │
│   ├── validation/
│   │   ├── validate-send.ts   # Оркестратор валидации (pipeline)
│   │   ├── address-format.ts  # Валидация формата адреса
│   │   ├── self-send.ts       # Проверка отправки самому себе
│   │   ├── account-state.ts   # Проверка инициализации получателя
│   │   ├── balance-check.ts   # Проверка баланса и комиссии
│   │   ├── address-similarity.ts # Поиск похожих адресов
│   │   └── types.ts           # Warning, ValidationResult
│   │
│   └── address-book/
│       ├── address-book.ts    # CRUD + similarity search
│       └── types.ts
│
├── store/
│   ├── wallet-store.ts        # Zustand: wallet state
│   ├── transaction-store.ts   # Zustand: transactions + search
│   └── ui-store.ts            # Zustand: loading, modals, toasts
│
├── screens/
│   ├── Onboarding/
│   │   ├── WelcomeScreen.tsx
│   │   ├── CreateWalletScreen.tsx
│   │   ├── ImportMnemonicScreen.tsx
│   │   ├── ImportKeyScreen.tsx        # [ОПЦИЯ]
│   │   ├── SelectVersionScreen.tsx
│   │   └── BackupMnemonicScreen.tsx
│   │
│   ├── Main/
│   │   └── MainScreen.tsx
│   │
│   ├── Send/
│   │   ├── SendScreen.tsx
│   │   └── ConfirmScreen.tsx
│   │
│   ├── Receive/
│   │   └── ReceiveScreen.tsx
│   │
│   └── Settings/
│       ├── SettingsScreen.tsx
│       └── ExportScreen.tsx
│
├── components/
│   ├── HighlightedAddress.tsx
│   ├── WarningCard.tsx
│   ├── WarningList.tsx
│   ├── PasswordInput.tsx
│   ├── CopyButton.tsx
│   ├── TransactionItem.tsx
│   ├── SearchBar.tsx
│   ├── Loader.tsx
│   └── Toast.tsx
│
├── hooks/
│   ├── useBalance.ts
│   ├── useTransactions.ts
│   └── useWallet.ts
│
├── App.tsx
├── main.tsx
└── vite-env.d.ts
```

---

## 4. Безопасность и шифрование

### 4.1 Схема шифрования

```
  password (user input, min 8 chars, zxcvbn score ≥ 2)
      │
      ▼
  ┌──────────┐     ┌───────────┐
  │ Argon2id │────▶│ AES-256   │
  │  (KDF)   │     │   GCM     │
  └──────────┘     └─────┬─────┘
      ▲                  │
      │                  ▼
   salt (16 bytes)   encrypted blob ──▶ localStorage
   iv (12 bytes)
```

### 4.2 Формат зашифрованного хранилища

```typescript
interface EncryptedVault {
  version: 1;
  kdf: 'argon2id' | 'pbkdf2';
  kdfParams: {
    salt: string;              // base64, 16 bytes random
    memory?: number;           // Argon2: 65536 (64MB)
    iterations?: number;       // Argon2: 3 / PBKDF2: 600000
    parallelism?: number;      // Argon2: 1
    hash?: string;             // PBKDF2: 'SHA-256'
  };
  cipher: 'aes-256-gcm';
  iv: string;                  // base64, 12 bytes random
  ciphertext: string;          // base64
}
```

### 4.3 Параметры KDF

| Параметр | Argon2id (primary) | PBKDF2 (fallback) |
|----------|-------------------|-------------------|
| Memory | 64 MB | — |
| Iterations | 3 | 600 000 |
| Parallelism | 1 | — |
| Hash | — | SHA-256 |
| Output | 256 bit | 256 bit |

### 4.4 Требования к паролю

- Минимальная длина: 8 символов
- Оценка через `zxcvbn-ts`, минимальный score: 2 из 4
- UI показывает индикатор силы пароля и текстовую подсказку

### 4.5 Хранение данных

| Данные | Хранилище | Шифрование |
|--------|-----------|-----------|
| Мнемоника | localStorage | ✅ AES-256-GCM |
| Версия контракта, публичный адрес | localStorage | ❌ (публичные данные) |
| Адресная книга | localStorage | ❌ (публичные адреса) |
| Настройки UI | localStorage | ❌ |

---

## 5. Управление кошельком

### 5.1 Версии контрактов

| Версия | Создание | Импорт |
|--------|---------|--------|
| v3R2 | ❌ | ✅ автодетекция |
| v4R2 | ✅ по умолчанию | ✅ автодетекция |
| v5R1 | ❌ | ✅ автодетекция |

Одна мнемоника → один keypair → разные адреса для разных версий контрактов. При импорте система проверяет все три версии, показывает найденные кошельки с балансами, даёт пользователю выбор.

### 5.2 Создание кошелька

```
Welcome Screen
    │
    └──▶ [Create New Wallet]
             │
             ▼
         Set Password
             │ (ввод + подтверждение + zxcvbn оценка)
             ▼
         Generating...
             │ (mnemonicNew() → keypair → v4R2 contract)
             ▼
         Backup Mnemonic
             │ (показ 24 слов, подтверждение "I saved it")
             ▼
         Main Screen
```

### 5.3 Импорт по мнемонике

```
Welcome Screen
    │
    └──▶ [Import Existing]
             │
             ▼
         Enter 24 Words
             │ (валидация мнемоники через @ton/crypto)
             ▼
         Auto-detect Versions
             │ (параллельный запрос состояния v3R2/v4R2/v5R1)
             │
             ├──▶ [1 найдена или 0] → Set Password → Main
             │
             └──▶ [несколько найдено] → Select Version → Set Password → Main
```

Если ни одна версия не найдена на блокчейне — используется v4R2 по умолчанию.

### 5.4 [ОПЦИЯ] Импорт по приватному ключу

Ввод 64-byte Ed25519 ключа в hex или base64. Далее — аналогичный флоу автодетекции версий. Особенность: мнемоника отсутствует, vault хранит приватный ключ напрямую.

### 5.5 Экспорт мнемоники

1. Запросить пароль
2. Расшифровать vault
3. Показать предупреждение с обязательным чекбоксом «I understand the risks»
4. Показать 24 слова + кнопка копирования
5. Автоматическое скрытие через 60 секунд

### 5.6 [ОПЦИЯ] Экспорт приватного ключа

Аналогичный флоу: пароль → предупреждение → чекбокс → показ hex → автоскрытие.

---

## 6. Экраны приложения

> Визуальный дизайн и wireframes создаются отдельно. Данный раздел описывает функциональные требования к каждому экрану.

### 6.1 Welcome Screen

**Назначение:** точка входа для нового пользователя.

**Элементы:**
- Логотип / название приложения
- Пометка «Testnet»
- Кнопка «Create New Wallet»
- Кнопка «Import Existing Wallet»

**Условие показа:** отсутствие сохранённого vault в localStorage.

---

### 6.2 Create Wallet Screen

**Назначение:** создание нового кошелька.

**Шаги:**

**Шаг 1 — Set Password:**
- Поле ввода пароля
- Поле подтверждения пароля
- Индикатор силы пароля (zxcvbn)
- Текстовая подсказка к паролю
- Кнопка «Continue» (активна при score ≥ 2 и совпадении полей)

**Шаг 2 — Backup Mnemonic:**
- Отображение 24 слов (нумерованный список)
- Кнопка копирования всех слов
- Предупреждение: «Write down these words and store them safely»
- Чекбокс: «I have saved my recovery phrase»
- Кнопка «Continue» (активна после чекбокса)

---

### 6.3 Import Mnemonic Screen

**Назначение:** импорт существующего кошелька по мнемонике.

**Элементы:**
- 24 поля ввода (или textarea с разделением по пробелам/переносам)
- Кнопка «Paste» для вставки из буфера
- Валидация: проверка через `mnemonicValidate()` из `@ton/crypto`
- Сообщение об ошибке при невалидной мнемонике
- Кнопка «Continue»

**После валидации:**
- Автодетекция версий контрактов
- Если найдено несколько — экран выбора версии с адресами и балансами
- Далее — Set Password (аналогично Create)

---

### 6.4 Main Screen

**Назначение:** основной экран после входа в кошелёк.

**Функциональные блоки:**

**Блок 1 — Header:**
- Название приложения + пометка «Testnet»
- Кнопка настроек

**Блок 2 — Wallet Info:**
- Адрес кошелька (сокращённый) + кнопка копирования
- Текущий баланс в TON
- Кнопки «Receive» и «Send»

**Блок 3 — Transaction History:**
- Заголовок «Transactions»
- Поле поиска
- Фильтр направления: All / In / Out
- Список транзакций (элементы):
  - Направление (↓ received / ↑ sent)
  - Сумма
  - Адрес контрагента (сокращённый) + label из адресной книги
  - Дата и время
  - Комментарий (если есть)
- Кнопка «Load more» (пагинация по 20)
- Состояние «No transactions yet» для пустого кошелька

**Поведение:**
- Polling баланса каждые 10 секунд
- Автообновление списка транзакций
- Индикатор «обновлено N сек назад»

---

### 6.5 Receive Screen

**Назначение:** отображение адреса для получения средств.

**Элементы:**
- QR-код с адресом кошелька
- Полный адрес кошелька (текстом)
- Кнопка «Copy Address» с feedback «Copied!»
- Предупреждение: «This is a testnet address. Do not send real TON here.»
- Кнопка «Back»

---

### 6.6 Send Screen

**Назначение:** отправка TON на указанный адрес.

**Состоит из двух шагов.**

**Шаг 1 — Input Form:**
- Поле «Recipient address»
- Поле «Amount» + кнопка «MAX» (баланс минус ~0.01 TON на комиссию)
- Поле «Comment» (опциональное)
- Отображение доступного баланса
- Inline-предупреждения (появляются по мере ввода):
  - Невалидный формат адреса
  - Отправка самому себе
  - Похожий адрес из адресной книги (clipboard poisoning)
- Кнопка «Continue»

**Шаг 2 — Confirmation:**
- Адрес получателя с highlight первых 4 и последних 4 символов
- Сумма
- Комментарий (если указан)
- Оценка комиссии (~0.005 TON)
- Список предупреждений (собранных из pipeline валидации):
  - Каждое blocking-предупреждение содержит чекбокс подтверждения
  - Non-blocking предупреждения отображаются без чекбокса
- Поле ввода пароля
- Кнопка «Send» (активна когда: все чекбоксы отмечены + пароль введён)
- Кнопка «Cancel»

**Шаг 3 — Result:**
- Состояние Pending: спиннер + «Sending...»
- Успех: сообщение + хеш транзакции + redirect на Main
- Ошибка: детали ошибки + кнопка «Try Again»
- Timeout (30 сек): предупреждение «Transaction may have been sent. Check your balance.» + redirect на Main
- Неверный пароль: ошибка до отправки в сеть

---

### 6.7 Settings Screen

**Назначение:** управление кошельком и безопасностью.

**Элементы:**
- Информация: версия контракта, полный адрес
- «Export Recovery Phrase» (требует пароль)
- [ОПЦИЯ] «Export Private Key» (требует пароль)
- «Change Password»
- «Delete Wallet» (danger zone, с подтверждением)
- Информация о сети: TON Testnet

---

## 7. Защита от подмены адреса

### 7.1 Pipeline валидации

При отправке транзакции выполняется последовательность проверок. Результат — список предупреждений разной степени серьёзности.

```typescript
interface Warning {
  severity: 'info' | 'warning' | 'critical' | 'error';
  code: string;
  message: string;
  blocking: boolean;  // true = требует чекбокс для продолжения
}

interface ValidationResult {
  isValid: boolean;
  warnings: Warning[];
  canProceed: boolean; // false если есть неподтверждённые blocking warnings
}
```

### 7.2 Список проверок

| # | Проверка | Severity | Blocking | Описание |
|---|----------|----------|----------|----------|
| 1 | Формат адреса | error | ✅ | Невалидный TON-адрес |
| 2 | Отправка самому себе | warning | ❌ | Все версии контрактов текущего кошелька |
| 3 | Похожий адрес в адресной книге | critical | ✅ чекбокс | Clipboard poisoning: совпадение начала или конца но не целиком |
| 4 | Аккаунт не инициализирован | warning | ✅ чекбокс | Аккаунт не существует на блокчейне |
| 5 | Bounceable на неинициализированный | critical | ✅ чекбокс | Средства bounce-нутся, gas теряется |
| 6 | Frozen аккаунт | critical | ✅ чекбокс | Средства могут быть потеряны |
| 7 | Недостаточно средств | error | ✅ | amount > balance |
| 8 | Не хватит на комиссию | error | ✅ | amount + ~0.01 TON > balance |
| 9 | Низкий остаток | warning | ❌ | Остаток после отправки < 0.05 TON |

### 7.3 Нормализация адресов

Все сравнения адресов через raw-форму (`0:hex...`). Один аккаунт может быть представлен как bounceable, non-bounceable, URL-safe — все формы нормализуются перед сравнением.

### 7.4 Визуальное подтверждение адреса

На экране подтверждения адрес отображается с визуальным выделением первых 4 и последних 4 символов. Пользователь должен сверить эти символы с оригинальным адресом получателя.

### 7.5 Адресная книга

**Автоматическое наполнение:**
- При успешной отправке → адрес получателя (`source: 'sent'`)
- При загрузке входящих транзакций → адреса отправителей (`source: 'received'`)

**Структура записи:**

```typescript
interface AddressBookEntry {
  address: string;        // raw format (0:hex)
  displayAddress: string; // user-friendly format
  label?: string;         // пользовательская метка (опционально)
  lastUsed: number;       // timestamp
  usageCount: number;
  source: 'sent' | 'received' | 'manual';
}
```

**Хранение:** localStorage, без шифрования (адреса публичны).

**Поиск похожих адресов:**
- Совпадение первых 6 символов raw-адреса при различии целиком
- Совпадение последних 6 символов raw-адреса при различии целиком
- При обнаружении — critical warning с деталями совпадения

---

## 8. Поиск по истории транзакций

### 8.1 Текстовый поиск

Единое поле поиска. Матчинг по:
- Адрес отправителя/получателя (частичное совпадение)
- Label из адресной книги
- Комментарий (memo/body) транзакции

### 8.2 Фильтр направления

Три кнопки-переключателя: All / In / Out.

### 8.3 Реализация

Клиентская фильтрация по загруженным транзакциям. Без серверной пагинации поиска.

---

## 9. Работа с сетью

### 9.1 Получение баланса

- Polling каждые 10 секунд на Main Screen
- Принудительное обновление после отправки TX
- Отображение времени последнего обновления

### 9.2 История транзакций

- Загрузка последних 20 транзакций при открытии
- Пагинация по кнопке «Load more» (по 20)
- Автообновление при polling

### 9.3 Отправка транзакции

```
1. Валидация (pipeline, раздел 7)
2. Запрос пароля
3. Расшифровка vault → мнемоника → keypair
4. Формирование transfer message через контракт
5. Подпись secretKey
6. Отправка через TonClient.sendExternalMessage()
7. Ожидание подтверждения (polling seqno, timeout 30s)
8. Результат → UI
```

### 9.4 Обработка ошибок сети

| Ситуация | Действие |
|----------|----------|
| API недоступен | Retry 3 раза, exponential backoff, затем ошибка |
| Rate limit | Сообщение «Too many requests, wait...» |
| TX без подтверждения | Warning «TX may have been sent» |
| Невалидный ответ API | Generic error |

---

## 10. Опциональный функционал

Реализуется при наличии времени. Не входит в базовый скоуп.

| Фича | Описание |
|------|----------|
| Импорт по приватному ключу | Ввод 64-byte Ed25519 hex/base64, автодетекция версии |
| Экспорт приватного ключа | Password gate → hex display → автоскрытие 60 сек |

---

## 11. Что НЕ входит в скоуп

- Telegram Mini App
- Поддержка токенов (Jettons)
- Поддержка NFT
- Несколько кошельков одновременно
- Mainnet
- Мультиязычность
- Биометрическая аутентификация
- dApp-коннектор (TON Connect)
- Push-уведомления

---

## 12. План реализации

### Фаза 0: Дизайн (параллельно с Фазой 1)

| Задача | Результат |
|--------|-----------|
| Wireframes всех экранов | Figma / аналог |
| Утверждение wireframes | Финальные макеты |

> Wireframes создаются отдельно. Разработка UI-компонентов и экранов начинается после утверждения wireframes. Инфраструктура и сервисный слой не зависят от wireframes и разрабатываются параллельно.

---

### Фаза 1: Инфраструктура (~12 часов)

Не зависит от wireframes. Может выполняться параллельно с Фазой 0.

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Инициализация проекта (Vite + React + TS + Tailwind + Wouter) | 1 | — |
| Crypto vault (AES-256-GCM + Argon2id + PBKDF2 fallback) | 4 | — |
| TonClient wrapper + базовые API-методы (баланс, транзакции, отправка) | 4 | — |
| Zustand stores (wallet, transactions, ui) | 2 | — |
| Contract factory (v3R2 / v4R2 / v5R1) + автодетекция | 1 | TonClient |

---

### Фаза 2: Wallet Core Logic (~8 часов)

Не зависит от wireframes.

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Создание кошелька (генерация мнемоники, keypair, контракт) | 2 | Crypto vault, Contract factory |
| Импорт по мнемонике (валидация, автодетекция версий) | 3 | Crypto vault, Contract factory, TonClient |
| Экспорт мнемоники (расшифровка vault) | 1 | Crypto vault |
| Address book (CRUD, автозаполнение, similarity search) | 2 | — |

---

### Фаза 3: Validation Pipeline (~7 часов)

Не зависит от wireframes.

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Валидация формата адреса + нормализация | 1 | — |
| Self-send check | 0.5 | Wallet store |
| Account state check (uninit/frozen/bounce) | 2 | TonClient |
| Balance + fee check | 1 | Wallet store |
| Address similarity check | 1.5 | Address book |
| Validate-send orchestrator | 1 | Все выше |

---

### Фаза 4: UI — компоненты (~6 часов)

**Зависит от wireframes.** Начинается после утверждения дизайна.

| Задача | Часы | Зависимости |
|--------|------|-------------|
| HighlightedAddress | 1 | Wireframes |
| WarningCard + WarningList (с чекбоксами) | 1.5 | Wireframes |
| PasswordInput + strength indicator | 1.5 | Wireframes, zxcvbn-ts |
| CopyButton, TransactionItem, SearchBar | 1.5 | Wireframes |
| Loader, Toast | 0.5 | Wireframes |

---

### Фаза 5: UI — экраны (~18 часов)

**Зависит от wireframes + Фазы 1-4.**

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Welcome Screen | 1 | Компоненты |
| Create Wallet (password + backup mnemonic) | 3 | Wallet core, компоненты |
| Import Mnemonic (ввод слов + выбор версии) | 3 | Wallet core, компоненты |
| Main Screen (баланс + транзакции + поиск + фильтры) | 4 | TonClient, stores, компоненты |
| Receive Screen (адрес + QR + копирование) | 1.5 | qrcode.react, компоненты |
| Send Screen (форма + confirmation + result) | 4 | Validation pipeline, компоненты |
| Settings Screen (экспорт + change password + delete) | 1.5 | Wallet core, компоненты |

---

### Фаза 6: Интеграция и polish (~5 часов)

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Роутинг + unlock flow (ввод пароля при старте) | 1.5 | Все экраны |
| Polling баланса + автообновление транзакций | 1 | Main screen, TonClient |
| Обработка ошибок сети (retry, timeout, rate limit) | 1.5 | TonClient |
| End-to-end тестирование на testnet | 1 | Всё |

---

### Фаза 7 (опционально): Import/Export по ключу (~5 часов)

| Задача | Часы | Зависимости |
|--------|------|-------------|
| Import by private key (logic + UI) | 2.5 | Wallet core, компоненты |
| Export private key (password gate + display) | 2.5 | Wallet core, компоненты |

---

### Сводная таблица

```
┌──────────────────────────────────────┬──────────┬────────────────┐
│ Фаза                                │ Часы     │ Wireframes     │
├──────────────────────────────────────┼──────────┼────────────────┤
│ 0. Дизайн (wireframes)              │ отдельно │ создаются тут  │
│ 1. Инфраструктура                   │ 12       │ не нужны       │
│ 2. Wallet Core Logic                │ 8        │ не нужны       │
│ 3. Validation Pipeline              │ 7        │ не нужны       │
│ 4. UI — компоненты                  │ 6        │ ✅ нужны       │
│ 5. UI — экраны                      │ 18       │ ✅ нужны       │
│ 6. Интеграция и polish              │ 5        │ ✅ нужны       │
├──────────────────────────────────────┼──────────┼────────────────┤
│ ИТОГО (обязательное)                │ 56 ч     │                │
│                                     │ ~7 дней  │                │
├──────────────────────────────────────┼──────────┼────────────────┤
│ 7. [ОПЦИЯ] Import/Export по ключу   │ 5        │ ✅ нужны       │
├──────────────────────────────────────┼──────────┼────────────────┤
│ ИТОГО (с опциями)                   │ 61 ч     │                │
│                                     │ ~7.5 дней│                │
└──────────────────────────────────────┴──────────┴────────────────┘
```

**Параллелизм:** Фазы 0-3 могут выполняться параллельно. При наличии двух разработчиков (дизайн + код) или при быстром согласовании wireframes, общий срок сокращается до ~5-6 дней.

