# Plan

Four focused workstreams. I'll implement them in this order.

## 1. Render Surah Dialog cleanup
- Remove the `Container` wrapper from the sidebar inside the Render Surah dialog and from the preview area — render them as plain divs (no rounded card, no border, no padding box).
- Replace every "Al-Deen.org" string with "Al-Din.org" in the dialog and the exported video overlays.
- Remove the background/pill behind the "Al-Din.org" watermark text (preview and export).

## 2. Render & Download fix
Current failure: canvas frame capture errors ("image argument is a canvas with width or height of 0"), so the render loop never completes and the download never fires.

Fix:
- Guard the DOM-to-image capture: wait for the preview node to have non-zero `getBoundingClientRect()` before starting; if 0, force a layout pass and retry up to N times, then abort with a toast instead of looping.
- Use `html-to-image`'s `toCanvas` with explicit `width`/`height`/`pixelRatio` derived from the preview node's measured size (fall back to the configured export resolution).
- After the MediaRecorder stops, build the Blob, trigger the browser download, AND show an inline result panel in the dialog with: video `<video controls>` preview, file size, duration, and a "Download again" button. Keep the blob URL alive until the dialog closes.
- Replace the indefinite "Rendering…" spinner with a real progress bar (frames captured / total frames) and a Cancel button.

## 3. Group 6 — Real payments with 3-way gate
Flow: user clicks **Donate** on `/Donate` → a modal opens with three choices: **Stripe**, **PayPal**, **Other (Custom)**. Picking one routes to that provider's checkout.

- Remove the preset amount pills (10/25/50/100/250) — already requested earlier in item 6.
- **Stripe**: enable Lovable's built-in Stripe payments (`enable_stripe_payments`). Create a single dynamic-amount checkout via an edge function `create-stripe-checkout` that accepts `{ amount, currency, type, frequency }` and returns a Checkout URL (one-time or recurring via `mode: subscription` with an inline price). Open in new tab; on return show a thank-you state.
- **PayPal**: use the PayPal JS SDK (`@paypal/react-paypal-js`) with `VITE_PAYPAL_CLIENT_ID` (publishable). One-time uses `createOrder`/`onApprove`; recurring uses Subscriptions API (requires a plan — for v1 we'll do one-time only for PayPal and show a notice that recurring PayPal is coming).
- **Other (Custom)**: a simple form showing manual transfer details (bank / crypto address / etc.) editable by the project owner — for now a static info card with copy-to-clipboard fields, sourced from a `CUSTOM_DONATION_DETAILS` constant the user can edit.

Provider eligibility: I'll run `recommend_payment_provider` first to pick the right Stripe path (managed payments vs automatic tax) for a donation/non-profit-style use case.

## 4. PWA offline fix
Current `vite.config.ts` already uses `vite-plugin-pwa` with runtime caches for Quran JSON, fonts, audio, prayer-times API. Gaps causing "doesn't work offline":
- `globPatterns` excludes the route HTML chunks; navigation requests aren't precached → on offline reload the SW serves nothing and the page is blank.
- No `navigateFallback` to `index.html` for SPA routes.
- No explicit registration wrapper following Lovable's preview guard, so SW behaves inconsistently in preview vs production.
- Hadith/Aid/Tajweed JSON files under `Layer/Bottom/Data/...` are matched, but image assets and the OpenStreetMap/Aladhan map tiles aren't.

Fix:
- Add `navigateFallback: '/index.html'` + `navigateFallbackDenylist` for `/api`, `/~oauth`, `/Aid/Hijri-Calendar` (external API only).
- Add a precache entry for `index.html` and all hashed JS/CSS (already covered by `globPatterns` — verify and extend).
- Add runtime caches:
  - Hadith data (`/Layer/Bottom/Data/Hadith/**/*.json`) → CacheFirst.
  - App icons / static images (`/Layer/Top/Asset/**`) → CacheFirst.
  - All same-origin navigations → NetworkFirst with cache fallback.
- Add a guarded registration wrapper at `Layer/Middle/Center/registerSW.ts` per the Lovable PWA skill (skip iframe / preview hosts / `?sw=off`) and import it from `main.tsx`. Set `injectRegister: null` in the plugin.
- Show a small "You're offline — using cached content" toast when `navigator.onLine === false`.
- Document that the Hijri calendar, Prayer-times first-load, Qibla (geolocation), and AI Assistant require connectivity; everything else (Quran reading, Hadith, Dua, Tajweed, Names, Pillars, Articles) works offline after first visit.

## Order of execution
1. Render dialog cleanup + Render & Download fix (small, immediate user value)
2. PWA offline fix (config + wrapper)
3. Group 6 payments (enable Stripe, build 3-way modal, wire PayPal SDK, custom card)

## Notes for the user
- Enabling Stripe payments requires a **Pro plan** and **Lovable Cloud**. I'll prompt you to confirm before calling the enable tool.
- For PayPal you'll need to paste your PayPal **Client ID** (publishable) as `VITE_PAYPAL_CLIENT_ID`. I'll ask after the modal is wired.
- "Other (Custom)" details (bank IBAN, crypto address, etc.) — please tell me what to display, or I'll scaffold placeholder fields you can edit.
