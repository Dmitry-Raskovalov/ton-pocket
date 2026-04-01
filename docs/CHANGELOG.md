# Changelog

Все заметные изменения в проекте TON Testnet Wallet будут документироваться в этом файле.
Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

---

## [2026-04-01] - Обработка ошибок сети (Задача 10.3)

### Изменено
- `src/hooks/useBalance.ts` — заменена строковая проверка rate limit на `instanceof RateLimitError`.
- `src/hooks/useTransactions.ts` — добавлена обработка `RateLimitError` в обоих catch-блоках (fetchInitial, loadMore): при 429 показывается toast «Too many requests, wait...» вместо generic error.
- `src/services/ton/transfer.ts` — детализированы сообщения об ошибках: `NetworkError` → «Network error: unable to connect to the blockchain», `RateLimitError` → «Too many requests...», `ApiError` → «API error (statusCode): ...».
- `src/services/wallet/contract-factory.ts` — `detectVersions` теперь возвращает `DetectVersionsResult { wallets, hadNetworkError }`. При сетевой ошибке в любой из параллельных проверок флаг `hadNetworkError` выставляется в `true`.
- `src/services/wallet/types.ts` — в `WalletImportResult` добавлено поле `hadNetworkError?: boolean`.
- `src/services/wallet/WalletService.ts` — `importFromMnemonic` прокидывает `hadNetworkError` через результат.
- `src/screens/ImportMnemonicScreen.tsx` — при импорте с сетевой ошибкой (fallback на v4R2) показывается warning toast с подсказкой об изменении версии в настройках.

---

## [2026-04-01] - Роутинг и навигационные гварды (Задача 10.1)

### Добавлено
- `src/App.tsx` — роутинг на базе `wouter` с навигационными гвардами:
  - Редирект на `/welcome` если кошелёк не создан.
  - Показ `UnlockModal` поверх защищённых маршрутов (`/main`, `/send`, etc.), если кошелёк заблокирован.
  - Поддержка маршрутов: `/welcome`, `/create`, `/import`, `/main`, `/send`, `/receive`, `/settings`.
- `src/components/UnlockModal.tsx` — компонент разблокировки:
  - Поле ввода пароля с индикатором ошибки.
  - Интеграция с `vault.decrypt()` для верификации.
  - Счётчик попыток (5) и блокировка на 5 минут с таймером (`lockedUntil` из `ui-store`).
  - **Автоматическая загрузка данных**: обновление баланса и истории транзакций сразу после успешного ввода пароля.
- `src/App.test.tsx` — юнит-тесты роутинга (редиректы при разных состояниях кошелька).
- `src/components/UnlockModal.test.tsx` — юнит-тесты логики разблокировки (успех, неверный пароль, блокировка, таймер).

### Исправлено
- Рефакторинг навигации во всех экранах: `onBack`/`onComplete`/`onSettings` пропсы удалены, компоненты используют хук `useLocation` напрямую.
- Исправлены все 433 теста в наборе: тесты теперь мокают `wouter` вместо проверки пропсов.
- `SettingsScreen.tsx`: добавлен helper `toUserFriendly` для корректного отображения адреса.

---

## [2026-04-01] - SettingsScreen (Задача 9.7)

### Добавлено
- `src/screens/Settings/SettingsScreen.tsx` — экран настроек:
  - Sticky header с кнопкой Back и Testnet badge
  - Карточка Wallet Architecture: версия контракта + Network "TON Testnet"
  - Карточка Address: `HighlightedAddress` + `CopyButton`
  - Секция Security & Access: кнопки Export Recovery Phrase и Change Password
  - Секция Danger Zone: кнопка Delete Wallet (disabled, следующий спринт)
- `src/screens/Settings/ExportScreen.tsx` — двухшаговый экспорт мнемоники:
  - Step 1: ввод пароля, предупреждение, чекбокс «I understand the risks»
  - Step 2: грид 24 слов (2 колонки), CopyButton, автоскрытие через 60 секунд
  - Обработка `InvalidPasswordError`
