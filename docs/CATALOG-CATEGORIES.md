# Storefront catalogue: why 489 products didn't show, and how it was fixed

Two separate bugs made the storefront look broken:

1. **The listing only ever loaded 24 products.**
2. **Category filtering returned zero products for every category.**

Both are fixed. This document explains the causes, what changed, and how to
re-run or undo it.

---

## 1. Only 24 of 489 products appeared

`GET /api/products` is paginated: **default `limit` is 24, and the server caps
`limit` at 100** (asking for 500 still returns 100). It reports the real total in
`meta`:

```json
{ "success": true, "data": [ …24 items… ], "meta": { "page": 1, "limit": 24, "total": 487, "pages": 21 } }
```

`ProductListingPage` called `fetch('/api/products')` **once, with no params**.
Every filter below it then ran in the browser over those 24 items — which is why
the counter said "24 products", why search felt broken, and why the category
tabs emptied the grid.

The same single-call pattern was in four other places:

| Screen | Symptom |
|---|---|
| `/products` listing | 24 of 487 products |
| Admin → Products | only the first 24 products in the manager |
| Account → wishlist | wishlist items past #24 never appeared |
| Homepage carousels | every carousel showed the same first 24 items |

### Fix

`src/utils/catalogApi.ts` — `fetchAllProducts()` walks every page (100 at a
time, in parallel) and de-duplicates by id. Page count comes from an
`x-catalog-pages` header that the API wrapper now emits, because the wrapper
unwraps the `{success, data, meta}` envelope and `meta` cannot ride along on a
plain array.

The listing renders **24 cards at a time with a "Load more" button**, so a
473-product catalogue does not paint 473 cards (and ~45 MB of images) at once.

---

## 2. Category filtering returned nothing

`GET /api/categories` reads Odoo's **website** category model
(`product.public.category`), not the internal `product.category`. That table
held **two demo records** ("Test", "Specialty Coffee") and only **2 products**
were linked to them. Every other product had `public_categ_ids = []`, so:

- the storefront showed 2 tabs (one of them called "Test"),
- `product.categories` was `[]` for 485 products → `category_slug` was
  `undefined` → `p.category_slug === selectedCategory` matched nothing,
- the server-side filter `?category=cups` also returned 0, because no public
  category with that slug existed.

This is a data problem, not a rendering one. The addon is not in this repo, so
the fix is to populate the data it reads.

### Fix — `scripts/seed-catalog-categories.mjs`

Creates the real public category tree and links every sellable product to it,
in one batched write per category.

| slug | English | Arabic | products |
|---|---|---|---|
| `roasted-coffee` | Roasted Coffee | قهوة محمصة | 42 |
| `green-beans` | Green Beans | بن أخضر | 48 |
| `espresso-machines` | Espresso Machines | ماكينات ومعدات | 38 |
| `brewing-tools` | Brewing Tools | أدوات التحضير | 137 |
| `cups` | Cups & Glassware | أكواب وكاسات | 40 |
| `spare-parts` | Spare Parts & Accessories | قطع غيار وملحقات | 46 |
| `drinks` | Drinks | مشروبات | 52 |
| `desserts` | Desserts & Food | حلويات وأطعمة | 16 |
| `merchandise` | Merchandise | منتجات المتجر | 2 |
| `packaging` | Packaging | تغليف | 18 |
| `services` | Services | خدمات | 32 |

**473 products total**, 11 categories, 0 orphans.

The internal `product.category` is authoritative — otherwise every Ethiopian lot
filed under "Green Beans" would be re-labelled "Roasted Coffee" by the origin
keyword. Two exceptions fall back to the name classifier instead:

- **non-merchandise buckets** (`Expenses`, `Shipping`, `Deliveries`,
  `Booking Fees`, `Events`) also contain real merchandise filed in the wrong
  place — the Cafetto descalers live under `All / Expenses`;
- **`Merchandize`** is too coarse (branded cups sit next to cloths and badges).

Usage:

