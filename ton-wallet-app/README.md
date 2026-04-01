# TON Pocket 💎

**TON Pocket** — это современный, безопасный и интуитивно понятный self-custodial криптокошелёк для сети **TON Testnet**.  
Приложение представляет собой Single Page Application (SPA), работающее полностью на стороне клиента, обеспечивая максимальную приватность и контроль над вашими средствами.

![TON Pocket Preview](https://img.shields.io/badge/TON-Testnet-blue?style=for-the-badge&logo=ton&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## ✨ Основные возможности

- 🛡️ **Безопасность**: Шифрование мнемоники по стандарту AES-256-GCM. Ключ деривируется с использованием Argon2id (с автоматическим fallback на PBKDF2).
- 🔐 **Self-Custodial**: Все секретные данные хранятся только в зашифрованном виде в локальном хранилище вашего браузера.
- 📦 **Поддержка версий**: Работа с контрактами кошельков версий **v3R2**, **v4R2** и **v5R1**. Автоматическая детекция активных версий при импорте.
- 💸 **Управление токенами**: Просмотр баланса, истории транзакций и отправка TON в тестовой сети.
- 🔍 **Умная валидация**: Многоуровневый Pipeline валидации при отправке:
  - Проверка формата адреса.
  - Предупреждение при отправке самому себе.
  - Защита от **Clipboard Poisoning** (проверка на схожесть адресов).
  - Проверка состояния аккаунта получателя (uninit/frozen).
- 📒 **Адресная книга**: Автоматическое и ручное сохранение контактов с возможностью присвоения меток.
- 🎨 **Современный UI**: Премиальный дизайн в стиле Material You с поддержкой глубокой тёмной темы и микро-анимаций.

---

## 🛠 Технологический стек

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (с persist middleware)
- **Routing**: Wouter
- **Blockchain Interface**: `@ton/ton`, `@ton/crypto`
- **Security**: `argon2-browser`, `zxcvbn-ts` (оценка силы пароля)
- **Testing**: Vitest, React Testing Library

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn

### Установка
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/Dmitry-Raskovalov/ton-pocket.git
   cd ton-pocket/ton-wallet-app
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Запустите в режиме разработки:
   ```bash
   npm run dev
   ```

### Переменные окружения
Создайте файл `.env` на основе `.env.example`:
- `VITE_TON_ENDPOINT`: URL TON Center API (по умолчанию testnet).
- `VITE_TON_API_KEY`: Ваш API ключ от TON Center.

---

## 💎 Получение тестовых токенов

Так как приложение работает в сети **TON Testnet**, для тестирования функций отправки вам понадобятся тестовые монеты (Testnet TON).

1. Откройте Telegram и найдите бота [**@testgiver_ton_bot**](https://t.me/testgiver_ton_bot).
2. Запустите бота и следуйте инструкциям (обычно нужно нажать кнопку «Get 2 TON»).
3. Укажите ваш адрес кошелька из приложения TON Pocket (его можно скопировать на экране **Receive**).
4. Через несколько секунд токены поступят на ваш баланс.

---

## 🧪 Тестирование

Запуск всех юнит-тестов:
```bash
npm run test
```

Просмотр покрытия тестами:
```bash
npm run test:coverage
```

---

## 🏗 Архитектура проекта

- `src/crypto/` — Модули шифрования (KDF, Vault).
- `src/services/` — Взаимодействие с TON API, валидация и бизнес-логика.
- `src/store/` — Глобальное состояние приложения (Wallet, Transactions, UI).
- `src/screens/` — Основные экраны приложения (Onboarding, Main, Send, Receive).
- `src/components/` — Переиспользуемые UI-компоненты.

---

## 🗺 Планы (Roadmap)

- [ ] Интеграция TON Connect.
- [ ] Поддержка Mainnet.
- [ ] Управление NFT и Jettons.
- [ ] Перевод интерфейса на несколько языков.
- [ ] Мобильное приложение (React Native).

---
## 📄 Лицензия

Проект распространяется под лицензией MIT. Подробности в файле [LICENSE](../LICENSE).