- `src/screens/Settings/ChangePasswordModal.tsx` — модальное окно смены пароля:
  - Три поля (current/new/confirm) с strength indicator на новом
  - Обработка `InvalidPasswordError` (current), `WeakPasswordError` (new), mismatch (confirm)
  - Toast success + onClose при успехе
- `src/screens/Settings/SettingsScreen.test.tsx` — 22 юнит-теста (22/22 pass)

---

## [2026-04-01] - SendScreen (Задача 9.6)

### Добавлено
- `src/screens/SendScreen.tsx` — трёхшаговый экран отправки TON:
  - Step 1 (Input Form): поля Recipient Address, Amount (с кнопкой MAX), Comment (optional), отображение баланса, inline-предупреждения с debounce 500ms
 sticky Continue button
  - Step 2 (Confirmation): карточка транзакции (адres, amount, fee, comment), WarningList с blocking-чекбоксами, поле пароля, кнопки Confirm & Send / Cancel
  - Step 3 (Result): Pending (спиннер), Success (tx hash + auto-redirect 3 сек), Error (Try Again), Timeout (status unknown)
  - Интеграция с validateSend, sendTransfer, vault decrypt, address book
 auto-refresh баланса после success
- `src/screens/SendScreen.test.tsx` — 23 юнит-теста: Step 1 (7), validation warnings (2), Step 2 navigation (4), Step 3 results (4), Step 1 fields (3), MAX (2), wrong password (1)

---

## [2026-04-01] - ReceiveScreen (Задача 9.5)

### Добавлено
- `src/screens/ReceiveScreen.tsx` — экран получения TON:
  - Sticky header с кнопкой Back и Testnet badge
  - QR-код (`QRCodeSVG` из `qrcode.react`, 200x200, уровень коррекции M)
  - Полный адрес кошелька через `HighlightedAddress` (full mode)
  - `CopyButton` (variant=with-text) для копирования адреса
  - Предупреждение о testnet (inline SVG alert icon, стилизовано под дизайн)

---

## [2026-04-01] - MainScreen (Задача 9.4)

### Добавлено
- `src/screens/MainScreen.tsx` — полнофункциональный главный экран кошелька:
  - Header: логотип TON Wallet, Testnet badge, кнопка Settings
  - Секция баланса: адрес в pill-форме (`HighlightedAddress` truncated + `CopyButton`), баланс в TON (formatBalance, max 4 знака), кнопки Receive / Send
  - Секция транзакций: заголовок + "Updated N sec ago", `SearchBar`, фильтры All/Incoming/Outgoing, список `TransactionItem` с labelMap из address book
  - Пустое состояние: "No transactions yet" / "No matching transactions" в зависимости от активных фильтров
  - "Load more" для пагинации (PAGE_SIZE=20, скрывается при `hasMore=false`)
  - "End of History" маркер когда все транзакции загружены
  - Polling баланса каждые 30 сек, начальная загрузка транзакций и баланса при mount
- `src/screens/MainScreen.test.tsx` — 24 юнит-теста: header, баланс, пустое состояние (2 варианта), список транзакций, фильтры (4), поиск, пагинация (4), data fetching (4)

---

## [2026-04-01] - ImportMnemonicScreen (Задача 9.3)

### Добавлено
- `src/screens/ImportMnemonicScreen.tsx` — трёхшаговый экран импорта кошелька по мнемонике:
  - **StepMnemonic**: textarea для 24 слов, кнопка «Paste» (`navigator.clipboard`), счётчик слов (N/24), async валидация через `walletService.validateMnemonic`, inline ошибка, security info banner; Continue активна только при ровно 24 словах
  - **StepPassword**: два `PasswordInput` (пароль + подтверждение), индикатор силы, inline ошибка несовпадения, info-баннер; идентичен StepPassword в CreateWalletScreen
  - **StepSelectVersion**: radio-карточки для каждой найденной версии контракта (v3R2/v4R2/v5R1) с адресом (truncated), балансом (`formatTon`) и badge-ом (Recommended/BETA); показывается только при `needsVersionChoice=true`
  - Интеграция с `walletService.importFromMnemonic` — если несколько версий, сохраняет пароль в state и переходит к выбору; затем вызывает повторно с выбранной версией
  - Ошибки → toast через `useUIStore`; успех → `setWallet()` в store + `onComplete()`
