# Дизайн-бриф: TON Testnet Wallet

---

## 1. Общее описание приложения

**Продукт:** Self-custodial криптокошелёк для TON testnet.

**Тип:** Standalone SPA (Single Page Application), работающее в браузере.

**Суть:** Пользователь создаёт или импортирует кошелёк, видит баланс, отправляет и получает тестовые TON, управляет настройками безопасности. Приложение не имеет собственного backend — всё взаимодействие идёт напрямую с блокчейном через публичный API.

**Целевая аудитория:**
- Разработчики, тестирующие смарт-контракты на TON testnet
- Пользователи, знакомящиеся с TON-экосистемой
- Техническая аудитория, понимающая базовые концепции криптокошельков (мнемоника, адреса, комиссии)

**Платформа:** Десктопный браузер (Chrome, Firefox, Safari, Edge). Мобильная адаптация не является приоритетом для MVP, но layout должен корректно отображаться при ширине от 360px.

---

## 2. Общие требования к дизайну

### 2.1 Стилевое направление

**Минималистичный, функциональный UI** — без декоративных элементов, анимаций ради анимаций, сложных градиентов. Каждый визуальный элемент несёт функцию.

Ориентиры (не для копирования, а для понимания духа):
- Tonkeeper — чистота и простота экранов
- Linear — типографика, spacing, утилитарность
- Монохромность с акцентным цветом

### 2.2 Тема

**Для MVP — только тёмная тема.** Обоснование: целевая аудитория — разработчики, которые преимущественно используют тёмные интерфейсы; кроме того, тёмная тема лучше визуально отделяет testnet-кошелёк от production-кошельков (Tonkeeper и др.), снижая риск путаницы.

### 2.3 Testnet-маркировка

**Обязательное требование:** на КАЖДОМ экране и в КАЖДОМ состоянии приложения должна присутствовать визуальная пометка «Testnet». Это может быть:
- Бейдж в header рядом с логотипом (рекомендуемый вариант)
- Тонкая полоса-баннер вверху экрана
- Или оба варианта

Цвет маркировки — отличный от основного UI (рекомендуется: жёлтый/amber на тёмном фоне) для мгновенной считываемости.

### 2.4 Layout и адаптивность

- **Основной layout:** центрированная колонка шириной 420–480px на десктопе (аналогично мобильному кошельку в браузерном окне)
- **Минимальная поддерживаемая ширина:** 360px
- **Максимальная ширина контента:** 480px, центрирован горизонтально
- **Фон за пределами контентной колонки:** сплошной цвет `background`

### 2.5 Accessibility (базовый уровень)

- Контраст текста к фону: минимум 4.5:1 (WCAG AA)
- Все интерактивные элементы доступны с клавиатуры (tab order)
- Focus-кольца видимы
- Иконки, несущие смысл, дублируются текстом или aria-label

---

## 3. Дизайн-система

### 3.1 Цветовая палитра

| Токен | Hex | Применение |
|-------|-----|-----------|
| `--color-bg` | `#0F1114` | Фон приложения, фон за контентной колонкой |
| `--color-surface` | `#1A1D23` | Карточки, поля ввода, поверхности поверх фона |
| `--color-surface-hover` | `#22262E` | Hover-состояние карточек, элементов списка |
| `--color-surface-active` | `#2A2F38` | Active/pressed состояние |
| `--color-border` | `#2E3340` | Границы полей ввода, разделители |
| `--color-border-focus` | `#4A90D9` | Граница поля ввода в фокусе |
| `--color-text-primary` | `#F0F2F5` | Основной текст, заголовки |
| `--color-text-secondary` | `#8B93A6` | Вспомогательный текст, подписи, timestamps |
| `--color-text-tertiary` | `#5A6275` | Плейсхолдеры, disabled-текст |
| `--color-primary` | `#4A90D9` | Основные кнопки, ссылки, активные элементы |
| `--color-primary-hover` | `#5BA0E9` | Hover основных кнопок |
| `--color-primary-active` | `#3A80C9` | Active/pressed основных кнопок |
| `--color-success` | `#34C759` | Успешные статусы, входящие транзакции (+) |
| `--color-success-bg` | `#34C75915` | Фон для success-элементов (15% opacity) |
| `--color-warning` | `#F5A623` | Предупреждения средней важности |
| `--color-warning-bg` | `#F5A62315` | Фон warning-карточек |
| `--color-error` | `#E53E3E` | Ошибки, critical warnings, danger-кнопки |
| `--color-error-bg` | `#E53E3E15` | Фон error-карточек |
| `--color-info` | `#4A90D9` | Информационные сообщения |
| `--color-info-bg` | `#4A90D915` | Фон info-карточек |
| `--color-testnet` | `#F5A623` | Бейдж «Testnet», маркировка тестовой сети |
| `--color-testnet-bg` | `#F5A62320` | Фон бейджа «Testnet» |
| `--color-highlight` | `#4A90D9` | Подсветка первых/последних символов адреса |

### 3.2 Типографика

Все шрифты — системный стек (без загрузки внешних шрифтов для минимизации бандла):

```
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
--font-mono: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Courier New', monospace;
```

| Токен | Размер | Вес | Line-height | Шрифт | Применение |
|-------|--------|-----|-------------|-------|-----------|
| `heading-1` | 28px | 700 | 1.2 | sans | Баланс на Main Screen |
| `heading-2` | 22px | 600 | 1.3 | sans | Заголовки экранов |
| `heading-3` | 18px | 600 | 1.3 | sans | Заголовки секций (Transactions, Settings) |
| `body` | 15px | 400 | 1.5 | sans | Основной текст, описания |
| `body-medium` | 15px | 500 | 1.5 | sans | Суммы в списке, labels |
| `body-small` | 13px | 400 | 1.4 | sans | Timestamps, подписи, вспомогательный текст |
| `caption` | 11px | 500 | 1.3 | sans | Бейджи, метки, индикаторы |
| `mono` | 14px | 400 | 1.5 | mono | Адреса кошельков, хеши транзакций |
| `mono-small` | 12px | 400 | 1.4 | mono | Мнемонические слова, технические данные |
| `button` | 15px | 600 | 1.0 | sans | Текст кнопок |
| `button-small` | 13px | 600 | 1.0 | sans | Текст маленьких кнопок, chips |

### 3.3 Скругления

| Токен | Значение | Применение |
|-------|----------|-----------|
| `--radius-xs` | 4px | Бейджи, теги, маленькие чипсы |
| `--radius-sm` | 6px | Поля ввода, маленькие кнопки |
| `--radius-md` | 8px | Карточки, кнопки, toast |
| `--radius-lg` | 12px | Модальные окна, крупные карточки |
| `--radius-xl` | 16px | QR-код контейнер |
| `--radius-full` | 9999px | Pill-кнопки (фильтры All/In/Out), аватары |

