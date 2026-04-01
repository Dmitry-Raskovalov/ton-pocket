# Дневник разработки TON Testnet Wallet

## 2026-04-01 — Задача 9.6: SendScreen

### Наблюдения
- Трёхшаговый state machine (input → confirm → result) реализован через `useState<Step>` внутри одного компонента. Альтернатива с вложенными route нерами слишком сложна для управления.
- Debounce валидации (500ms) реализован через `useRef` + `setTimeout` в `useEffect`, который очищает предыдущий таймер при каждом изменении. Это проще чем `useDebounce` хук из библиотеки.
- `allBlockingConfirmed` — когда `validationWarnings` пуст (нет blocking warnings), подтверждать автоматически `true`, иначе `false` и пользователь должен нажать чекбоксы в WarningList.
- `parseAmountTon` использует `parseFloat` + `BigInt(Math.round(...))` для конвертации строки в нанотоны. `formatAmountInput` делает обратную конвертацию.
- Динамический `import('@ton/crypto')` внутри `handleSend` — чтобы не загружать тяжёлый крипто-модуль при рендере, только при фактической отправке.

### Решения
- Неверный пароль не возвращает ошибку до вызова `sendTransfer` — `decrypt` бросает, ловим в компоненте, устанавливаем `passwordError` и `return` до перехода на result step.
- Авто-redirect после success/timeout — `useEffect` с `setTimeout(onBack, 3000)`.
- Tests: статические моки без hoisting-проблем — `vi.mock()` с инлайн-значениями, не ссылками на переменные. Для динамического поведения используем `vi.mocked()`.

### Проблемы
- 23/23 тестов с первого запуска после исправления hoisting issue.

---

## 2026-04-01 — Задача 9.5: ReceiveScreen

### Наблюдения
- Дизайн из `receive_screen/code.html` использует inline SVG для иконки предупреждения вместо Lucide. В текущей реализации WarningCard из `components/` требует объект `Warning` с severity/blocking/type — это избыточно для простого статичного предупреждения. Решено использовать inline SVG из дизайна напрямую, что сохраняет pixel-perfect соответствие с макетом.
- `QRCodeSVG` из `qrcode.react` — экспортирует чистый SVG, что предпочтительнее `QRCodeCanvas` (canvas) для SPA: лучше масштабируется, доступнее для скринридеров, меньше весит в DOM.
- `CopyButton` с `variant="with-text"` и кастомным className позволяет полностью стилизовать кнопку под дизайн (full-width, uppercase, border) без модификации самого компонента.

### Решения
- Предупреждение о testnet реализовано как inline-блок (не через `WarningCard`), т.к. `WarningCard` требует controlled checkbox и объект `Warning` — избыточно для некликабельного информационного блока.
- Адрес читается из `useWalletStore` через селектор `(s) => s.address`, конвертируется через `Address.parseRaw(raw).toString({ bounceable: false })` — тот же паттерн что в MainScreen.

### Проблемы
- Нет. TypeScript компиляция прошла без ошибок.

---

## 2026-04-01 — Задача 9.4: MainScreen

### Наблюдения
- `getFilteredTransactions()` в `transaction-store.ts` читает из `useTransactionStore.getState()` напрямую, а не принимает state как аргумент. Это работает в компоненте (state меняется → ре-рендер → функция вызывается с актуальным состоянием), но требует аккуратного мокирования в тестах — нужно мокировать всю функцию через `vi.mock`, а не имитировать store.
- Интервал "Updated N sec ago" (1 сек) изначально реализован через `useTransactionStore.getState()` внутри `setInterval`. Это вызывает проблему: Zustand-специфичный метод `.getState()` отсутствует на vi.fn() и ломает тесты. Решение: использовать `useRef` для хранения актуального `lastUpdateTimestamp`, что является стандартным React-паттерном для stable intervals.
- `Address.parseRaw(raw).toString({ bounceable: false })` — преобразование raw→EQ... адрес не требует сети и работает синхронно.