- `src/screens/ImportMnemonicScreen.test.tsx` — 17 юнит-тестов: кнопка disabled при < или > 24 слов, счётчик слов, ошибка при невалидной мнемонике, переходы между шагами, показ SelectVersion при `needsVersionChoice=true`, вызов `importFromMnemonic` с правильными аргументами, toast при ошибке
- Добавлен экспорт в `src/screens/index.ts`

---

## [2026-04-01] - CreateWalletScreen (Задача 9.2)

### Добавлено
- `src/screens/CreateWalletScreen.tsx` — двухшаговый экран создания кошелька:
  - **StepPassword**: два `PasswordInput` (пароль + подтверждение), индикатор силы, inline ошибка несовпадения, info-баннер о локальном шифровании, gradient-кнопка Continue (активна при score≥2 + match), inline spinner при загрузке
  - **StepMnemonic**: WarningCard, 3-колоночная сетка 24 слов с нумерацией, CopyButton «Copy All», чекбокс «I have saved my recovery phrase», Continue (активен только при checked)
  - После шага 2 — `setWallet()` в store + `onComplete()` callback
  - Ошибки создания → toast через `useUIStore`
- `src/services/wallet/types.ts` — добавлено поле `publicKey: string` в `WalletCreateResult`
- `src/services/wallet/WalletService.ts` — `createWallet` теперь возвращает `publicKey` в hex

### Исправлено
- `vite.config.ts` — добавлен `vite-plugin-wasm` и `optimizeDeps.exclude: ['argon2-browser']` + `assetsInclude: ['**/*.wasm']` для корректной сборки argon2-browser в Vite 8/Rolldown

---

## [2026-04-01] - WelcomeScreen и фикс Tailwind v4 (Задача 9.1)

### Добавлено
- `src/screens/WelcomeScreen.tsx` — полноценная реализация по дизайн-макету: header с логотипом (Wallet icon + "TON Wallet"), Testnet badge, Settings; логотип Diamond с glow-эффектом; блок Network/Protocol; стеклянный footer с кнопками «Create New Wallet» (градиент) и «Import Existing Wallet»; декоративный ротированный текст «TESTNET». Принимает пропсы `onCreateWallet` / `onImportWallet` для навигации

### Исправлено
- `src/index.css` — переведён с Tailwind v3 синтаксиса на v4: `@import "tailwindcss"` вместо `@tailwind base/components/utilities`, `@config` вместо `@apply dark`, убран `@apply` для несовместимых утилит
- `index.html` — добавлен `class="dark"` на `<html>` (заменяет сломанный `@apply dark` в CSS)

---

## [2026-04-01] - Общие UI-компоненты (Задача 8.4)

### Добавлено
- `src/components/CopyButton.tsx` — переписан: иконки `Copy`/`Check` из `lucide-react`, варианты `icon-only` (16px) и `with-text` (20px), feedback "Copied!" на 2 сек, `aria-label` и `title` синхронизированы
- `src/components/TransactionItem.tsx` — строка транзакции: иконка направления `ArrowDownLeft`/`ArrowUpRight`, сумма (+/- TON с компактным форматом до 4 знаков), адрес контрагента (4+...+4), label адресной книги, дата (`formatTime`), комментарий с иконкой
- `src/components/SearchBar.tsx` — поле поиска: иконка `Search` слева, кнопка `X` очистки (показывается при наличии текста), pill-shape, полная ширина
- `src/components/Loader.tsx` — fullscreen overlay `bg-background/80 backdrop-blur-sm`, спиннер `Loader2` 40px с `animate-spin`, опциональный текст
- `src/components/Toast.tsx` — `ToastItem` (авто-dismiss через `useEffect` по `duration`; duration=0 не скрывает) + `ToastContainer` (читает toasts из `useUIStore`, fixed bottom-center)
- `src/components/CopyButton.test.tsx` — 5 тестов: clipboard API вызывается, aria-label меняется, возврат через 2с, with-text вариант
- `src/components/TransactionItem.test.tsx` — 8 тестов: in/out префикс, truncated адрес, label, комментарий, onClick, null counterparty
- `src/components/Toast.test.tsx` — 5 тестов: пустой контейнер, рендер из store, авто-dismiss, duration=0

