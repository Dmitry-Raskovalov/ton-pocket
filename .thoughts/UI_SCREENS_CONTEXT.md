# Контекст: Реализация UI-экранов TON Pocket

> Сохранено: 2026-04-01  
> Источник: исследование проекта перед началом реализации экранов (раздел 9 PLAN.md)

---

## Текущий статус реализации

### UI-компоненты (раздел 8) — ВСЕ DONE ✓

| Компонент | Файл | Статус |
|-----------|------|--------|
| PasswordInput | `src/components/PasswordInput.tsx` | DONE |
| HighlightedAddress | `src/components/HighlightedAddress.tsx` | DONE |
| WarningCard | `src/components/WarningCard.tsx` | DONE |
| WarningList | `src/components/WarningList.tsx` | DONE |
| CopyButton | `src/components/CopyButton.tsx` | DONE |
| TransactionItem | `src/components/TransactionItem.tsx` | DONE |
| SearchBar | `src/components/SearchBar.tsx` | DONE |
| Loader | `src/components/Loader.tsx` | DONE |
| Toast | `src/components/Toast.tsx` | DONE |

Все экспортируются через `src/components/index.ts`.

### UI-экраны (раздел 9) — ЧАСТИЧНО

| Экран | Файл | Статус | Примечание |
|-------|------|--------|-----------|
| WelcomeScreen | `src/screens/WelcomeScreen.tsx` | ? | Файл есть, но PLAN.md помечает как TODO — нужна проверка |
| MainScreen | `src/screens/MainScreen.tsx` | ? | Файл есть, но PLAN.md помечает как TODO — нужна проверка |
| CreateWalletScreen | — | TODO | |
| ImportMnemonicScreen | — | TODO | |
| ReceiveScreen | — | TODO | |
| SendScreen + ConfirmScreen | — | TODO | |
| SettingsScreen + ExportScreen | — | TODO | |

Экраны экспортируются через `src/screens/index.ts`.

---

## Дизайн-макеты

Все макеты лежат в `design/stitch_create_wallet_step_1/<папка>/code.html`.  
Реестр маппинга: `design/SCREENS_REGISTRY.md`.

| Папка | Экран/компонент |
|-------|----------------|
| `welcome_screen` | WelcomeScreen |
| `unlock_screen` | UnlockScreen (не в PLAN MVP) |
| `create_wallet_step_1` | CreateWalletScreen — шаг пароля |
| `create_wallet_step_2` | CreateWalletScreen — шаг мнемоники |
| `import_wallet_step_1_enter_mnemonic` | ImportMnemonicScreen — ввод слов |
| `import_wallet_step_2_select_version` | ImportMnemonicScreen — выбор версии |
| `import_wallet_step_3_set_password` | ImportMnemonicScreen — пароль |
| `main_screen` | MainScreen |
| `main_screen_empty_state` | MainScreen — пустое состояние |
| `receive_screen` | ReceiveScreen |
| `send_ton_input` | SendScreen — ввод |
| `confirm_transaction` | SendScreen — подтверждение |
| `send_result_pending` | SendScreen — ожидание |
| `send_result_success` | SendScreen — успех |
| `send_result_error` | SendScreen — ошибка |
| `send_result_timeout` | SendScreen — таймаут |
| `settings_screen` | SettingsScreen |
| `export_recovery_step_1_verify_password` | ExportScreen — пароль |
| `export_recovery_step_2_show_phrase` | ExportScreen — показ фразы |
| `change_password_modal` | SettingsScreen — модалка смены пароля |
| `delete_wallet_modal` | SettingsScreen — модалка удаления |
| `component_sheet_ui_kit` | Референс компонентов |
| `nodal_slate` | Концептуальный (нет code.html) |

---

## Дизайн-система

### Цветовые токены (из DESIGN_BRIEF.md раздел 3.1)

> **ВАЖНО:** В `tailwind.config.js` используются MD3-стиль токены (`background`, `surface`, `on-surface`, `primary: #a0caff`), а DESIGN_BRIEF описывает другие значения. Нужно сверить с тем, что реально используется в существующих компонентах!

| Токен DESIGN_BRIEF | Hex | Tailwind-класс (текущий конфиг) |
|--------------------|-----|--------------------------------|
| `--color-bg` | `#0F1114` | `bg-background` (`#111317`) |
| `--color-surface` | `#1A1D23` | `bg-surface` (`#111317`) |
| `--color-surface-hover` | `#22262E` | `bg-surface-container-low` |
| `--color-border` | `#2E3340` | `border-outline-variant` (`#414751`) |
| `--color-border-focus` | `#4A90D9` | `border-primary` (`#a0caff`) |
| `--color-text-primary` | `#F0F2F5` | `text-on-surface` (`#e2e2e6`) |
| `--color-text-secondary` | `#8B93A6` | `text-on-surface-variant` (`#c1c7d2`) |
| `--color-primary` | `#4A90D9` | `text-primary` / `bg-primary` (`#a0caff`) |
| `--color-success` | `#34C759` | нет прямого токена! |
| `--color-warning` | `#F5A623` | `tertiary` (`#ffb955`) |
| `--color-error` | `#E53E3E` | `error` (`#ffb4ab`) |

Текущий tailwind.config.js использует Material Design 3 палитру. Это нормально если компоненты уже адаптированы под неё.

### Типографика (DESIGN_BRIEF раздел 3.2)

