# Product images

## Current state

| | |
|---|---|
| Sellable products (`sale_ok` + `active`) | **489** |
| Products with an image | **489** |
| Through the public API | **486 / 486** |

Every product now renders a real photo. The images are **generated category
imagery**, not photographs of the specific SKU — see *Why not the internet*
below for why that was the only defensible option.

## Why the admin "Add images" button never worked

The SPA is a static build: `vercel.json` rewrites `/api/:path*` straight to
Odoo, so the browser has no backend of its own. That made three things true:

| Path | Reality |
|---|---|
| `POST /api/upload` (called by the uploaders) | **404** — never existed on the addon |
| `PUT /api/products/{id}` with `image` / `images` / `image_1920` | **200 OK but persists nothing** |
| `POST /api/images/...` | **405** — read-only route |
| `GET /api/images/{model}/{uuid}` | works, serves the bytes |

The only writable path is Odoo's own JSON-RPC: `product.template.image_1920`.
Writing it immediately populates `image` on `GET /api/products/{uuid}`.

## Why not the internet

Wikimedia Commons was the only keyless source with machine-readable, commercial-
safe licensing (Openverse returned HTTP 500). Its free-text and category search
both turned out to be unusable for a product catalogue — Commons is a museum
archive, not a shop. Actual results from real runs:

| Product | What the "internet image" was |
|---|---|
| Timemore Coffee Server | a café exterior called "Temple" |
| Victoria Arduino Black Eagle | a book preface page |
| Timemore Coffee Scale | a model railway diorama |
| 26 Box / | vintage Betty Crocker packaging (third-party branding) |
| Category:Coffee pots | Norwegian cabin interiors |
| Category:Kitchen scales | 1900s antiques |
| Paper cups | a water tower shaped like a cup |

Sampled error rate ~10/10. Those images were written and then fully reverted —
a storefront full of wrong products, brand logos and QR codes is worse than no
photos at all.

## What was done instead

23 studio-style category images were generated (clean white background, soft
lighting, no text, no logos, no brand marks) and mapped onto every product by
name, falling back to category:

`beans-roasted` · `beans-green` · `grinder` · `espresso-machine` · `cup-ceramic`
· `cup-paper` · `cup-plastic` · `glass` · `milk-pitcher` · `scale` · `kettle` ·
`dripper` · `tamper` · `portafilter` · `water-filter` · `carafe` · `packaging` ·
`dessert` · `sandwich` · `syrup` · `tea` · `apron` · `brush`

Sources live in `catalog-images/` (1.5 MB, JPEG, 1000×1000). They are **not** in
`public/`, so they don't ship in the frontend bundle — they only seed Odoo.

```bash
node scripts/apply-catalog-images.mjs              # dry run + distribution table
node scripts/apply-catalog-images.mjs --apply
node scripts/apply-catalog-images.mjs --apply --only Cups
```

## Replacing them with real photography

The mapping is a seed, not a destination. When real photos exist:

```bash
# put photos in ./product-images, named after the SKU or product name
node scripts/import-product-images.mjs --dir ./product-images              # preview
node scripts/import-product-images.mjs --dir ./product-images --apply --overwrite
```

`--overwrite` is required because every product currently has an image. Matching
is SKU → exact name → token overlap (≥0.72, must beat the runner-up) and never
guesses; anything uncertain is listed with its candidates for a manual manifest
(`--write-manifest` emits a 489-row CSV).

## Reverting

```bash
node scripts/revert-imported-images.mjs --all --keep 2423 --apply
```

Clears `image_1920` everywhere except `[2423] Nisnas`, the one product that has
genuine photography. That restores the true baseline (1 image).

## Admin panel upload (fixed)

`POST /api/product-image` authenticates the admin JWT (`is_admin`) and writes
`image_1920` via RPC with server-side credentials.

| File | Role |
|---|---|
| `server/productImage.js` | shared logic: JWT check, RPC auth, UUID → record, write |
| `api/product-image.js` | Vercel serverless function (production) |
| `vite.config.ts` | dev middleware, `enforce: 'pre'` so it wins over the `/api` proxy |
| `src/components/admin/ImageGalleryUploader.tsx` | downscales to 1600 px / JPEG 0.85, uploads, shows pending state |

Editing an existing product uploads immediately; creating a new one holds the
file as a `data:` URL and commits it once the product has an id.

Set `ODOO_LOGIN` / `ODOO_PASSWORD` in the deployment environment. Without them
the route returns `503 not_configured` instead of failing silently. Local dev
falls back to the staging admin account.

```bash
npx vite --port 5199
node tests/verify-product-image-route.mjs    # 14 assertions
```

## Frontend changes

- `loading="lazy"` + `decoding="async"` on every product image — a 100-card grid
  would otherwise pull ~10 MB up front.
- Missing images fall back to `/brand-mark.png` instead of `<img src="">`, which
  rendered a broken box and left the card spinner running forever.

## Still open

- `ImageUploader.tsx` (categories, banners, announcements) still posts to the
  dead `/api/upload`. Same root cause, different feature.
- Generated imagery is representative, not accurate. Only real photography fixes
  that — the importer is ready for it.
- Local `.env` points `VITE_API_BASE_URL` at `.../odoo`, which would make the dev
  proxy forward `/api/*` to `.../odoo/api/*`. Worth correcting.