### Изменено
- `src/components/index.ts` — добавлены экспорты `Loader`, `SearchBar`, `Toast`/`ToastContainer`, `TransactionItem`

---

## [2026-04-01] - Компоненты WarningCard и WarningList (Задача 8.3)

### Добавлено
- `src/components/WarningCard.tsx` — переписан: принимает `warning: Warning` из `services/validation/types`, иконки из `lucide-react` (AlertCircle/AlertTriangle/Info), левая полоса `border-l-4` по severity, контролируемый checkbox (`checked`/`onCheck` пропсы), только при `blocking=true`
- `src/components/WarningList.tsx` — список `WarningCard`: внутреннее состояние чекбоксов `Record<number, boolean>`, reset при смене `warnings`, `onAllBlockingConfirmed` вызывается через `useEffect`
- `src/components/WarningCard.test.tsx` — 10 тестов: форматирование type, сообщение, blocking/non-blocking чекбокс, controlled state, severity стили
- `src/components/WarningList.test.tsx` — 8 тестов: пустой список, все warnings, один чекбокс для blocking, callback false/true, частичное подтверждение, non-blocking only

### Изменено
- `src/components/index.ts` — добавлен экспорт `WarningList`

---

## [2026-04-01] - HighlightedAddress (Задача 8.2)

### Добавлено
- `src/components/HighlightedAddress.tsx` — отображение адреса с выделением первых/последних 6 символов (`text-on-surface font-bold`), средняя часть — `text-on-surface-variant/40`; prop `truncate` заменяет середину на `…`; prop `className`
- `src/components/HighlightedAddress.test.tsx` — 9 тестов: full/truncated режимы, bold-классы, edge cases (короткий адрес), className

### Изменено
- `src/components/HighlightedAddress.tsx` — переписан со стаба: 6 символов (вместо 6 с неверными токенами), добавлен `truncate`, исправлены CSS-токены

---

## [2026-04-01] - Tailwind дизайн-система + PasswordInput (Задача 8.1)

### Добавлено
- `tailwind.config.js` — полная палитра Material You (dark): surface, primary, secondary, tertiary, error, outline и все их вариации; шрифты Inter + JetBrains Mono; скругления
- `src/index.css` — переписан: тёмная тема как базовый стиль, `html.dark`, шрифт Inter, кастомный скроллбар
- `src/components/PasswordInput.tsx` — переработан с нуля: inline SVG Eye/EyeOff toggle, 4-сегментный индикатор силы (`evaluatePassword`), prop `error`, prop `label`, prop `disabled`
- `src/components/PasswordInput.test.tsx` — 13 тестов: рендер, placeholder, label, onChange, toggle видимости, strength bar (3 кейса), error state, disabled state
- `package.json` — добавлена зависимость `lucide-react` (ожидает `npm install` при наличии сети)

### Изменено
- `src/components/PasswordInput.tsx` — иконки Eye/EyeOff реализованы как временные inline SVG; после `npm install lucide-react` можно заменить на import из `lucide-react`

---

## [2026-04-01] - Оркестратор валидации (Задача 7.6)

### Добавлено
- `src/services/validation/validate-send.ts` — `validateSend(params): Promise<SendValidationResult>`: единая точка входа для валидации перед отправкой
- Типы `ValidateSendParams` и `SendValidationResult` в том же файле
- Early return при невалидном адресе; параллельный запуск self-send, similarity, account state, balance
- Ошибки сети в account state check обрабатываются gracefully (пустой массив)
- `src/services/validation/validate-send.test.ts` — 12 юнит-тестов: early return, чистая отправка, комбинации warnings, устойчивость к сетевым ошибкам

