# TON Pocket 💎

**TON Pocket** — это современный, безопасный и интуитивно понятный self-custodial криптокошелёк для сети **TON Testnet**.  
Приложение представляет собой Single Page Application (SPA), работающее полностью на стороне клиента, обеспечивая максимальную приватность и контроль над вашими средствами.

![TON Pocket Preview](https://img.shields.io/badge/TON-Testnet-blue?style=for-the-badge&logo=ton&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📂 Структура репозитория

- `ton-wallet-app/` — Основное веб-приложение (Vite + React + TypeScript + Tailwind CSS 4).
- `docs/` — Проектная документация (PLAN, CHANGELOG, DIARY, DESIGN_BRIEF).
- `design/` — Реестр дизайн-макетов и wireframes.

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

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand v5 (с persist middleware)
- **Routing**: Wouter
- **Blockchain Interface**: `@ton/ton`, `@ton/crypto`
- **Security**: `argon2-browser`, `zxcvbn-ts` (оценка силы пароля)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

---

## 🚀 Начало работы

### Требования
- Node.js 18+
- npm

### Установка и запуск
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
Создайте файл `ton-wallet-app/.env` на основе `.env.example`:
- `VITE_TON_ENDPOINT`: URL TON Center API.
- `VITE_TON_API_KEY`: Ваш API ключ от TON Center.

---

## 💎 Получение тестовых токенов

Для тестирования функций отправки вам понадобятся тестовые монеты (Testnet TON).

1. Откройте Telegram и найдите бота [**@testgiver_ton_bot**](https://t.me/testgiver_ton_bot).
2. Запустите бота и следуйте инструкциям.
3. Укажите ваш адрес кошелька из приложения TON Pocket (его можно скопировать на экране **Receive**).
4. Через несколько секунд токены поступят на ваш баланс.

---

## 🧪 Тестирование

Запуск всех юнит-тестов (535+ тестов):
```bash
cd ton-wallet-app
npm run test
```

Запуск E2E-тестов (14 тестов, Playwright):
```bash
cd ton-wallet-app
npm run test:e2e
```

---

## 🏗 Архитектура проекта

- `ton-wallet-app/src/crypto/` — Модули шифрования (KDF, Vault).
- `ton-wallet-app/src/services/` — Взаимодействие с TON API, валидация.
- `ton-wallet-app/src/store/` — Глобальное состояние приложения.
- `ton-wallet-app/src/screens/` — Основные экраны приложения.
- `ton-wallet-app/src/components/` — Переиспользуемые UI-компоненты.

---

## 🗺 Планы (Roadmap)

- [ ] Интеграция TON Connect.
- [ ] Поддержка Mainnet.
- [ ] Управление NFT и Jettons.
- [ ] Перевод интерфейса на несколько языков.
- [ ] Мобильное приложение (React Native).

---

## 📄 Лицензия

Проект распространяется под лицензией MIT.
