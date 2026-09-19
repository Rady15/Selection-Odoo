# Selection — Production Edition

## What was changed

### Backend
- Moved the API into `backend/`.
- Added isolated authentication, security middleware, rate limiting, audit logging and commerce pricing logic.
- Added `backend/database/` for the durable data repository and production database foundation.
- Added `backend/integrations/` for shipping/payment integrations.
- Added `backend/commerce/order.ts` so the server is the source of truth for product prices, variants, stock, discounts, loyalty, VAT and shipping.
- Added `/api/auth/me` and `/api/me`.
- Protected every `/api/admin/*` route with server-side JWT + admin authorization.
- Customer endpoints enforce ownership.
- Passwords use Node `scrypt`; API responses never expose passwords.
- Uploads are admin-only and limited to safe image MIME types.
- Added security headers, request limits and rate limiting.
- Added admin audit logging.
- Public tracking exposes only tracking/status information.

### Payments
- Stripe PaymentIntent amount is calculated from trusted server-side product data.
- Payment amount/currency is checked again before an order is created.
- Payment-confirmation and sandbox endpoints require authentication.
- Sandbox payments are disabled in production unless explicitly enabled.
- Failed/abandoned Stripe payments are not persisted as completed orders.

### UI / Brand
- Replaced the brown palette with the supplied logo's teal identity:
  - Deep: `#061719`
  - Brand: `#0E5257`
  - Secondary: `#2B7D82`
  - Accent: `#6CC6C9`
  - Highlight: `#9DE0E2`
- Added glass surfaces, brand mesh background, shimmer, reveal, float and pulse motion utilities.
- Improved focus states, scrollbar, selection and reduced-motion support.
- Updated product cards and navigation for smoother modern motion.
- Replaced the previous blank/white logo asset with the supplied brand mark.

### Deployment
- Added `Dockerfile`.
- Added `docker-compose.production.yml` with PostgreSQL 17 and persistent uploads.
- Production refuses to start without `JWT_SECRET`, `DATABASE_URL` and `ADMIN_PASSWORD`.
- `.env` and `.env.bak` were removed from the deliverable.
- `.env.example` contains the production configuration template.

## Production setup

1. Copy `.env.example` to `.env`.
2. Generate a strong `JWT_SECRET`.
3. Set a unique `ADMIN_PASSWORD`.
4. Set `DATABASE_URL`.
5. Configure Stripe live keys and webhook secret.
6. Configure the real SMSA adapter/credentials before enabling shipment creation.
7. Run:

```bash
npm ci
npm run build
npm start
```

Or deploy with:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

## Verification note

The uploaded archive contained an incomplete/root-owned `node_modules` tree. The source was syntax-checked successfully, but a clean dependency installation/build could not be completed inside the inspection environment because the package registry operation timed out. The production image intentionally does **not** include `node_modules`; Docker performs a clean `npm ci` during its build.

## Important
Rotate any credentials that were present in the original archive before production deployment. Never reuse the old Stripe/database/JWT credentials.
