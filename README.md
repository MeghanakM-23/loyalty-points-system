# Loyalty+ Rewards Platform

A customer loyalty points management system with tier tracking, spend-based point calculation, bonus awards, and redemption — built as a responsive React SPA.

---

## ✨ Features

- **Points Calculation** — Earn 10 points per $1 spent, with live preview before confirming
- **Bonus Points** — 5 bonus types: Birthday (3×), Double Points Day (2×), Referral (+500), Milestone (+1000), Welcome (+250)
- **Customer Management** — Add unlimited customers; data persisted in `localStorage`
- **Tier System** — 4 tiers: Bronze → Silver → Gold → Platinum with animated progress ring
- **Redemption** — Convert points to credit ($1 per 100 pts), minimum 100 pts
- **Transaction History** — Full log of purchases, bonuses, and redemptions (last 50 per customer)
- **Validation** — Amount bounds, duplicate name prevention, minimum redemption guards
- **Notifications** — Toast feedback on every action

---

## 🛠 Technology Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Framework    | React 18 (functional + hooks)     |
| Styling      | Inline CSS + CSS-in-JS (no deps)  |
| Fonts        | Google Fonts — Playfair Display, Inter |
| Persistence  | Browser `localStorage`            |
| Build target | Single `.jsx` file (Claude Artifact / Vite/CRA drop-in) |

No external UI libraries, no backend required.

---

## 🚀 Setup & Run Instructions

### Option A — Claude Artifact (fastest)
1. Copy the contents of `loyalty-app.jsx`
2. Paste into a Claude.ai Artifact panel (React mode)
3. The app runs immediately in the preview pane

### Option B — Vite + React (local dev)

```bash
# 1. Create a new Vite project
npm create vite@latest loyalty-app -- --template react
cd loyalty-app

# 2. Replace src/App.jsx with loyalty-app.jsx contents
cp /path/to/loyalty-app.jsx src/App.jsx

# 3. Install and run
npm install
npm run dev
```

Open `http://localhost:5173` — no environment variables needed.

### Option C — Create React App

```bash
npx create-react-app loyalty-app
cd loyalty-app
# Replace src/App.js with the contents of loyalty-app.jsx
npm start
```

---

## 📐 Assumptions

| Decision | Rationale |
|---|---|
| **10 pts / $1** | Common loyalty rate; configurable via `SPEND_RATE` constant |
| **100 pts = $1** | Industry-standard redemption ratio |
| **Minimum 100 pts to redeem** | Prevents trivially small redemptions |
| **Max $100,000 per transaction** | Reasonable upper bound; adjustable |
| **Multiplier bonuses apply to last recorded purchase** | If no purchase exists, a base of 100 pts is used |
| **localStorage for persistence** | No backend required; survives page refresh |
| **50 transactions per customer** | Caps memory usage in long-running sessions |
| **3 sample customers pre-loaded** | Demonstrates the system immediately without setup |

---

## 🤖 AI-Assisted Development Note

This project was built using **Claude (Anthropic)** as the primary development tool, in a "vibe coding" workflow where I described what I wanted and iterated on the output.

Claude helped me rapidly scaffold the full feature set — tier logic, form validation, animated SVG progress ring, localStorage persistence, toast notifications, and a multi-tab layout — in a single session. What would normally take a day of UI plumbing was compressed into a focused exchange: I described the data model and UX I had in mind, Claude proposed the architecture, and I refined edge cases like bonus multiplier behaviour and redemption guards in follow-up prompts. The most useful pattern was asking Claude to *explain its assumptions* alongside the code, which surfaced decisions (like the base-100 fallback for multiplier bonuses) that I could then consciously accept or override.

The main challenge was keeping the single-file constraint while maintaining readability. Claude naturally wanted to split components into separate files, so I had to steer it back to a self-contained JSX file suitable for the Artifact format. The final result required minimal manual editing — mostly naming tweaks and one validation rule change — which is a strong indicator of how effectively AI tooling can accelerate frontend development when the developer stays engaged as a reviewer rather than a passive consumer.