```bash
node scripts/seed-catalog-categories.mjs                       # report only
node scripts/seed-catalog-categories.mjs --verbose             # every assignment
node scripts/seed-catalog-categories.mjs --apply               # write to Odoo
node scripts/seed-catalog-categories.mjs --apply --prune-legacy --archive-junk
```

It writes `catalog-classification.csv` (id, name, odoo category, public
category) for review before applying.

### Demo records removed

`--archive-junk` archived 13 non-products (`Test categ_id`, `Test
website_categ_ids`, `check`, `checup`, `test`, `Doc Example Product`,
`INV-2025/012546`, `Account Difference Correction`, `Probe Price Product`,
`ييييييي`, …). Archiving sets `active = false` — reversible, and order history
keeps them.

The two demo categories ("Test", "Specialty Coffee") were deleted once empty.

---

## 3. Other bugs found while fixing this

| Where | Bug | Fix |
|---|---|---|
| `ProductDetailPage` | `?category_slug=` — not a real parameter, silently ignored, so "related products" were the first 12 of the whole catalogue | use `?category=` |
| `ProductCarouselSection` | `?is_new=true` / `?is_featured=true` — ignored; every carousel rendered the same list | use `?flag=new` / `?flag=featured` / `?flag=bestseller` |
| Listing price slider | hardcoded `min=30 max=1000`; anything above 1000 was unreachable once the slider was touched | bounds computed from the catalogue (currently 1–100) |
| Listing filter | ad-hoc name-based filter (`down payment`, `discount`, `gift card`, …) could hide real products | removed — `catalogPolicy` already handles internal products at the API boundary |
| `ProductCard` | Latin names rendered reversed inside the RTL layout (`OZ Paper cups 12`) | `dir="auto"` on the title |
| `vite.config.ts` | dev proxy target was `VITE_API_BASE_URL`, which carried a `/odoo` suffix → every `/api/*` call 404'd in local dev | proxy target normalised to the URL **origin** |
| `.env` | `VITE_API_BASE_URL=.../odoo` | corrected to the origin |

### Note on `?search=`

The backend only understands `?q=`. `?search=` is **aliased** to `?q=` by the
API wrapper (`src/utils/externalApi.ts`), so legacy callers keep working —
verified in `tests/verify-catalog-pipeline.mjs`.

---

## 4. Verification

```bash
node tests/verify-catalog-pipeline.mjs   # 15/15 — data + API contract, in Node
node tests/verify-listing-ui.mjs         # 12/12 — real browser, real clicks
node tests/verify-catalog-policy.mjs     # 25/25 — internal-product exclusion
npx tsc --noEmit && npx vite build
```

`verify-listing-ui.mjs` drives a headless Chromium against the Vite dev server
(`http://[::1]:5199`) and asserts what a user sees:

```
counter: "عرض 24 من 473 منتج"
✓ the page knows about the full catalogue (473)
✓ first batch is capped for performance (24)
✓ category tabs show real counts
after "Brewing Tools": "عرض 24 من 137 منتج"
✓ category filter returns products (was 0 before)
✓ load more appends cards
after search "grinder": "عرض 18 من 18 منتج"
✓ search narrows the grid
✓ price filter narrows the catalogue
```

It needs Playwright, which is not a project dependency:

```bash
npm i --no-save playwright && npx playwright install chromium
```

---

## 5. Known data issues (not fixed here)

- **Prices are placeholders.** `La Marzocco GS3 AV` is listed at **1.00 SAR**,
  most beans at 65.00, cups at 100.00. The whole catalogue spans 1–100 SAR,
  which is not real pricing. This is why the price slider looks odd — it is
  faithfully reflecting the data. Fix the prices in Odoo before launch.
- **11 categories, but only 2 merchandise items** — `merchandise` is thin
  because most branded cups were filed under `Merchandize` and correctly
  classified as `cups`.
- **2 products are uncategorised** (`NCD Black`, `power`) — no rule matched and
  guessing would be worse than leaving them in "All" only.
