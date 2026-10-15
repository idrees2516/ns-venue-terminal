# NS·VENUE — 0DTE Options Trading Terminal

Professional, dark-mode trading terminal for the **ns-venue** 0DTE options
matching engine. Built as a standalone Next.js 16 application — the backend
lives in its own repository ([perp-options-clob](https://github.com/idrees2516/perp-options-clob),
`feat/0dte-ns-clob-platform` branch).

## What's inside

A **sidebar-driven terminal** where every functionality has its own dedicated
section — nothing is crammed into a single screen:

| Section | Route | What it does |
| --- | --- | --- |
| **Dashboard** | `/dashboard` | Live stat cards (mark, next expiry countdown, orders, positions, available funds), ATM chain glance, focused tape, account summary |
| **Order Book** | `/orderbook` | The depth focus page — large two-sided ladder with per-level **and** cumulative depth bars, pinned spread row, big BBO header, full-height time & sales with tape stats (vol, hi/lo, pressure) |
| **Calls & Puts** | `/chain` | Full-width options chain — calls (bid ×size, ask ×size, mark, vol) · strike · puts (mirrored), expiry tabs with live countdowns + phase badges, ATM accent, one-click focus |
| **Execute** | `/execute` | Order ticket (limit / market+protection, GTC/IOC/FOK, post-only, reduce-only, exact integer premium estimate) with top-of-book and the live session fill blotter beside it |
| **Open Orders** | `/orders` | Every working order — full attribute table, per-row cancel, cancel-all |
| **Positions** | `/positions` | Signed positions with live client-side intrinsic, margin, delta notional, totals row + per-underlying balance cards |
| **Fills** | `/fills` | Session execution blotter — maker rebates / taker fees, signed premium, integer-exact aggregates |
| **0DTE Sessions** | `/sessions` | The hourly session lifecycle — countdown cards (phase, strike count, call/put volume pressure) + per-instrument table |
| **Admin Console** | `/admin` | *admin scope only* — account funding, session listing, oracle marks, halts, key minting |
| **Venue Health** | `/health` | *admin scope only* — per-shard engine metrics, TPS, queue depth, journal bytes, state hash, conservation badges |

The sidebar collapses to an icon rail (state persisted), becomes a drawer on
mobile, and admin entries appear only for admin-scope keys. Every section
shares one live wiring — **navigating never drops the WebSocket**, the
instrument focus or the ticket draft.

## Design

- Deep-space dark theme, glass panels with hairline borders, electric-teal
  accent, mint/rose direction colors, mono tabular numerics everywhere
- Inter + JetBrains Mono, `prefers-reduced-motion` respected
- Layout engineered for laptop screens (1280–1920px): the order book and chain
  fill the viewport, scrollable sections cap at a composed max width
- Responsive down to mobile (drawer navigation, stacked panels)

## Signing in

The terminal talks to the venue exactly like production tooling: every REST
request is **HMAC-SHA-256 signed** (`key_id|timestamp|nonce|METHOD|path|body_hash`),
nonces are strictly-increasing per key, the WebSocket authenticates via query
signature, and the secret lives only in the tab's `sessionStorage` — never
logged, never rendered.

Sign in with a venue-issued API key (8-hex id + 64-hex secret), or use the
built-in **dormant demo access** cards when running against the sandbox venue
(see `src/lib/dormant.ts` — remove that module and its cards in production).

## Running it

```bash
bun install        # or npm/pnpm/yarn install
cp .env.example .env.local   # point at your ns-venue
bun run dev        # http://localhost:3000
```

Transport modes (`src/lib/api.ts`):

- `NEXT_PUBLIC_VENUE_URL` set → direct absolute requests to the venue
- unset → **gateway mode**: same-origin requests carry `XTransformPort` for
  reverse proxies that route by query parameter (the signature covers the full
  request target, so it verifies end-to-end)

## Engineering notes

- **Integer-exact money math everywhere** — prices are integer ticks
  (1 tick = 0.01); premium and intrinsic computed with BigInt-safe helpers,
  never float multiplication
- Store subscription model: per-section version counters +
  `useSyncExternalStore` — a depth/trade burst only re-renders the panels that
  consume it (no external state library)
- Every panel sits behind its own error boundary; one bad frame can never
  kill the terminal
- All numeric input parsing is string-based and exact (no `parseFloat`)
- Client-side validation mirrors the engine's (qty 1..=10000, integer ticks,
  market orders forced to IOC with protection price)

## Stack

Next.js 16.3.4 (App Router) · React 19 · TypeScript 5.9 (strict) ·
Tailwind CSS 4 · lucide-react icons · zero other runtime dependencies.