### Решения
- `lastUpdateTimestampRef` + `useEffect` синхронизации: ref всегда содержит актуальный timestamp; setInterval замыкается на ref, не на переменную из closure. Это устраняет stale closure без необходимости перезапускать интервал при каждом обновлении транзакций.
- `formatBalance()` — локальная функция вместо переиспользования `formatTon` из сервиса напрямую: добавляет обрезку до 4 знаков и strip trailing zeros для UI.
- Пагинация: запрашиваем `PAGE_SIZE + 1` записей, если вернулось больше PAGE_SIZE — `hasMore=true`, в store кладём только `PAGE_SIZE`.

### Проблемы
- Нет. 24/24 теста с первого запуска.

---

## 2026-04-01 — Задача 9.3: ImportMnemonicScreen

### Наблюдения
- Сервис `walletService.importFromMnemonic(words, password)` при `needsVersionChoice=true` возвращает `detectedWallets` ДО шифрования vault. Это позволяет показать SelectVersionScreen, не требуя отдельного network-call для детекции версий.
- Спецификация (PLAN.md) предполагает порядок: мнемоника → выбор версии → пароль. Однако такой порядок требует отдельного вызова `detectVersions` с деривацией keypair до получения пароля. Выбран альтернативный порядок: мнемоника → пароль → (если нужно) выбор версии — он точно соответствует API сервиса и безопаснее (пароль устанавливается до сетевых операций).
- `truncateAddress` реализован локально в screen (не вынесен в утилиту) — функция используется только здесь, в одном месте.
- `navigator.clipboard.readText()` в StepMnemonic: при отказе разрешения (Permissions API) функция не показывает ошибку — пользователь просто вставляет вручную. Это соответствует допущению из PLAN.md.

### Решения
- Пароль сохраняется в состоянии главного компонента (`useState`) для использования на шаге выбора версии. Это не секурити-риск — хранение в памяти компонента (не localStorage), компонент живёт только в рамках flow онбординга.
- `publicKey: ''` в `setWallet()` — `importFromMnemonic` не возвращает publicKey в `WalletImportResult`. Это техдолг: сервис должен возвращать publicKey, или store должен его деривировать. Для MVP приемлемо.

### Проблемы
- Нет. 17/17 тестов с первого запуска.

---

## 2026-04-01 — Задача 8.4: Общие UI-компоненты

### Наблюдения
- `lucide-react` присутствовал в `package.json`, но не был установлен (`node_modules` отсутствовал). `@testing-library/user-event` тоже не установлен — все тесты кликов реализованы через `fireEvent`.
- `formatTon()` из `balance.ts` возвращает 9 знаков после запятой ("1.500000000") — для UI неудобно. В `TransactionItem` добавлен локальный форматтер: обрезает trailing zeros и ограничивает 4 знаками.
- `Toast` дизайн в `component_sheet_ui_kit` — простой pill `bg-on-surface text-surface rounded-full` с bounce-анимацией. Реализован более функциональный вариант из `DESIGN_BRIEF.md` (поддержка типов, dismiss-кнопка) с учётом интеграции с `ui-store`.
- `duration=0` используется в тестах store как "не скрывать автоматически" — ToastItem явно проверяет `if (toast.duration <= 0) return` в useEffect.

### Решения
- `ToastContainer` вынесен отдельно от `ToastItem` — контейнер читает store, item управляет своим таймером. Нет глобального таймер-менеджера.
- `TransactionItem` не использует `HighlightedAddress` для адреса контрагента — в списке транзакций достаточно простого truncate (4+...+4) без выделения начала/конца; `HighlightedAddress` нужен на экране подтверждения.
- `animate-in slide-in-from-bottom-2 fade-in` в Toast — утилиты из `tailwindcss-animate` (если не установлен, классы игнорируются без ошибки). При необходимости можно заменить на `transition + translate`.

### Проблемы
- Нет. 18/18 тестов с первого запуска после `npm install`.

---

## 2026-04-01 — Задача 8.3: WarningCard и WarningList