| Применение | Размер | Вес |
|-----------|--------|-----|
| Баланс (heading-1) | 28px | 700 |
| Заголовки экранов (heading-2) | 22px | 600 |
| Заголовки секций (heading-3) | 18px | 600 |
| Основной текст (body) | 15px | 400 |
| Суммы, labels (body-medium) | 15px | 500 |
| Timestamps (body-small) | 13px | 400 |
| Адреса (mono) | 14px | 400 |
| Мнемонические слова (mono-small) | 12px | 400 |
| Текст кнопок (button) | 15px | 600 |

Шрифты: Inter (sans), JetBrains Mono (mono) — загружаются через Google Fonts в `index.css`.

---

## Спецификация экранов (из DESIGN_BRIEF.md раздел 5)

### 9.2 CreateWalletScreen

**Шаг 1 — Set Password:**
- Два `PasswordInput` (пароль + подтверждение)
- Кнопка «Continue» активна при: score ≥ 2 + поля совпадают
- При клике → `createWallet(password)` → показ `Loader`

**Шаг 2 — Backup Mnemonic:**
- Нумерованный список 24 слов (сетка 6×4 или 4×6)
- `CopyButton` для копирования всех слов
- Предупреждение (жёлтый WarningCard)
- Чекбокс «I have saved my recovery phrase»
- Кнопка «Continue» активна только после чекбокса
- При клике → `setWallet()` в store → навигация на MainScreen

### 9.3 ImportMnemonicScreen

**Шаг 1 — Enter Mnemonic:**
- textarea или сетка 24 полей
- Кнопка «Paste» для вставки из буфера
- Валидация через `validateMnemonic()`
- Кнопка «Continue» активна при валидной мнемонике

**Шаг 2 — Select Version (опционально):**
- Показывается если найдено несколько версий контракта
- Карточки с адресами и балансами, кнопка выбора

**Шаг 3 — Set Password:**
- Аналогично CreateWallet шаг 1

### 9.5 ReceiveScreen

- QR-код через `qrcode.react` (SVG), содержимое — полный адрес
- Полный адрес текстом (моноширинный)
- `CopyButton`
- Предупреждение «This is a testnet address»
- Кнопка «Back»

### 9.6 SendScreen + ConfirmScreen

**Шаг 1 — Input Form:**
- Поле Recipient address
- Поле Amount + кнопка MAX (balance - ESTIMATED_FEE)
- Поле Comment (опционально)
- Отображение баланса
- Inline-предупреждения через `validateSend` (debounce 500ms)
- Кнопка «Continue» активна при `isValid=true`

**Шаг 2 — Confirmation:**
- `HighlightedAddress` получателя
- Сумма, комментарий, оценка комиссии (~0.01 TON)
- `WarningList` с чекбоксами
- `PasswordInput` для подтверждения
- Кнопка «Send» активна при: all blocking confirmed + пароль введён
- Расшифровка vault → отправка через `sendTransfer`

**Шаг 3 — Result:**
- Pending: `Loader` + "Sending..."
- Success: сообщение + hash → авторедирект на Main через 3 сек
- Error: детали + «Try Again»
- Timeout: предупреждение → redirect на Main

### 9.7 SettingsScreen + ExportScreen

**SettingsScreen:**
- Версия контракта, полный адрес + `CopyButton`, «TON Testnet»
- Кнопка «Export Recovery Phrase» → ExportScreen
- Кнопка «Change Password» → модалка (текущий пароль → новый × 2)

**ExportScreen:**
- Ввод пароля → предупреждение с чекбоксом → 24 слова + `CopyButton`
- Автоскрытие через 60 сек (таймер с обратным отсчётом)

---

## Зависимости экранов от сервисов/store

| Экран | Зависит от |
|-------|-----------|
| CreateWalletScreen | `src/services/wallet/` → `createWallet()` |
| ImportMnemonicScreen | `src/services/wallet/` → `importByMnemonic()`, `detectVersion()` |
| MainScreen | `wallet-store`, `tx-store`, `src/services/ton/balance.ts`, `src/services/ton/transactions.ts` |
| SendScreen | `validateSend` (7.6), `sendTransfer` (6.3), vault decrypt (6.4), `wallet-store` |
| SettingsScreen | `changePassword` (6.4), vault decrypt (6.4) |
| ExportScreen | vault decrypt (6.4) |

---

## Константы из CLAUDE.md

```typescript
ESTIMATED_FEE = 10000000n  // 0.01 TON
// Endpoint: VITE_TON_ENDPOINT (дефолт: https://testnet.toncenter.com/api/v2/jsonRPC)
// Unlock: до 5 неверных попыток, затем блокировка 5 минут
```

---

## Порядок реализации (рекомендуемый)

1. Проверить `WelcomeScreen.tsx` и `MainScreen.tsx` — полные ли реализации
2. **9.2** CreateWalletScreen (зависит только от готовых компонентов)
3. **9.3** ImportMnemonicScreen
4. **9.5** ReceiveScreen (самый простой)
5. **9.6** SendScreen + ConfirmScreen (самый сложный)
6. **9.7** SettingsScreen + ExportScreen

---

## Важные замечания

- Все адреса в UI — user-friendly формат (`EQ...`), в store — raw
- Баланс в нанотон (`bigint`), для UI — `formatTon()`
- Везде должна быть пометка **Testnet** (header или badge)
- TypeScript strict mode, никаких `any`
- Path alias: `@/` → `src/`
- Tailwind-классы брать из `design/.../code.html`, конвертировать `class` → `className`
