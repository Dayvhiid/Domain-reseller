# Domain Reseller Platform — Frontend

Production-quality, responsive, white-label domain reseller frontend built with **HTML5 + Tailwind CSS + Vanilla JS** — no frameworks. WordPress-ready by design.

## Quick Start

No build required for preview — Tailwind is loaded via CDN.

```bash
# just open in browser
open index.html
# or serve locally
npx serve .
# or python
python -m http.server 8000
```

### Production Tailwind build (optional)

```bash
npm install
npm run build   # css/output.css (minified)
npm run dev     # watch
```

Point pages to `css/output.css` and remove the CDN script when building for production/WordPress.

## Pages

- `index.html` — Home / hero + TLD cards + why/how/trust/FAQ
- `domains.html` — Browse TLD categories
- `search-results.html?domain=example.com` — Mock availability, term selector, cart add
- `pricing.html` — Searchable/filterable pricing table (transparent renewal)
- `transfer-domain.html` — EPP validation (mock)
- `whois.html` — WHOIS lookup (mock, privacy-aware)
- `cart.html` — localStorage cart, term updates
- `checkout.html` — Mock checkout, no real card data
- `login.html` / `register.html` — Frontend validation only
- `support.html` / `faq.html` / `about.html` / `contact.html`
- `client-dashboard.html` — Mock overview + renewals
- `domain-details.html` — Tabs: Overview/DNS/Nameservers/Contact/Renewal/Transfer
- `billing.html` — Invoices (mock)
- `legal/terms.html`, `legal/privacy.html`, `legal/refund-policy.html`

## Design System

- Light background, dark text, generous whitespace, minimal animation
- Brand colors via CSS variables: `--color-primary` / `--color-primary-hover` (`css/input.css` + `tailwind.config.js`)
- Reusable classes: `.card`, `.btn-*`, `.input`, `.badge-*`
- Mobile-first, hamburger nav, focus-visible rings, semantic HTML, one H1 per page

## Mock API Layer

All backend-dependent UI talks to `js/mock-data.js` (`MockAPI.searchDomain`, `getPricing`, `whoisLookup`).
Swap internals to `fetch('/wp-json/domain-platform/v1/...')` later — UI unchanged.
Cart is `js/cart.js` (localStorage key `dr_cart_v1`). See `docs/API-INTEGRATION.md`.

## WordPress Conversion

See `docs/WORDPRESS-CONVERSION.md`:
- Theme = presentation only; plugin = registrar/billing logic; no secrets in theme.
- `header`/`footer` → `header.php`/`footer.php`, `index.html` → `front-page.php`, pages → page templates, shared sections → `template-parts/`, `wp_nav_menu`, Gutenberg for marketing copy.

## Accessibility & Performance

- Labels, `aria-expanded` on accordion/mobile menu, keyboard nav, visible focus
- System font (Inter), debounced search, localStorage caching boundaries documented

## Security Boundaries

No registrar credentials, payment secrets, or private keys in frontend. Validation is client-side only — real checks server-side. Documented in `docs/API-INTEGRATION.md`.

## Structure

```
/
├── index.html, domains.html, search-results.html, pricing.html, ...
├── legal/
├── css/input.css  (+ output.css after build)
├── js/mock-data.js, navigation.js, domain-search.js, cart.js, ui.js, main.js
├── assets/images, icons, fonts
└── docs/WORDPRESS-CONVERSION.md, API-INTEGRATION.md
```
"# Domain-reseller" 