### 3.4 Тени

Минимальное использование теней (тёмная тема — тени слабо видны):

| Токен | Значение | Применение |
|-------|----------|-----------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Dropdown, popup |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Модальные окна |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Toast-уведомления |

Основной способ разделения слоёв — цвета поверхностей (`bg` → `surface` → `surface-hover`), а не тени.

### 3.5 Spacing-система

Базовая единица: **4px**. Все отступы кратны 4.

| Токен | Значение | Типичное применение |
|-------|----------|-------------------|
| `--space-1` | 4px | Минимальный gap между иконкой и текстом |
| `--space-2` | 8px | Внутренний padding маленьких элементов, gap в row |
| `--space-3` | 12px | Padding полей ввода (вертикальный) |
| `--space-4` | 16px | Padding карточек, gap между элементами формы |
| `--space-5` | 20px | Padding контентной области экрана (горизонтальный) |
| `--space-6` | 24px | Gap между секциями внутри экрана |
| `--space-8` | 32px | Gap между крупными блоками |
| `--space-10` | 40px | Верхний отступ экрана от header |
| `--space-12` | 48px | Крупные разделители |

### 3.6 Иконки

- Набор: Lucide Icons (open source, tree-shakeable, совместимы с React)
- Размер по умолчанию: 20×20px
- Толщина линий: 1.5px (stroke-width)
- Цвет: наследуется от текста (`currentColor`)

Необходимые иконки:

| Иконка | Контекст |
|--------|---------|
| `ArrowUpRight` | Исходящая транзакция |
| `ArrowDownLeft` | Входящая транзакция |
| `Copy` | Кнопка копирования |
| `Check` | Подтверждение копирования, чекбокс |
| `QrCode` | Receive-экран |
| `Settings` | Кнопка настроек |
| `ChevronLeft` | Кнопка «назад» |
| `AlertTriangle` | Warning |
| `AlertCircle` | Error / Critical |
| `Info` | Info-уведомление |
| `Eye` / `EyeOff` | Показать/скрыть пароль |
| `Search` | Поле поиска |
| `X` | Закрыть модальное окно, очистить поле |
| `Loader2` | Спиннер загрузки (анимированный rotate) |
| `Send` | Кнопка отправки |
| `Shield` | Безопасность / экспорт |
| `Trash2` | Удаление кошелька |
| `ExternalLink` | Ссылка на explorer |

---

## 4. UI-компоненты

> Переиспользуемые компоненты, из которых собираются все экраны. Для каждого указаны состояния, размеры, поведение.

### 4.1 Button

**Варианты:**

| Вариант | Фон | Текст | Граница | Применение |
|---------|-----|-------|---------|-----------|
| `primary` | `--color-primary` | `#FFFFFF` | нет | Основные действия: Create, Continue, Send |
| `secondary` | `transparent` | `--color-text-primary` | `--color-border` | Вспомогательные действия: Import, Cancel |
| `danger` | `--color-error` | `#FFFFFF` | нет | Деструктивные действия: Delete Wallet |
| `ghost` | `transparent` | `--color-text-secondary` | нет | Минорные действия: Back, ссылки |
| `icon` | `transparent` | `--color-text-secondary` | нет | Кнопки-иконки: Copy, Settings |

**Размеры:**

| Размер | Высота | Padding (горизонтальный) | Font |
|--------|--------|------------------------|------|
| `lg` | 48px | 24px | `button` (15px/600) |
| `md` | 40px | 16px | `button` (15px/600) |
| `sm` | 32px | 12px | `button-small` (13px/600) |

**Состояния:**
- Default
- Hover (цвет фона светлее на 10%)
- Active/Pressed (цвет фона темнее на 5%)
- Disabled (opacity: 0.4, cursor: not-allowed)
- Loading (текст заменяется спиннером, кнопка disabled)

**Поведение:**
- Полная ширина контейнера (`width: 100%`) для primary-действий на экранах
- Auto-ширина для inline-кнопок
- Скругление: `--radius-md`

---

### 4.2 PasswordInput

**Описание:** Поле ввода пароля с toggle видимости и опциональным индикатором силы.

**Элементы:**
1. Label текст сверху
2. Поле ввода (type: password/text)
3. Иконка-кнопка `Eye`/`EyeOff` внутри поля справа
4. Индикатор силы пароля (отображается при `showStrength: true`)
5. Текстовая подсказка под полем

**Индикатор силы:**
- Полоса из 4 сегментов под полем ввода
- Сегменты заполняются в зависимости от zxcvbn score (0–4):

| Score | Заполнено сегментов | Цвет | Текст |
|-------|---------------------|------|-------|
| 0 | 0 | — | — |
| 1 | 1 | `--color-error` | Very weak |
| 2 | 2 | `--color-warning` | Weak |
| 3 | 3 | `--color-warning` | Good (допустимый минимум) |
| 4 | 4 | `--color-success` | Strong |

**Примечание:** минимальный допустимый score = 2 (для совместимости с ТЗ раздел 4.4, где указан "минимальный score: 2 из 4"). На UI score 2 подписан как "Fair" — это минимум для активации кнопки Continue.

**Корректировка таблицы:**

| Score | Заполнено сегментов | Цвет | Текст |
|-------|---------------------|------|-------|
| 0 | 0 | — | — |
| 1 | 1 | `--color-error` | Very weak |
| 2 | 2 | `--color-warning` | Fair ✓ (минимум) |
| 3 | 3 | `--color-success` | Good |
| 4 | 4 | `--color-success` | Strong |

**Состояния поля:**
- Default: border `--color-border`
- Focus: border `--color-border-focus`
- Error: border `--color-error`, сообщение об ошибке под полем красным текстом
- Disabled: opacity 0.4

---

### 4.3 HighlightedAddress

**Описание:** Отображение блокчейн-адр��са с визуальным выделением первых и последних символов для защиты от подмены.

**Структура:**
```
[первые 4 символа][середина адреса][последние 4 символа]
```

**Визуальное оформление:**
- Шрифт: `mono` (14px)
- Первые 4 символа: цвет `--color-highlight`, font-weight: 700
- Середина: цвет `--color-text-secondary`, font-weight: 400
- Последние 4 символа: цвет `--color-highlight`, font-weight: 700
- Фон: `--color-surface` с padding 8px 12px, скругление `--radius-sm`

**Варианты:**
- `full` — адрес отображается полностью (для экрана подтверждения, Receive)
- `truncated` — середина заменена на `...` (для списка транзакций, header)

**Опционально рядом:** кнопка Copy (иконка) и/или label из адресной книги.

