# Selection Specialty Coffee — External Odoo API Edition

This edition is frontend-only. The bundled Node/Express backend, local database, migrations and local API server have been removed.

## External API
The storefront talks directly to the Odoo Selection Store API documented in `POSTMAN_API_GUIDE.pdf`.

Default API base URL:
`https://oktech24-coffee-selection-usa-staging-37526933.dev.odoo.com`

Override it with `VITE_API_BASE_URL` when building another environment.

## Run
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

## Authentication
Bearer tokens returned by `/api/auth/login`, `/api/auth/register`, and `/api/auth/google` are stored in browser localStorage and automatically sent to protected Odoo endpoints.

## Important API limitations
The supplied Postman guide documents the available Odoo endpoints. The frontend therefore uses those documented routes for catalog, authentication, addresses, cart/checkout, orders, reviews, questions, coupons, loyalty, homepage, admin products/categories/orders/reviews/coupons/settings, payment gateways, shipping providers and reports.

Some legacy UI modules referenced endpoints that are not present in the supplied guide (for example image upload, admin banner/announcement CRUD, customer-list CRUD, and quiz CRUD). Those local-server endpoints are no longer implemented; they must be added to the Odoo addon if those screens are required.

## CORS
Because the browser now calls Odoo directly, the deployed storefront origin must be present in the Odoo Selection Store CORS allowlist. The guide explicitly notes that browser origins must match the configured allowlist.
