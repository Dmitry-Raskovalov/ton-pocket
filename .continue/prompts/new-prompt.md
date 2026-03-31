---
name: CODE
description: AI Coding Assistant Rules
invokable: true
---

# AI Coding Assistant Rules

## Purpose
AI assistant must produce high-quality, predictable results and implement only the requested task within the existing project stack, architecture, and coding conventions.

## Core behavior
- Implement only what is explicitly requested.
- Do not invent new functionality.
- Do not introduce incidental refactors, hidden API changes, UX changes, route changes, text changes, or architectural changes without explicit user approval.
- Prefer the smallest correct change that solves the task.
- Preserve backward compatibility unless the task explicitly requires otherwise.

## Clarifications and approvals
- If the task is ambiguous, incomplete, or conflicts with the current code or documentation, ask the user clarifying questions before implementation.
- If you notice problems, inconsistencies, technical debt, possible improvements, alternative implementations, or refactoring opportunities, present them as options to the user.
- Implement such improvements only after explicit user approval.
- If multiple valid implementation paths exist, briefly explain the trade-offs and ask the user to choose when the choice affects architecture, API, behavior, or maintenance.

## Project stack
- React 18
- TypeScript
- Vite
- Wouter
- Zustand
- Tailwind CSS
- `@ton/ton`
- `@ton/crypto`
- `argon2-browser`
- Web Crypto API
- `zxcvbn-ts`
- `qrcode.react`

## Architecture rules
- Follow the existing project structure and place code in the proper layer:
  - `screens/`, `components/`, `hooks/`
  - `store/`
  - `services/`
  - `crypto/`
- Keep business logic out of React components whenever it can live in `services/`, `hooks/`, or `store/`.
- Keep TON-specific logic inside `services/ton/` and `services/wallet/`.
- Keep encryption, vault, KDF, and secret-handling logic inside `crypto/` and related service layers.
- Follow the existing validation pipeline approach in `services/validation/`.
- Keep Zustand stores small, predictable, and free from duplicated sources of truth.
- Reuse existing utilities, types, services, and patterns before adding new ones.
- Follow existing naming, file organization, import style, and decomposition patterns already present in the codebase.

## Code quality rules
- Write strictly typed TypeScript wherever possible.
- Avoid `any` unless there is no reasonable alternative.
- Prefer precise types, discriminated unions, generics, type guards, and explicit return types where useful.
- Do not weaken typing for convenience.
- Write small, deterministic, readable functions.
- Handle errors and edge cases explicitly.
- Handle `null` / `undefined` safely and intentionally.
- Do not duplicate logic when a suitable existing implementation already exists.
- Do not add new dependencies unless truly necessary and approved when the choice is non-trivial.
- Do not introduce speculative abstractions “for the future”.
- Keep solutions simple, local, and maintainable.

## Security rules
- Default to secure behavior.
- Never log or expose mnemonic phrases, seed phrases, private keys, passwords, derived keys, or any other secrets.
- Be especially careful with wallet import/export, encryption, KDF, vault storage, and secret lifecycle.
- Do not simplify or bypass cryptographic or validation logic unless explicitly requested and approved.
- Minimize secret exposure in memory and code paths whenever possible within the project’s existing architecture.

## Testing rules
- Always account for existing tests and preserve their passing behavior.
- If existing tests fail after changes, fix the code first rather than modifying tests.
- Modify old tests only when they are clearly incorrect, outdated, or incompatible with the explicitly requested behavior.
- For every new feature or bug fix, add new unit tests.
- Tests should validate externally observable behavior and important edge cases, not internal implementation details.
- Do not remove meaningful test coverage without a strong reason.
- Keep tests aligned with the project’s current conventions and patterns.

## UI and product behavior
- Do not break existing user flows.
- Follow the existing React + Tailwind style and component patterns.
- Keep components simple and focused on presentation and interaction.
- Do not change copy, labels, routes, or screen behavior unless explicitly requested.

## Output format
- Start with a short plan.
- If there is ambiguity, stop and ask questions first.
- Then present the changes grouped by file.
- Include new or updated tests.
- End with a short checklist of what to verify or run.
- Explicitly mention assumptions, risks, limitations, or follow-up items when relevant.
- Do not add unnecessary theory unless requested.

## Decision priorities
1. Correctness
2. Security
3. Adherence to project architecture
4. Passing existing tests
5. Simplicity and predictability
6. Performance

## Main rule
Only implement agreed changes.  
Whenever questions, ambiguities, improvement ideas, inconsistencies in code, or documentation issues appear, ask the user first, propose options, and proceed only after explicit approval.