---

### 4.4 WarningCard

**Описание:** Карточка предупреждения с иконкой, текстом и опциональным чекбоксом подтверждения. Используется на экране подтверждения отправки.

**Severity-уровни:**

| Severity | Иконка | Цвет иконки | Цвет фона | Цвет левой полосы |
|----------|--------|-------------|-----------|-------------------|
| `info` | `Info` | `--color-info` | `--color-info-bg` | `--color-info` |
| `warning` | `AlertTriangle` | `--color-warning` | `--color-warning-bg` | `--color-warning` |
| `critical` | `AlertCircle` | `--color-error` | `--color-error-bg` | `--color-error` |
| `error` | `AlertCircle` | `--color-error` | `--color-error-bg` | `--color-error` |

**Структура карточки:**
```
┌─┬──────────────────────────────────────┐
│▌│ ⚠ Warning title                      │
│▌│ Description text that explains the   │
│▌│ warning in detail.                   │
│▌│                                      │
│▌│ ☐ I understand and want to proceed  │
└─┴──────────────────────────────────────┘
```

- Левая полоса: 3px шириной, цвет зависит от severity
- Скругление: `--radius-md`
- Padding: `--space-4`
- Чекбокс: присутствует ТОЛЬКО если `blocking: true`
- Текст чекбокса: «I understand and want to proceed» (может быть кастомизирован)

---

### 4.5 CopyButton

**Описание:** Кнопка копирования с feedback-состоянием.

**Состояния:**
1. Default: иконка `Copy`, при наведении tooltip «Copy»
2. После клика: иконка меняется на `Check` (зелёная, `--color-success`), tooltip «Copied!»
3. Через 2 секунды: возврат к Default

**Варианты:**
- `icon-only` — только иконка (для inline в адресе)
- `with-text` — иконка + текст «Copy Address» (для Receive Screen)

**Размер иконки:** 16×16px (inline), 20×20px (standalone).

---

### 4.6 TransactionItem

**Описание:** Элемент списка транзакций.

**Структура:**
```
┌──────────────────────────────────────────┐
│  ↑  UQBx...7f2K         -2.5 TON        │
│     label (если есть)    12:34, Jan 5    │
│     💬 Payment for...                    │
└──────────────────────────────────────────┘
```

**Элементы (слева направо):**

1. **Иконка направления:**
   - Исходящая (`↑` / `ArrowUpRight`): цвет `--color-error` (красный, деньги уходят)
   - Входящая (`↓` / `ArrowDownLeft`): цвет `--color-success` (зелёный, деньги приходят)
   - Размер: 20×20px, с цветным фоном-кругом (32×32px)

2. **Адрес контрагента:** `mono`, truncated (первые 4 + `...` + последние 4)

3. **Label из адресной книги:** `body-small`, `--color-text-secondary`, под адресом (если есть)

4. **Сумма:**
   - Исходящая: `-X.XX TON`, цвет `--color-text-primary`
   - Входящая: `+X.XX TON`, цвет `--color-success`
   - Шрифт: `body-medium`

5. **Дата и время:** `body-small`, `--color-text-secondary`, справа под суммой

6. **Комментарий (если есть):** `body-small`, `--color-text-secondary`, иконка 💬 + текст, строкой ниже, truncated с ellipsis если длинный

**Hover-состояние:** фон `--color-surface-hover`

**Разделитель:** тонкая линия `--color-border` (1px) между элементами

---

### 4.7 SearchBar

**Описание:** Поле поиска по истории транзакций.

**Элементы:**
- Иконка `Search` слева внутри поля
- Текстовое поле, placeholder: «Search by address, label, or comment»
- Иконка `X` справа (появляется когда есть текст, очищает поле по клику)

**Размер:** высота 40px, полная ширина контейнера

**Стилизация:**
- Фон: `--color-surface`
- Бордер: `--color-border`
- Скругление: `--radius-full` (pill-shape)
- Focus: border `--color-border-focus`

---

### 4.8 Loader

**Описание:** Индикатор загрузки.

**Варианты:**
1. **Spinner** — иконка `Loader2` с анимацией `rotate 1s linear infinite`
   - Размеры: 16px (inline), 24px (в кнопке), 40px (полноэкранный)
   - Цвет: `--color-primary`
2. **Full-screen loader** — спиннер 40px по центру экрана + текст под ним
   - Текст: динамический («Generating wallet...», «Sending...» и т.д.)
   - Фон: `--color-bg` с opacity 0.8 (overlay поверх текущего экрана)

---

### 4.9 Toast

**Описание:** Временное уведомление, появляющееся внизу экрана.

**Структура:**
```
┌──────────────────────────────────────┐
│ ✓ Transaction sent successfully      │
└──────────────────────────────────────┘
```

**Типы:**

| Тип | Иконка | Цвет акцента | Фон |
|-----|--------|-------------|-----|
| `success` | `Check` в круге | `--color-success` | `--color-surface` |
| `error` | `AlertCircle` | `--color-error` | `--color-surface` |
| `info` | `Info` | `--color-info` | `--color-surface` |

**Поведение:**
- Появление: slide-up + fade-in (200ms)
- Автоскрытие: через 4 секунды (success/info), 6 секунд (error)
- Позиция: фиксированная, внизу по центру, отступ от края 24px
- Скругление: `--radius-md`
- Тень: `--shadow-lg`
- Максимальная ширина: 400px

---

### 4.10 Modal (модальное окно)

**Описание:** Диалоговое окно поверх текущего экрана.

**Структура:**
```
┌──────────────────────────────────────┐
│ Modal Title                    [X]   │
├──────────────────────────────────────┤
│                                      │
│ Content area                         │
│                                      │
├──────────────────────────────────────┤
│              [Cancel]  [Confirm]     │
└──────────────────────────────────────┘
```

**Стилизация:**
- Overlay: `rgba(0,0,0,0.6)`, клик по overlay закрывает модал
- Фон: `--color-surface`
- Скругление: `--radius-lg`
- Тень: `--shadow-md`
- Максимальная ширина: 420px
- Padding: `--space-6`

**Применение:**
- Подтверждение удаления кошелька
- Подтверждение экспорта мнемоники (ввод пароля)

---

### 4.11 Checkbox

**Описание:** Чекбокс для подтверждения действий.

**Размер:** 20×20px

**Состояния:**
- Unchecked: border `--color-border`, фон `transparent`
- Checked: фон `--color-primary`, иконка `Check` белая внутри
- Hover: border `--color-border-focus`
- Disabled: opacity 0.4

**Скругление:** `--radius-xs`

---

### 4.12 FilterChips (переключатель фильтров)

**Описание:** Группа pill-кнопок для фильтрации (All / In / Out).

