# Design System Document: High-Utility Crypto Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Precise Architect"**

This design system moves away from the "toy-like" aesthetics of consumer fintech. Instead, it adopts the persona of a high-end terminal—a tool for power users and developers that prioritizes data integrity over decoration. We achieve a premium feel through **intentional asymmetry**, **tonal depth**, and **monospaced precision**.

The layout is a disciplined 480px centered column. By rejecting standard "boxed" layouts in favor of raw typography and layered surfaces, we create a digital environment that feels like a custom-engineered instrument rather than a generic mobile app.

---

## 2. Colors: Tonal Architecture
The palette is rooted in deep obsidian tones, using the primary blue specifically for interactive intent and the amber warning color as a constant "Testnet" environmental anchor.

### The "No-Line" Rule
**Borders are forbidden for sectioning.** To define structure, you must use shifts in background tokens. 
- Use `surface_container_low` for the main background.
- Use `surface_container` or `surface_container_high` to lift interactive modules.
- Separation is achieved through **negative space** (see Spacing Scale) or a single step-shift in the surface hierarchy.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical planes.
*   **Base:** `background` (#111317)
*   **Deepest Inset:** `surface_container_lowest` (#0C0E11) - Use for code blocks or "view-only" transaction logs.
*   **Default Container:** `surface_container` (#1E2023) - The primary canvas for wallet cards.
*   **Elevated State:** `surface_container_highest` (#333538) - Reserved for active focus states or floating context menus.

### Signature Textures
To soften the high-contrast developer aesthetic, use a **20% opacity linear gradient** on Primary CTAs: transitioning from `primary` (#a0caff) at the top-left to `primary_container` (#4f94dd) at the bottom-right. This adds a subtle "machined" sheen to the buttons.

---

## 3. Typography: The Editorial Scale
We use a system sans-serif stack (Inter/San Francisco) but treat it with the rhythm of a printed technical journal.

*   **Display (Large/Medium):** Reserved exclusively for balances. Use `letterSpacing: -0.02em` to give it a "dense" premium feel.
*   **Title (Small):** Use for section headers. Always pair with `text-transform: uppercase` and `letterSpacing: 0.05em` to act as an authoritative label.
*   **Body (Medium/Small):** Your primary workhorse. For TON addresses, utilize the `label-md` token but force a monospaced font-variant to highlight security-critical characters.
*   **Label (Small):** Used for the "Testnet" status. This should be high-contrast amber (`tertiary_fixed`) against the dark background to ensure the environment state is never forgotten.

---

## 4. Elevation & Depth
In this system, depth is a function of light, not lines.

### The Layering Principle
Rather than shadows, stack your surfaces:
1.  **Level 0:** `background`
2.  **Level 1:** `surface_container_low` (The Main App "Sheet")
3.  **Level 2:** `surface_container_highest` (Interactive Cards)

### Ambient Shadows
For floating modals (12px radius), use a highly diffused "Ambient Glow":
`box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);`
The "Ghost Border" (a 5% white outline) is the only exception to the No-Line rule, used only to define the edge of a floating modal against the dark background.

### Glassmorphism
For the navigation bar or fixed "Send/Receive" footers, use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`. This ensures the developer-oriented "data stream" of the wallet is visible as it scrolls beneath the controls.

---

## 5. Components

### The Mandatory Testnet Badge
*   **Style:** `tertiary_container` background with `on_tertiary_fixed_variant` text.
*   **Geometry:** 4px (xs) radius.
*   **Positioning:** Fixed top-right or anchored to the primary balance to maintain constant environmental awareness.

### Buttons
*   **Primary:** `primary_fixed_dim` background. 8px radius. Text must be `on_primary_fixed` (Deepest Navy) for maximum legibility.
*   **Secondary/Ghost:** No background. 1px "Ghost Border" (10% opacity `outline`). Use for "Cancel" or "View on Explorer."

### Data Inputs
*   **Address Input:** Use `surface_container_lowest`. On focus, transition the background to `surface_container_high`. 
*   **Security Highlighting:** Within the input, the middle of the TON address should be `on_surface_variant` (dimmed), while the first and last 4 characters remain `on_surface` (bright white) to assist in visual verification.

### Cards & Lists
*   **Constraint:** Zero dividers. 
*   **Execution:** Use `spacing-5` (1.1rem) of vertical white space between transaction items. If items need grouping, wrap the group in a `surface_container` with an 8px radius.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `spacing-1` and `spacing-2` for tight data-heavy groupings (like Gas Fees next to Label).
*   **Do** use `primary` sparingly. It is a "laser pointer" for the user's eye.
*   **Do** emphasize the "Testnet" nature of the wallet using the Amber `tertiary` tokens.

### Don't
*   **Don't** use pure black (#000000). It kills the "Editorial" depth. Use `surface_container_lowest`.
*   **Don't** use standard 1px borders to separate transactions. Use the spacing scale.
*   **Don't** use rounded corners larger than 12px. We want a "precise tool" aesthetic, not a "friendly social" one.