# TON Pocket 💎

> 🎓 **Demo Project (Test Assignment)**  
> A complete implementation of the technical requirements for creating a *self-custodial* web wallet for the TON ecosystem. [View project requirements →](docs/testovoe.md)

**TON Pocket** is a fast, intuitive, and truly secure crypto wallet for the **TON Testnet**.  
The *Single Page Application (SPA)* architecture ensures that all operations (including encryption and transaction signing) happen exclusively on your device. No backend servers, no intermediaries — just maximum privacy and absolute control over your assets.

![TON Pocket Preview](https://img.shields.io/badge/TON-Testnet-blue?style=for-the-badge&logo=ton&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 📂 Repository Structure

- `ton-wallet-app/` — Main web application (Vite + React + TypeScript + Tailwind CSS 4).
- `docs/` — Project documentation (PLAN, CHANGELOG, DIARY, DESIGN_BRIEF).
- `design/` — Design assets and wireframes registry.

---

## ✨ Key Features

- 🛡️ **Security**: Mnemonic encryption using AES-256-GCM. Key derivation via Argon2id (with automatic fallback to PBKDF2).
- 🔐 **Self-Custodial**: All secret data is stored only in encrypted form in your browser's local storage.
- 📦 **Wallet Version Support**: Works with wallet contracts **v3R2**, **v4R2**, and **v5R1**. Automatic detection of active versions during import.
- 💸 **Token Management**: View balance, transaction history, and send TON in the test network.
- 🔍 **Smart Validation**: Multi-level validation pipeline for transfers:
  - Address format check.
  - Warning when sending to self.
  - **Clipboard Poisoning** protection (checking address similarity).
  - Recipient account state check (uninit/frozen).
- 📒 **Address Book**: Automatic contact saving.
- 🎨 **Modern UI**: Premium Material You-style design with deep dark mode support and micro-animations.

---

## 🛠 Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand v5 (with persist middleware)
- **Routing**: Wouter
- **Blockchain Interface**: `@ton/ton`, `@ton/crypto`
- **Security**: `argon2-browser`, `zxcvbn-ts` (password strength estimation)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation and Run
1. Clone the repository:
   ```bash
   git clone https://github.com/Dmitry-Raskovalov/ton-pocket.git
   cd ton-pocket/ton-wallet-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start in development mode:
   ```bash
   npm run dev
   ```

### Environment Variables
Create a `ton-wallet-app/.env` file based on `.env.example`:
- `VITE_TON_ENDPOINT`: URL for TON Center API.
- `VITE_TON_API_KEY`: Your API key from TON Center.

---

## 💎 Getting Test Tokens

To test the sending features, you will need test coins (Testnet TON).

1. Open Telegram and find the [**@testgiver_ton_bot**](https://t.me/testgiver_ton_bot).
2. Start the bot and follow the instructions.
3. Provide your wallet address from the TON Pocket app (copy it from the **Receive** screen).
4. Tokens will arrive in your balance within seconds.

---

## 🧪 Testing

Run all unit tests (535+ tests):
```bash
cd ton-wallet-app
npm run test
```

Run E2E tests (14 tests, Playwright):
```bash
cd ton-wallet-app
npm run test:e2e
```

---

## 🏗 Project Architecture

- `ton-wallet-app/src/crypto/` — Encryption modules (KDF, Vault).
- `ton-wallet-app/src/services/` — TON API interaction, validation.
- `ton-wallet-app/src/store/` — Global application state.
- `ton-wallet-app/src/screens/` — Main application screens.
- `ton-wallet-app/src/components/` — Reusable UI components.

---

## 🗺 Roadmap

- [ ] TON Connect integration.
- [ ] Mainnet support.
- [ ] NFT and Jettons management.
- [ ] Multi-language interface support.
- [ ] Mobile application (React Native).

---

## 📄 License

Distributed under the MIT License.