**Стилизация:**
- Неактивный: фон `transparent`, текст `--color-text-secondary`, border `--color-border`
- Активный: фон `--color-primary`, текст `#FFFFFF`
- Скругление: `--radius-full`
- Размер: высота 32px, padding 12px горизонтальный
- Gap между chips: `--space-2`

---

### 4.13 TextInput

**Описание:** Стандартное текстовое поле ввода.

**Стилизация:**
- Высота: 48px (lg), 40px (md)
- Фон: `--color-surface`
- Border: 1px solid `--color-border`
- Скругление: `--radius-sm`
- Padding: `--space-3` вертикальный, `--space-4` горизонтальный
- Placeholder: `--color-text-tertiary`
- Focus: border `--color-border-focus`
- Error: border `--color-error`

**Дополнения:**
- Label сверху: `body-small`, `--color-text-secondary`, margin-bottom `--space-1`
- Error-текст снизу: `body-small`, `--color-error`, margin-top `--space-1`
- Опциональная правая кнопка (MAX, Paste)

---

### 4.14 MnemonicGrid

**Описание:** Сетка для отображения или ввода 24 мнемонических слов.

**Вариант «отображение» (Backup Mnemonic):**
- Grid: 3 колонки × 8 строк (или 2 колонки × 12 строк на узких экранах)
- Каждая ячейка: номер (серый) + слово (mono)
- Фон grid: `--color-surface`, padding `--space-4`, скругление `--radius-md`
- Формат ячейки: `1. apple`
- Номер: `--color-text-tertiary`, слово: `--color-text-primary`

**Вариант «ввод» (Import Mnemonic):**
- Одно большое textarea (вставка всех 24 слов)
- ИЛИ 24 отдельных поля (но textarea предпочтительнее для удобства)
- Кнопка «Paste» справа сверху от textarea

---

### 4.15 QRCode

**Описание:** QR-код для адреса кошелька.

**Стилизация:**
- Размер: 200×200px
- Фон QR: белый (для контраста на тёмной теме)
- Padding вокруг QR: `--space-4` (белый)
- Контейнер: скругление `--radius-xl`, фон белый
- Код: чёрный на белом (стандартная расцветка для сканирования)

---

## 5. Экраны приложения

> Для каждого экрана указаны: назначение, layout, элементы, состояния, переходы. Wireframe-описание текстом — достаточное для создания визуального макета.

---

### 5.1 Welcome Screen

**Назначение:** Точка входа для нового пользователя (нет сохранённого кошелька).

