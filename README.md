# TON Pocket 💎

**TON Pocket** — это безопасный и интуитивно понятный self-custodial криптокошелёк для сети **TON Testnet**.  
Проект состоит из веб-приложения (SPA) на React, обеспечивающего полный контроль над средствами без внешнего бэкенда.

---

## 📂 Структура репозитория

- `ton-wallet-app/` — Основное веб-приложение (Vite + React + TypeScript + Tailwind CSS 4).
- `docs/` — Проектная документация (PLAN, CHANGELOG, DIARY, DESIGN_BRIEF).
- `design/` — Реестр дизайн-макетов и wireframes.

---

## 🔥 Ключевые возможности

- 🛡️ **Максимальная безопасность**: AES-256-GCM шифрование мнемоники, Argon2id/PBKDF2 для ключей.
- 📦 **Поддержка версий**: Работа с контрактами v3R2, v4R2 и v5R1.
- 🔍 **Валидация Pipeline**: Защита от ошибок ввода и Clipboard Poisoning.
-  Ledger: Книга адресов с автоматическим пополнением.

---

## 🛠 Технологический стек

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4
- **Blockchain**: `@ton/ton`, `@ton/crypto`
- **Crypto**: `argon2-browser`, `zxcvbn-ts`
- **Testing**: Vitest, React Testing Library

---

## 🚀 Начало работы

Подробные инструкции по установке и запуску находятся в [ton-wallet-app/README.md](./ton-wallet-app/README.md).

1. Перейдите в папку приложения:
   ```bash
   cd ton-wallet-app
   ```
2. Установите зависимости и запустите:
   ```bash
   npm install
   ```
3. Запустите в режиме разработки:
   ```bash
   npm run dev
   ```

4. Чтобы остановить сервер, нажмите `Ctrl+C` в терминале.

---

## 🧪 Тестирование

Запуск всех юнит-тестов (более 300+ тестов):
```bash
cd ton-wallet-app
npm run test
```

---

## 📄 Лицензия

Проект распространяется под лицензией MIT.