---

## [2026-04-01] - Проверка похожих адресов (Задача 7.5)

### Добавлено
- `src/services/validation/address-similarity.ts` — `checkAddressSimilarity(recipientRaw)`: вызывает `addressBook.findSimilar()`, возвращает critical blocking Warning если найдены адреса с совпадающими первыми/последними 6 символами
- Детали совпадения в message: label адреса, часть совпадения (начало/конец/оба), совпавшие символы
- `src/services/validation/address-similarity.test.ts` — 7 юнит-тестов: prefix/suffix/both match, несколько совпадений, нет совпадений, полное совпадение (null), label fallback
- Экспорт из `src/services/validation/index.ts`

---

## [2026-03-31] - Проверка баланса и комиссии (Задача 7.4)

### Добавлено
- `src/services/validation/balance-check.ts` — `checkBalance(amount, balance): Warning[]`: три проверки: #7 сумма > баланс → error blocking, #8 сумма + комиссия > баланс → error blocking, #9 остаток < 0.05 TON → warning non-blocking
- Константа `LOW_REMAINDER_THRESHOLD = 50_000_000n` (0.05 TON)
- `src/services/validation/balance-check.test.ts` — 11 юнит-тестов: все граничные случаи
- Экспорт из `src/services/validation/index.ts`

---

## [2026-03-31] - Смена пароля (Задача 6.4)

### Добавлено
- `src/services/wallet/WalletService.ts` — реализован `changePassword(currentPassword, newPassword)`: расшифровка vault текущим паролем, валидация нового пароля через `evaluatePassword`, перешифровка новым паролём (новый salt + IV), перезапись vault
- `src/services/wallet/types.ts` — добавлена `WeakPasswordError` (новый пароль не проходит проверку силы: score < 2 или длина < 8)
- `src/services/wallet/WalletService.test.ts` — 10 юнит-тестов: успешная смена, старый пароль больше не работает, неверный текущий пароль, отсутствие vault, слабый новый пароль, короткий новый пароль, vault не модифицируется при ошибке, новый vault имеет отличный salt/IV, корректность name property ошибки

---

## [2026-03-31] - Импорт кошелька по мнемонике (Задача 6.2)

### Добавлено
- `src/services/wallet/WalletService.ts` — реализованы `validateMnemonic(words)` и `importFromMnemonic(words, password, selectedVersion?)`: валидация мнемоники через `@ton/crypto`, деривация keypair, автодетекция версий контракта, шифрование и сохранение в vault
- `src/services/wallet/types.ts` — обновлён `WalletImportResult` (address/version/needsVersionChoice/detectedWallets), добавлена `InvalidMnemonicError`
- `src/services/wallet/WalletService.test.ts` — 12 юнит-тестов: валидация мнемоники, невалидная мнемоника, автодетекция 0/1/несколько версий, selectedVersion override, сохранение vault, round-trip

---

## [2026-03-31] - Создание нового кошелька (Задача 6.1)

### Добавлено
- `src/services/wallet/WalletService.ts` — реализован `createWallet(password)`: генерация 24-словной мнемоники через `@ton/crypto`, деривация keypair, создание v4R2 контракта, шифрование мнемоники через vault, сохранение в localStorage
- `src/services/wallet/types.ts` — добавлено поле `version` в `WalletCreateResult`
- `src/services/wallet/WalletService.test.ts` — 9 юнит-тестов для createWallet: 24 слова, формат адреса, версия v4R2, сохранение vault, round-trip дешифровка, неверный пароль, адрес из publicKey, вызовы @ton/crypto

---

## [2026-03-31] - Экспорт мнемоники (Задача 6.3)

### Добавлено
- `src/services/wallet/WalletService.ts` — реализован `exportMnemonic(password)`: загрузка vault, расшифровка, парсинг JSON → массив из 24 слов
- `src/services/wallet/types.ts` — типизированные ошибки `InvalidPasswordError` и `NoVaultError`
- `src/services/wallet/WalletService.test.ts` — 6 юнит-тестов: успешный экспорт, неверный пароль, отсутствие vault, сохранение порядка слов, корректность name property ошибок