**Layout:**
```
┌──────────────────────────────┐
│         [Testnet]            │
│                              │
│                              │
│         [Logo/Icon]          │
│                              │
│     TON Testnet Wallet       │
│                              │
│   Self-custodial wallet      │
│   for TON testnet            │
│                              │
│                              │
│  ┌──────────────────────┐    │
│  │  Create New Wallet   │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  Import Existing     │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Бейдж «Testnet» (вверху по центру)
2. Логотип/иконка приложения (может быть стилизованная иконка кристалла TON или простая геометрическая иконка кошелька)
3. Название: «TON Testnet Wallet» — `heading-2`
4. Подзаголовок: «Self-custodial wallet for TON testnet» — `body`, `--color-text-secondary`
5. Кнопка «Create New Wallet» — `primary`, `lg`, full-width
6. Кнопка «Import Existing Wallet» — `secondary`, `lg`, full-width

**Контент вертикально центрирован** в экране.

**Условие показа:** `localStorage` не содержит encrypted vault.

**Переходы:**
- «Create New Wallet» → Create Wallet Screen
- «Import Existing Wallet» → Import Mnemonic Screen

---

### 5.2 Create Wallet Screen

**Назначение:** Создание нового кошелька в два шага.

---

#### Шаг 1: Set Password

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│  Create New Wallet           │
│  Step 1 of 2                 │
│                              │
│  Set a password to protect   │
│  your wallet.                │
│                              │
│  Password                    │
│  ┌──────────────────────👁┐ │
│  │ ●●●●●●●●             │  │
│  └──────────────────────────┘│
│  [████░░░░] Fair ✓           │
│                              │
│  Confirm Password            │
│  ┌──────────────────────👁┐ │
│  │ ●●●●●●●●             │  │
│  └──────────────────────────┘│
│  ✗ Passwords do not match    │
│                              │
│  ┌──────────────────────┐    │
│  │     Continue          │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» (`ghost`, иконка `ChevronLeft`) — возврат на Welcome
2. Бейдж «Testnet»
3. Заголовок: «Create New Wallet» — `heading-2`
4. Шаг: «Step 1 of 2» — `body-small`, `--color-text-secondary`
5. Описание: «Set a password to protect your wallet.» — `body`, `--color-text-secondary`
6. Поле «Password» — компонент `PasswordInput` с `showStrength: true`
7. Поле «Confirm Password» — компонент `PasswordInput` с `showStrength: false`
8. Ошибка несовпадения: «Passwords do not match» — `body-small`, `--color-error`
9. Кнопка «Continue» — `primary`, `lg`, full-width
   - Disabled если: score < 2, пароли не совпадают, длина < 8

**Переходы:**
- «Continue» → Шаг 2 (Backup Mnemonic) — при этом генерируется мнемоника, keypair, шифруется vault
- «Back» → Welcome Screen

---

#### Шаг 2: Backup Mnemonic

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│  Back Up Recovery Phrase     │
│  Step 2 of 2                 │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠ Write down these 24 │  │
│  │ words and store them   │  │
│  │ safely. They are the   │  │
│  │ ONLY way to recover    │  │
│  │ your wallet.           │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 1. apple   9. river    │  │
│  │ 2. banana 10. storm    │  │
│  │ 3. cherry 11. table    │  │
│  │ ...                    │  │
│  │ 8. house  24. zebra    │  │
│  └────────────────────────┘  │
│                 [Copy All]   │
│                              │
│  ☐ I have saved my           │
│    recovery phrase           │
│                              │
│  ┌──────────────────────┐    │
│  │     Continue          │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Шаг 1
2. Бейдж «Testnet»
3. Заголовок: «Back Up Recovery Phrase» — `heading-2`
4. Шаг: «Step 2 of 2» — `body-small`, `--color-text-secondary`
5. WarningCard (severity: `warning`, blocking: false): предупреждение о записи слов
6. MnemonicGrid (вариант «отображение»): 24 слова
7. CopyButton (вариант `with-text`): «Copy All» — справа под grid
8. Checkbox: «I have saved my recovery phrase»
9. Кнопка «Continue» — `primary`, `lg`, full-width
   - Disabled если чекбокс не отмечен

**Переходы:**
- «Continue» → Main Screen
- «Back» → Шаг 1 (пароль сохранён в памяти, повторный ввод не требуется)

---

### 5.3 Import Mnemonic Screen

**Назначение:** Импорт существующего кошелька по мнемонической фразе.

---

#### Шаг 1: Enter Mnemonic

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│  Import Wallet               │
│                              │
│  Enter your 24-word          │
│  recovery phrase.            │
│                              │
│  Recovery Phrase     [Paste] │
│  ┌────────────────────────┐  │
│  │ apple banana cherry... │  │
│  │                        │  │
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│  ✗ Invalid mnemonic phrase   │
│                              │
│  ┌──────────────────────┐    │
│  │     Continue          │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Welcome Screen
2. Бейдж «Testnet»
3. Заголовок: «Import Wallet» — `heading-2`
4. Описание: «Enter your 24-word recovery phrase.» — `body`, `--color-text-secondary`
5. Textarea для ввода мнемоники:
   - Placeholder: «Enter words separated by spaces...»
   - Высота: ~120px (минимум 4 строки)
   - Шрифт: `mono`
6. Кнопка «Paste» — `ghost`, `sm`, справа над textarea
7. Ошибка валидации: «Invalid mnemonic phrase» — `body-small`, `--color-error`
8. Кнопка «Continue» — `primary`, `lg`
   - Disabled если мнемоника не прошла валидацию

**После нажатия Continue:**
- Показывается loader: «Detecting wallet versions...»
- Система параллельно проверяет v3R2, v4R2, v5R1 на блокчейне
- Если найдена одна версия или ни одной → переход к Set Password
- Если найдено несколько → переход к Select Version

---

#### Шаг 2 (условный): Select Version

**Показывается только если автодетекция нашла несколько версий контрактов.**

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│  Select Wallet Version       │
│                              │
│  Multiple wallets found for  │
│  this phrase. Select one.    │
│                              │
│  ┌────────────────────────┐  │
│  │ ○ v4R2 (recommended)   │  │
│  │   UQBx...7f2K          │  │
│  │   Balance: 5.23 TON    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ○ v3R2                 │  │
│  │   UQAy...3k1M          │  │
│  │   Balance: 0.00 TON    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ○ v5R1                 │  │
│  │   UQCz...9p4N          │  │
│  │   Balance: 1.50 TON    │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────────────────────┐    │
│  │     Continue          │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Шаг 1 (Enter Mnemonic)
2. Заголовок: «Select Wallet Version» — `heading-2`
3. Описание — `body`, `--color-text-secondary`
4. Список из 2-3 radio-карточек:
   - Radio button
   - Название версии: `body-medium`
   - Метка «(recommended)» для v4R2: `--color-primary`
   - Адрес: `mono-small`, truncated
   - Баланс: `body-small`, `--color-text-secondary`
   - Карточка: `--color-surface`, border `--color-border`, скругление `--radius-md`
   - Выбранная карточка: border `--color-primary`
5. Кнопка «Continue» — `primary`, `lg`

**Переходы:**
- «Continue» → Set Password (аналогичный Create Wallet шаг 1, но заголовок «Set Password for Imported Wallet»)

---

#### Шаг 3: Set Password (импорт)

Идентичен шагу 1 Create Wallet Screen, за исключением:
- Заголовок: «Set Password»
- Подзаголовок: «Protect your imported wallet with a password.»
- Нет шага 2 (backup) — у пользователя уже есть мнемоника
- «Continue» → Main Screen

---

### 5.4 Unlock Screen

**Назначение:** Ввод пароля при возврате в приложение (vault существует в localStorage).

**Layout:**
```
┌──────────────────────────────┐
│         [Testnet]            │
│                              │
│                              │
│         [Lock Icon]          │
│                              │
│     TON Testnet Wallet       │
│                              │
│  Enter your password to      │
│  unlock the wallet.          │
│                              │
│  Password                    │
│  ┌──────────────────────👁┐ │
│  │ ●●●●●●●●             │  │
│  └──────────────────────────┘│
│  ✗ Wrong password            │
│                              │
│  ┌──────────────────────┐    │
│  │      Unlock           │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Бейдж «Testnet»
2. Иконка замка (или логотип)
3. Название: «TON Testnet Wallet» — `heading-2`
4. Описание: «Enter your password to unlock the wallet.» — `body`, `--color-text-secondary`
5. Поле «Password» — `PasswordInput` без strength indicator
6. Ошибка: «Wrong password» — `body-small`, `--color-error`
7. Кнопка «Unlock» — `primary`, `lg`, full-width

**Поведение:**
- При успешной расшифровке vault → Main Screen
- При неверном пароле → сообщение об ошибке, поле очищается
- Нет кнопки «Back» (это единственная точка входа при существующем vault)

**Примечание:** этот экран не описан в разделе 6 ТЗ как отдельный, но подразумевается поведением «unlock flow» из раздела 12 (Фаза 6). Он необходим для полноценного пользовательского опыта.

---

### 5.5 Main Screen

**Назначение:** Основной экран после входа — баланс, быстрые действия, история транзакций.

**Layout:**
```
┌──────────────────────────────┐
│  TON Wallet [Testnet]   [⚙] │
├──────────────────────────────┤
│                              │
│     UQBx...7f2K   [📋]      │
│                              │
│        5.230 TON             │
│                              │
│   [  Receive  ] [  Send  ]   │
│                              │
├──────────────────────────────┤
│  Transactions                │
│                              │
│  🔍 Search by address...     │
│  [All] [In] [Out]            │
│                              │
│  ┌────────────────────────┐  │
│  │ ↓ UQAx...3k1M +1.5TON│  │
│  │   Alice    12:34 Jan 5│  │
│  ├────────────────────────┤  │
│  │ ↑ UQBy...7f2K -0.5TON│  │
│  │   Bob      11:20 Jan 5│  │
│  │   💬 Payment           │  │
│  ├────────────────────────┤  │
│  │ ↓ UQCz...9p4N +3.0TON│  │
│  │           10:05 Jan 4 │  │
│  └────────────────────────┘  │
│                              │
│     [Load more]              │
│                              │
│  Updated 5 sec ago           │
│                              │
└──────────────────────────────┘
```

**Блок 1 — Header:**
1. Название приложения: «TON Wallet» — `heading-3` (или лого)
2. Бейдж «Testnet»
3. Кнопка Settings — `icon`, иконка `Settings`, справа

**Блок 2 — Wallet Info:**
1. Адрес: `HighlightedAddress` (вариант `truncated`) + `CopyButton` (icon-only)
2. Баланс: `heading-1`, `--color-text-primary`, по центру
   - Единица: «TON» — `body`, `--color-text-secondary`