### Наблюдения
- Существующий `WarningCard.tsx` (заглушка) имел собственный внутренний `useState` для чекбокса — не управляем снаружи. Для `WarningList` нужен контроль состояния снаружи, поэтому переписан на controlled pattern.
- `WarningSeverity` в заглушке: `'error' | 'warning' | 'info'`. В `ValidationSeverity` из types.ts: то же самое. Переиспользуем тип напрямую.
- Tailwind не имеет токена `warning` или `info` в конфиге — `warning` маппится на `tertiary` (жёлтый), `info` на `primary` (синий). Это соответствует Material You цветовой схеме.
- Дизайн confirm_transaction использует `border-l-4` (не 3px), `rounded-r-lg` (скругление только справа), `space-y-4` между контентом и чекбоксом.

### Решения
- `formatType(warning.type)` — конвертирует `snake_case` → `Title Case` для отображения заголовка. Warning.type — машинный идентификатор (`'insufficient_balance'`), не человекочитаемый.
- Два `useEffect` в WarningList с разными зависимостями: первый сбрасывает `checkedMap` при смене `warnings`, второй вызывает `onAllBlockingConfirmed`. Это предотвращает race-condition при одновременном изменении.
- `onAllBlockingConfirmed(false)` при `blockingIndices.length === 0` — нет blocking warnings → нельзя "подтвердить всё", callback возвращает false.

### Проблемы
- Нет. 18/18 тестов с первого запуска.

---

## 2026-04-01 — Задача 8.2: HighlightedAddress

### Наблюдения
- Стаб использовал 6 символов, но с неверными токенами (`text-primary`/`text-text-secondary` — не определены в дизайн-системе).
- PLAN.md указывал 4 символа, но по согласованию с пользователем — 6.
- Дизайн из `component_sheet_ui_kit` показывает `text-on-surface font-bold` для highlight и `text-on-surface-variant/40` для середины — это визуально "растворяет" середину.

### Решения
- `HIGHLIGHT_LEN = 6` вынесен в константу — единственное место для изменения при необходимости.
- Компонент рендерит `<span>` (не `<div>`) — inline-элемент, удобен для встраивания в текст.
- `truncate=true` рендерит символ `…` (U+2026) вместо ASCII `...` — типографически корректно.

### Проблемы
- Нет. 9 тестов прошли с первого запуска.

---

## 2026-04-01 — Задача 8.1: Tailwind дизайн-система + PasswordInput

### Наблюдения
- `tailwind.config.js` был пустым — все классы вроде `bg-surface-container-lowest` и `text-on-surface-variant` из дизайна не работали.
- Дизайн в `component_sheet_ui_kit/code.html` использует Material You (M3) тёмную схему — палитра взята из этого файла напрямую.
- Текущий `index.css` содержал CSS-переменные для светлой темы (не связанные с дизайн-системой проекта) — полностью заменён.
- `lucide-react` не установлен и нет доступа к npm registry — иконки реализованы как временные inline SVG.

### Решения
- `tailwind.config.js` обновлён без breaking changes — все стандартные классы Tailwind сохранены, токены добавлены через `extend.colors`.
- `darkMode: "class"` + `html.dark` в index.css — принудительная тёмная тема для MVP без media query переключения.
- Сегменты индикатора силы: score 0/1 → `bg-error`, score 2 → `bg-tertiary`, score 3/4 → `bg-primary` — соответствует DESIGN_BRIEF.md.
- Tailwind класс `pb-4` добавляется к input только при `showStrength && value` — оставляет место для полоски внутри поля.

### Проблемы
- `lucide-react` отсутствует в проекте и недоступен через npm. Добавлен в `package.json`, временно реализован через inline SVG. После `npm install` нужно заменить `EyeIcon`/`EyeOffIcon` на импорт из `lucide-react`.

---

## 2026-04-01 — Задача 7.6: Оркестратор валидации

### Наблюдения
- Все существующие валидаторы (7.1–7.5) используют тип `Warning` из `types.ts`, а не старый `ValidationResult` — типовые системы не пересекаются.
- `checkAddressSimilarity` возвращает `Warning | null` (один результат), а `checkAccountState` — `Warning[]` (несколько) — агрегация учитывает оба варианта.

### Решения
- Введён отдельный тип `SendValidationResult { isValid, warnings }` вместо переиспользования устаревшего `ValidationResult` — чище и без обратной совместимости.
- `checkAccountState` оборачивается в `.catch(() => [])` прямо в `Promise.all` — graceful degradation без дополнительной обёртки.
- `isValid` определяется только наличием `severity === 'error'`; `severity === 'critical'` (similarity) — не блокирует, требует явного подтверждения через UI.