---

## [2026-03-31] - Transaction Store (Задача 5.2)

### Добавлено
- `src/store/transaction-store.ts` — Zustand store для транзакций: `transactions`, `isLoading`, `hasMore`, `searchQuery`, `directionFilter`, `lastUpdateTimestamp`
- Клиентская фильтрация: `getFilteredTransactions(labelMap)` — фильтр по направлению, поиск по адресу/комментарию/label
- Действия: `setTransactions`, `appendTransactions` (для пагинации), `setSearchQuery`, `setDirectionFilter`, `setLoading`
- Без persist-слоя (загружается с нуля при каждом открытии)
- `src/store/transaction-store.test.ts` — 23 теста (все прошли)
- Экспорт из `src/store/index.ts`

---

## [2026-03-31] - Сервис отправки транзакций (Задача 4.4)

### Добавлено
- `src/services/ton/transfer.ts` — сервис отправки транзакций с seqno polling:
  - `sendTransfer(params: TransferParams): Promise<TransferResult>` — формирование, подписание и отправка transfer-сообщения
  - Polling seqno каждые 2 секунды для ожидания подтверждения (максимум 30 секунд)
  - Возврат статуса: `'confirmed'` (с hash), `'timeout'`, или `'error'` (с сообщением)
  - Константа `ESTIMATED_FEE = 10_000_000n` (0.01 TON) для UI и валидации
  - Типы `TransferParams`, `TransferResult`, `TransferStatus`, `WalletContract`
- `src/services/ton/transfer.test.ts` — 6 юнит-тестов:
  - Успешная отправка с подтверждением (seqno increment)
  - Таймаут при отсутствии подтверждения за 30 секунд
  - Ошибка сети при `sendExternalMessage`
  - Приём `Address` объекта как recipient
  - Включение текстового комментария в transfer
  - Проверка константы `ESTIMATED_FEE`

### Технические детали
- Использована функция `internal()` из `@ton/ton` для создания сообщений
- Поддержка строковых адресов (user-friendly и raw) и объектов `Address`
- Экспорт из `src/services/ton/index.ts`
---

## [2026-03-31] - UI Store (Задача 5.3)
### Добавлено
- `src/store/ui-store.ts` — Zustand store для UI-состояния: `isLoading`, `toasts`, `unlockAttempts`, `lockedUntil`
- Логика блокировки: 5 неверных попыток unlock → `lockedUntil = now + 5 мин`, счётчик сбрасывается
- persist-слой: сохраняет только `lockedUntil` (блокировка переживает перезагрузку)
- Типы `Toast`, `ToastType`, `UIState`, `UIActions`, `UIStore` добавлены в `store/types.ts`
- `src/store/ui-store.test.ts` — 22 теста (все прошли)
- Экспорт из `src/store/index.ts`
---

## [2026-03-31] - Проверка состояния аккаунта получателя (Задача 7.3)

### Добавлено
- `src/services/validation/account-state.ts` — `checkAccountState(recipientAddress)`: предупреждения для uninit, bounce_risk (bounceable + uninit), frozen
- При ошибке сети возвращает пустой массив (не блокирует отправку)
- `src/services/validation/account-state.test.ts` — 6 тестов (все прошли)

---

## [2026-03-31] - Проверка self-send (Задача 7.2)

### Добавлено
- `src/services/validation/self-send.ts` — `checkSelfSend(recipientRaw, walletPublicKey)`: проверяет совпадение адреса получателя с адресами всех версий контрактов отправителя (v3R2, v4R2, v5R1)
- Тип `Warning` в `types.ts` — поля `type`, `message`, `severity`, `blocking`
- `src/services/validation/self-send.test.ts` — 5 тестов (все прошли)
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
- `withRetry()` — retry 3 попытки, exponential backoff (1s→2s→4s)
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