3. Две кнопки в ряд:
   - «Receive» — `secondary`, `md`, 50% ширины, иконка `ArrowDownLeft`
   - «Send» — `primary`, `md`, 50% ширины, иконка `Send`

**Блок 3 — Transaction History:**
1. Заголовок секции: «Transactions» — `heading-3`
2. `SearchBar`
3. `FilterChips`: All / In / Out
4. Список транзакций — компоненты `TransactionItem`
5. Кнопка «Load more» — `ghost`, `sm`, по центру
6. Текст «Updated N sec ago» — `caption`, `--color-text-tertiary`, по центру

**Пустое состояние (нет транзакций):**
```
┌────────────────────────────┐
│                            │
│     [Иконка inbox]        │
│                            │
│   No transactions yet      │
│                            │
│   Send or receive TON to   │
│   see your transaction     │
│   history.                 │
│                            │
└────────────────────────────┘
```

**Состояние загрузки:** Skeleton-плейсхолдеры для баланса и списка транзакций (прямоугольники с пульсирующей анимацией).

**Поведение:**
- Polling баланса каждые 10 сек
- «Updated N sec ago» обновляется каждую секунду
- При ошибке сети — Toast с ошибкой

---

### 5.6 Receive Screen

**Назначение:** Отображение адреса кошелька и QR-кода для получения средств.

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│        Receive TON           │
│                              │
│    ┌──────────────────┐      │
│    │                  │      │
│    │    [QR CODE]     │      │
│    │                  │      │
│    └──────────────────┘      │
│                              │
│  UQBxkl2Hf7...p4N7f2K       │
│  (полный адрес, mono)        │
│                              │
│  ┌──────────────────────┐    │
│  │ 📋 Copy Address      │    │
│  └──────────────────────┘    │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠ This is a testnet   │  │
│  │ address. Do not send   │  │
│  │ real TON here.         │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Main Screen
2. Бейдж «Testnet»
3. Заголовок: «Receive TON» — `heading-2`
4. QR-код — компонент `QRCode`, 200×200px, по центру
5. Полный адрес — `HighlightedAddress` (вариант `full`), по центру
6. Кнопка «Copy Address» — `secondary`, `lg`, full-width, с иконкой `Copy`
   - Feedback: текст меняется на «Copied!» + иконка `Check` на 2 сек
7. WarningCard (severity: `warning`, blocking: false): «This is a testnet address. Do not send real TON here.»

---

### 5.7 Send Screen

**Назначение:** Отправка TON — форма ввода, подтверждение, результат. Три шага.

---

#### Шаг 1: Input Form

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│        Send TON              │
│                              │
│  Available: 5.230 TON        │
│                              │
│  Recipient Address           │
│  ┌────────────────────────┐  │
│  │ UQ...                  │  │
│  └────────────────────────┘  │
│  ✗ Invalid address format    │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠ Similar address      │  │
│  │ found in address book! │  │
│  │ Possible clipboard     │  │
│  │ poisoning attack.      │  │
│  └────────────────────────┘  │
│                              │
│  Amount                [MAX] │
│  ┌────────────────────────┐  │
│  │ 0.5                    │  │
│  └────────────────────────┘  │
│                              │
│  Comment (optional)          │
│  ┌────────────────────────┐  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌──────────────────────┐    │
│  │     Continue          │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Main Screen
2. Бейдж «Testnet»
3. Заголовок: «Send TON» — `heading-2`
4. Доступный баланс: «Available: X.XXX TON» — `body-small`, `--color-text-secondary`
5. Поле «Recipient Address» — `TextInput`, `lg`
   - Inline-валидация: ошибки формата адреса, предупреждение self-send
6. Inline-warnings (появляются динамически по мере ввода):
   - `WarningCard` при обнаружении похожего адреса (severity: `critical`)
   - `WarningCard` при отправке самому себе (severity: `warning`)
7. Поле «Amount» — `TextInput`, `lg`, type: number
   - Кнопка «MAX» справа внутри поля — `ghost`, `sm`, `--color-primary`
   - MAX = баланс − 0.01 TON (резерв на комиссию)
8. Поле «Comment» — `TextInput`, `md` (optional)
   - Placeholder: «Optional message»
9. Кнопка «Continue» — `primary`, `lg`, full-width
   - Disabled если: адрес невалиден ИЛИ amount = 0 ИЛИ amount > balance ИЛИ есть error-уровневые warnings

**Переходы:**
- «Continue» → Шаг 2 (Confirmation) — запускается полный pipeline валидации
- «Back» → Main Screen

---