### Проблемы
- Нет. 12 тестов прошли с первого запуска.

---

## 2026-04-01 — Задача 7.5: Проверка похожих адресов (clipboard poisoning)

### Наблюдения
- `addressBook.findSimilar()` уже фильтрует полное совпадение — не нужно дублировать проверку в `checkAddressSimilarity`.
- Функция делегирует всю логику поиска адресной книге — validation layer не знает о деталях сравнения.
- `matchType: 'both'` — самый опасный случай (совпадают начало и конец), выделяется в сообщении.

### Решения
- Message формируется динамически из массива совпадений — поддерживает любое количество похожих адресов.
- Если `label` не задан — используется `displayAddress` для идентификации записи.
- Функция синхронная — `addressBook` хранит данные в памяти, нет запросов к сети.

### Проблемы
- Нет. 7 тестов прошли с первого запуска.

---

## 2026-03-31 — Задача 7.4: Проверка баланса и комиссии

### Наблюдения
- Проверки #7 и #8 взаимоисключающие (если amount > balance, не нужно проверять amount + fee > balance) — ранний return после insufficient_balance.
- Проверка #9 (low remainder) не блокирующая — warning без blocking, пользователь получает уведомление, но может продолжить.
- `ESTIMATED_FEE` из `transfer.ts` уже экспортируется как `10_000_000n` — переиспользуем напрямую.
- Функция синхронная — не нужен async/await, нет запросов к сети.

### Решения
- `LOW_REMAINDER_THRESHOLD = 50_000_000n` — именованная константа вместо магического числа.
- Порядок проверок: #7 → #8 → #9 — от самых серьёзных к менее серьёзным, ранние return исключают дублирование warnings.

### Проблемы
- Нет. 11 тестов прошли с первого запуска.

---

## 2026-03-31 — Задача 6.4: Смена пароля

### Наблюдения
- `WalletService` уже содержит заглушку `changePassword` — метод заменён на рабочую реализацию.
- Порядок операций критичен: расшифровка → валидация нового пароля → перешифровка → сохранение. Если валидация нового пароля до расшифровки — не нужно тратить ресурсы на KDF при слабом пароле, но мы не узнаем валиден ли текущий пароль. Выбран порядок по PLAN.md: сначала расшифровка (проверка текущего пароля), затем валидация нового.
- `encrypt()` всегда генерирует новый salt и IV — повторное шифрование того же plaintext другим паролем даёт полностью отличный vault.

### Решения
- `WeakPasswordError` — отдельный класс ошибки для UI (аналогично `InvalidPasswordError` и `NoVaultError`).
- Vault перезаписывается через `saveVault(newVault)` — `localStorage.setItem` атомарно заменяет значение по тому же ключу. Нет промежуточного состояния с удалённым vault.
- Тест `vault is not modified when current password is wrong` — проверяет, что ciphertext и IV не изменяются при ошибке расшифровки.
- Тест `vault is not modified when new password is weak` — проверяет, что vault не меняется при ошибке валидации.

### Проблемы
- Нет. 10 новых тестов прошли со всеми 238 тестами.

---

## 2026-03-31 — Задача 6.2: Импорт кошелька по мнемонике

### Наблюдения
- `mnemonicValidate` из `@ton/crypto` — простая async-обёртка, возвращает `boolean`. Используется как есть через делегирование в `WalletService.validateMnemonic`.
- `detectVersions` уже возвращает `DetectedWallet[]` с полями `version`, `addressRaw`, `addressFriendly`, `balance`, `isDeployed` — идеально подходит для возврата списка версий в UI.
- При нескольких найденных версиях vault НЕ сохраняется — пользователь должен сначала выбрать версию, затем вызвать `importFromMnemonic` повторно с `selectedVersion`.
- `WalletImportResult` перепроектирован: вместо старого `versions: WalletVersionInfo[]` (с устаревшими типами версий) теперь содержит `needsVersionChoice` + `detectedWallets: DetectedWallet[]`.