#### Шаг 2: Confirmation

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│     Confirm Transaction      │
│                              │
│  To:                         │
│  ┌────────────────────────┐  │
│  │ UQBx kl2Hf7dp...7f2K  │  │
│  │ (highlighted address)  │  │
│  └────────────────────────┘  │
│                              │
│  Amount:          2.500 TON  │
│  Fee (est.):     ~0.005 TON  │
│  Comment:        Payment     │
│  ────────────────────────    │
│  Total:          ~2.505 TON  │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠ Account is not       │  │
│  │ initialized. Funds may │  │
│  │ be lost.               │  │
│  │ ☐ I understand         │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔴 Bounceable address  │  │
│  │ to uninit account!     │  │
│  │ ☐ I understand         │  │
│  └────────────────────────┘  │
│                              │
│  Password                    │
│  ┌──────────────────────👁┐ │
│  │ ●●●●●●●●             │  │
│  └──────────────────────────┘│
│  ✗ Wrong password            │
│                              │
│  ┌──────────────────────┐    │
│  │       Send            │    │
│  └──────────────────────┘    │
│                              │
│  [Cancel]                    │
│                              │
└──────────────────────────────┘
```

**Элементы:**
1. Кнопка «Back» → Шаг 1 (форма ввода, данные сохранены)
2. Бейдж «Testnet»
3. Заголовок: «Confirm Transaction» — `heading-2`
4. Детали транзакции (карточка `--color-surface`):
   - «To:» + `HighlightedAddress` (вариант `full`)
   - «Amount:» + значение
   - «Fee (est.):» + ~0.005 TON — `--color-text-secondary`
   - «Comment:» + текст (если есть)
   - Разделитель
   - «Total:» + сумма amount + fee — `body-medium`
5. Список предупреждений — компоненты `WarningCard`:
   - Каждый blocking warning содержит чекбокс
   - Non-blocking — без чекбокса
   - Порядок: `error` → `critical` → `warning` → `info`
6. Поле «Password» — `PasswordInput` без strength indicator
7. Кнопка «Send» — `primary`, `lg`, full-width
   - Disabled если: не все blocking-чекбоксы отмечены ИЛИ пароль не введён
   - Disabled если есть error-уровневые warnings (которые блокируют полностью, например недостаточно средств)
8. Кнопка «Cancel» — `ghost`, по центру

**Переходы:**
- «Send» → Шаг 3 (Result)
- «Cancel» → Main Screen
- «Back» → Шаг 1

---

#### Шаг 3: Result

**Три состояния:**

**A. Pending:**
```
┌──────────────────────────────┐
│                   [Testnet]  │
│                              │
│                              │
│         [Spinner]            │
│                              │
│       Sending...             │
│                              │
│   Please wait while your     │
│   transaction is being       │
│   processed.                 │
│                              │
└──────────────────────────────┘
```

**B. Success:**
```
┌──────────────────────────────┐
│                   [Testnet]  │
│                              │
│                              │
│          [✓ icon]            │
│     (green circle)           │
│                              │
│    Transaction Sent!         │
│                              │
│   2.500 TON sent to          │
│   UQBx...7f2K                │
│                              │
│   TX: a3f2...9k1m  [📋]     │
│                              │
│  ┌──────────────────────┐    │
│  │   Back to Wallet      │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**C. Error:**
```
┌──────────────────────────────┐
│                   [Testnet]  │
│                              │
│                              │
│          [✗ icon]            │
│     (red circle)             │
│                              │
│    Transaction Failed        │
│                              │
│   Error details text here    │
│                              │
│  ┌──────────────────────┐    │
│  │     Try Again         │    │
│  └──────────────────────┘    │
│  ┌──────────────────────┐    │
│  │   Back to Wallet      │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**D. Timeout (30 сек):**
```
┌──────────────────────────────┐
│                   [Testnet]  │
│                              │
│                              │
│         [⚠ icon]             │
│    (amber circle)            │
│                              │
│    Transaction Status        │
│    Unknown                   │
│                              │
│   Transaction may have been  │
│   sent. Please check your    │
│   balance.                   │
│                              │
│  ┌──────────────────────┐    │
│  │   Back to Wallet      │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Элементы результатов:**
- Иконки в цветных кругах: 48×48px
- Хеш транзакции (Success): `mono-small`, truncated + CopyButton
- Кнопка «Back to Wallet» → Main Screen
- Кнопка «Try Again» → Шаг 1 (данные формы сохранены)

---

### 5.8 Settings Screen

**Назначение:** Управление кошельком — информация, экспорт, удаление.

**Layout:**
```
┌──────────────────────────────┐
│  ← Back            [Testnet]│
│                              │
│        Settings              │
│                              │
│  ┌────────────────────────┐  │
│  │ Wallet Info             │  │
│  │                        │  │
│  │ Version: v4R2          │  │
│  │ Network: TON Testnet   │  │
│  │ Address:               │  │
│  │ UQBxkl2Hf7dp...7f2K   │  │
│  │               [📋]     │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔑 Security            │  │
│  │                        │  │
│  │ [Export Recovery Phrase]│  │
│  │ [Change Password]      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ ⚠ Danger Zone          │  │
│  │                        │  │
│  │ [Delete Wallet]        │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

**Элементы:**

**Секция «Wallet Info»** (карточка):
1. Версия контракта: «v4R2» — `body`
2. Сеть: «TON Testnet» — `body`
3. Полный адрес: `HighlightedAddress` (full) + `CopyButton`

**Секция «Security»** (карточка):
1. «Export Recovery Phrase» — кнопка-строка (full-width, left-aligned text), иконка `Shield` слева, иконка `ChevronRight` справа
2. [ОПЦИЯ] «Export Private Key» — аналогичная кнопка-строка
3. «Change Password» — кнопка-строка, иконка `Key` слева

**Секция «Danger Zone»** (карточка с border `--color-error` при opacity 30%):
1. «Delete Wallet» — `danger`, `md`, full-width, иконка `Trash2`

---

#### Sub-flow: Export Recovery Phrase

**Шаг 1: Ввод пароля**

Модальное окно:
```
┌──────────────────────────────┐
│ Export Recovery Phrase  [X]   │
├──────────────────────────────┤
│                              │
│ Enter your password to       │
│ view the recovery phrase.    │
│                              │
│ Password                     │
│ ┌──────────────────────👁┐  │
│ │ ●●●●●●●●             │   │
│ └────────────────────────┘  │
│                              │
│ ⚠ NEVER share your          │
│ recovery phrase with anyone. │
│ Anyone with these words can  │
│ steal your funds.            │
│                              │
│ ☐ I understand the risks     │
│                              │
│ [Cancel]    [View Phrase]     │
└──────────────────────────────┘
```

**Шаг 2: Отображение фразы**

Модальное окно:
```
┌──────────────────────────────┐
│ Recovery Phrase        [X]   │
├──────────────────────────────┤
│                              │
│ ┌────────────────────────┐   │
│ │ 1. apple   9. river    │   │
│ │ 2. banana 10. storm    │   │
│ │ ...                    │   │
│ │ 8. house  24. zebra    │   │
│ └────────────────────────┘   │
│               [Copy All]     │
│                              │
│ ⏱ Auto-hiding in 52 sec     │
│                              │
│        [Close]               │
└──────────────────────────────┘
```

**Элементы:**
- MnemonicGrid (отображение)
- CopyButton «Copy All»
- Таймер обратного отсчёта: 60 секунд
- По истечении таймера или клику «Close» — модал закрывается

---

#### Sub-flow: Change Password

Модальное окно:
```
┌──────────────────────────────┐
│ Change Password        [X]   │
├──────────────────────────────┤
│                              │
│ Current Password             │
│ ┌──────────────────────👁┐  │
│ │ ●●●●●●●●             │   │
│ └────────────────────────┘  │
│                              │
│ New Password                 │
│ ┌──────────────────────👁┐  │
│ │ ●●●●●●●●             │   │
│ └────────────────────────┘  │
│ [████░░░░] Fair ✓            │
│                              │
│ Confirm New Password         │
│ ┌──────────────────────👁┐  │
│ │ ●●●●●●●●             │   │
│ └────────────────────────┘  │
│                              │
│ [Cancel]  [Change Password]  │
└──────────────────────────────┘
```

---

#### Sub-flow: Delete Wallet

Модальное окно:
```
┌──────────────────────────────┐
│ Delete Wallet          [X]   │
├──────────────────────────────┤
│                              │
│ ⚠ This action cannot be      │
│ undone. Your encrypted       │
│ wallet data will be          │
│ permanently deleted from     │
│ this browser.                │
│                              │
│ Make sure you have backed    │
│ up your recovery phrase      │
│ before proceeding.           │
│                              │
│ Type "DELETE" to confirm:    │
│ ┌────────────────────────┐   │
│ │                        │   │
│ └────────────────────────┘   │
│                              │
│ [Cancel]  [Delete Wallet]    │
└──────────────────────────────┘
```

**Элементы:**
- WarningCard (severity: `critical`)
- Поле ввода: пользователь должен набрать «DELETE»
- Кнопка «Delete Wallet» — `danger`, disabled пока не набрано «DELETE»
- После удаления: очистка localStorage → redirect на Welcome Screen

---

## 6. Навигация и роутинг

**Карта переходов:**

```
                    ┌─────────────┐
                    │   Welcome   │
                    └──────┬──────┘
                     ┌─────┴─────┐
                     ▼           ▼
              ┌──────────┐ ┌──────────┐
              │  Create  │ │  Import  │
              └────┬─────┘ └────┬─────┘
                   │            │
                   ▼            ▼
              ┌────────────────────┐
              │    Unlock Screen   │◄─── (при повторном входе)
              └─────────┬─────────┘
                        ▼
              ┌─────────────────┐
              │   Main Screen   │◄───────────────┐
              └───┬───┬───┬─────┘                │
                  │   │   │                      │
          ┌───────┘   │   └───────┐              │
          ▼           ▼           ▼              │
   ┌──────────┐ ┌──────────┐ ┌──────────┐       │
   │ Receive  │ │   Send   │ │ Settings │       │
   └──────────┘ └──────────┘ └──────────┘       │
                      │                          │
                      ▼                          │
               ┌──────────┐                      │
               │ Confirm  │──────────────────────┘
               └──────────┘          (после отправки)