### Решения
- Используем `DetectedWallet` из `contract-factory` напрямую вместо дублирования типа — DRY.
- `InvalidMnemonicError` — отдельный класс ошибки (аналогично `InvalidPasswordError`), чтобы UI мог различать сценарии.
- `selectedVersion` — опциональный 3-й параметр: при передаче пропускает проверку множественных версий, сразу создаёт кошелёк с выбранной версией.

### Проблемы
- Нет. 12 новых тестов прошли со всеми 228 тестами.

---

## 2026-03-31 — Задача 6.1: Создание нового кошелька

### Наблюдения
- `@ton/crypto` `mnemonicNew()` возвращает `string[]` из 24 слов — синхронная обёртка над Web Crypto.
- `mnemonicToPrivateKey(mnemonic)` возвращает `{ publicKey: Buffer, secretKey: Buffer }` — publicKey используется для создания контракта через `createContract()`.
- В jsdom/vitest `tweetnacl` (внутренняя зависимость `@ton/crypto`) выбрасывает `TypeError: unexpected type, use Uint8Array` — seed, возвращаемый из PBKDF2, является `Buffer`, а tweetnacl ожидает именно `Uint8Array`.
- Реализация `createWallet` размещена в `WalletService.ts` (не в отдельном файле `create.ts`) — уже существует заглушка в этом классе.

### Решения
- Мок `@ton/crypto` в тестах `createWallet` через `vi.mock('@ton/crypto', ...)` с inline-литералами (не ссылками на переменные) — `vi.mock` hoisted в начало файла, переменные ещё не инициализированы.
- `vi.clearAllMocks()` в `beforeEach` — моки `mnemonicNew`/`mnemonicToPrivateKey` сбрасываются между тестами.
- Тест адреса через `createContract(MOCK_PUBLIC_KEY, 'v4R2')` — детерминированная проверка, что `createWallet` возвращает корректный адрес v4R2.

### Проблемы
- `tweetnacl` в jsdom несовместим с `Buffer` от `mnemonicToSeed`. Решено через мок `@ton/crypto` в тестах — крипто-генерация не тестируется в юнит-тестах WalletService.

---

## 2026-03-31 — Задача 6.3: Экспорт мнемоники

### Наблюдения
- `WalletService` уже содержит заглушку `exportMnemonic` — метод заменён на рабочую реализацию.
- Мнемоника в vault хранится как `JSON.stringify(words[])` — при экспорте нужен `JSON.parse` для получения массива.
- Ошибка при неверном пароле от `vault.decrypt` — generic "Decryption failed: incorrect password or corrupted data". Оборачиваем в типизированную `InvalidPasswordError` для удобной обработки в UI.

### Решения
- Два кастомных класса ошибок: `InvalidPasswordError` (неверный пароль) и `NoVaultError` (нет vault в localStorage) — UI может различать сценарии и показывать соответствующие сообщения.
- Валидация формата данных после `JSON.parse`: проверка `Array.isArray` и `length > 0` — защита от повреждённого vault.
- `exportMnemonic` не хранит мнемонику в памяти после возврата — вызывающий код (UI) отвечает за timely cleanup.

### Проблемы
- Нет. 6 тестов прошли с первого запуска (207 всего).

---

## 2026-03-31 — Задача 5.2: Transaction Store

### Наблюдения

- `getFilteredTransactions()` — не action в store, а отдельная функция, которая вызывает `useTransactionStore.getState()`. Это позволяет избежать re-render при каждом изменении query/filter и использовать селектор в компонентах при необходимости.
- Поиск case-insensitive: всё приводится к lowercase, включая `label` из `labelMap`.
- `lastUpdateTimestamp` — timestamp загрузки/пополнения списка (для определения «свежести» данных в UI).

### Решения

- `appendTransactions` не удаляет дубликаты по hash — это ответственность caller (услуга `getTransactions` с пагинацией уже обеспечивает уникальность через `lt` и `hash`).
- `searchQuery` обрезается через `trim()` — пустые строки игнорируются, что упрощает логику фильтрации.
- Фильтрация и поиск применяются последовательно (сначала направление, потом поиск) — не усложняет логику.

### Проблемы

- Нет. 23 теста прошли с первого запуска (201 всего).

---

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