```

**Правило навигации:** Кнопка «Back» всегда возвращает на предыдущий логический шаг. Нет глубокой иерархии — максимум 3 уровня вложенности.

---

## 7. Адаптивные точки перелома

Приложение использует одну колонку фиксированной максимальной ширины, поэтому breakpoints минимальны:

| Ширина | Изменения |
|--------|----------|
| < 360px | Не поддерживается (предупреждение) |
| 360–480px | Контент на всю ширину, padding 16px |
| 480–1024px | Контент 480px, центрирован |
| > 1024px | Контент 480px, центрирован, фон `--color-bg` по бокам |

**MnemonicGrid:**
- ≥ 420px: 3 колонки × 8 строк
- < 420px: 2 колонки × 12 строк

---

## 8. Анимации и переходы

Минимальные, функциональные анимации:

| Элемент | Анимация | Длительность |
|---------|----------|-------------|
| Переход между экранами | Нет (мгновенная замена) | — |
| Toast: появление | slide-up + fade-in | 200ms |
| Toast: исчезновение | fade-out | 150ms |
| Spinner | rotate 360° | 1000ms, linear, infinite |
| Skeleton-loading | pulse (opacity 0.3 → 0.7) | 1500ms, ease-in-out, infinite |
| CopyButton feedback | мгновенная смена иконки | — |
| Button hover/active | цвет фона | 100ms, ease |
| Focus ring | border-color | 100ms, ease |
| WarningCard появление | fade-in + slide-down | 200ms |
| Modal: overlay | fade-in | 200ms |
| Modal: контент | fade-in + scale(0.95→1) | 200ms |

---

## 9. Чек-лист полноты

| Экран / Компонент | Описан | Состояния | Переходы |
|-------------------|--------|-----------|----------|
| Welcome Screen | ✅ | 1 | 2 перехода |
| Create Wallet (Set Password) | ✅ | default, validation error, disabled | 2 |
| Create Wallet (Backup Mnemonic) | ✅ | default, checkbox toggled | 2 |
| Import Mnemonic (Enter Words) | ✅ | default, error, loading | 2 |
| Import Mnemonic (Select Version) | ✅ | default, selected | 2 |
| Import Mnemonic (Set Password) | ✅ | (аналог Create) | 1 |
| Unlock Screen | ✅ | default, error | 1 |
| Main Screen | ✅ | loading, empty, populated, search active | 3 |
| Receive Screen | ✅ | default, copied | 1 |
| Send (Input Form) | ✅ | default, inline warnings, errors | 2 |
| Send (Confirmation) | ✅ | default, checkboxes, password error | 3 |
| Send (Result) | ✅ | pending, success, error, timeout | varies |
| Settings Screen | ✅ | default | 3 sub-flows |
| Export Recovery (modal) | ✅ | password, display + timer | 2 |
| Change Password (modal) | ✅ | default, validation | 1 |
| Delete Wallet (modal) | ✅ | default, confirmation typed | 1 |
| PasswordInput | ✅ | 4 states + strength | — |
| HighlightedAddress | ✅ | full, truncated | — |
| WarningCard | ✅ | 4 severity × ±checkbox | — |
| CopyButton | ✅ | default, copied | — |
| TransactionItem | ✅ | in/out × ±comment × ±label | — |
| SearchBar | ✅ | empty, has text | — |
| FilterChips | ✅ | 3 options | — |
| Loader | ✅ | spinner, full-screen | — |
| Toast | ✅ | success, error, info | — |
| Modal | ✅ | generic | — |
| Button | ✅ | 5 variants × 3 sizes × 5 states | — |
| TextInput | ✅ | default, focus, error, disabled | — |
| Checkbox | ✅ | unchecked, checked, hover, disabled | — |
| MnemonicGrid | ✅ | display, input | — |
| QRCode | ✅ | — | — |

---

## 10. Указания для AI-ассистента по дизайну

1. **Создай макеты для каждого экрана**, описанного в разделе 5, включая все указанные состояния.

2. **Создай component sheet** — отдельный лист со всеми компонентами из раздела 4 во всех вариантах и состояниях.

3. **Бейдж «Testnet» должен присутствовать на КАЖДОМ макете** — это критическое требование безопасности.

4. **Используй только тёмную тему** с палитрой из раздела 3.1.

5. **Шрифт — системный стек**, не загружай внешние шрифты. В макетах используй Inter или SF Pro как визуальный эквивалент системного sans-serif.

6. **Все адреса в моноширинном шрифте** с подсветкой первых 4 и последних 4 символов.

7. **Приоритет функциональности над украшательством.** Каждый пиксель должен нести смысл.

8. **Контентная колонка — максимум 480px**, центрирована. Показывай макеты в контексте полноэкранного окна браузера с фоном по бокам.

9. **Warning-карточки** — один из ключевых UI-элементов приложения (защита от подмены адреса). Они должны быть хорошо заметны, но не перекрывать основной контент.

10. **Экран подтверждения отправки (5.7, Шаг 2)** — самый сложный экран. Обрати особое внимание на его layout: он может содержать 3-4 warning-карточки одновременно + поле пароля + кнопки. Убедись, что всё помещается со скроллом.

