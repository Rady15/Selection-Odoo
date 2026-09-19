# Route Map & Architecture

## Storefront Routes
- `/`: Homepage with customizable section builder (Hero slider, Featured Crops, Coffee Finder Wizard, Boxes, Equipment, Video, Testimonials, Newsletter).
- `/products`: Full product listing with advanced filters (Category, Subcategory, Grind, Roast Level, Processing Method, Country of Origin, Price Range, In Stock) & Sorting.
- `/products/:slug`: Product Detail Page (Gallery, Flavor profile chart, Variant selection, Quantity, Add to Cart, Buy Now, Back-in-Stock request, Reviews & Q&A, Related Crops).
- `/categories`: All categories grid & mega-menu destinations.
- `/category/:slug`: Category-specific product listing.
- `/search`: Search results page with keyword highlighting and filters.
- `/cart`: Full cart review page with shipping estimator and discount breakdown.
- `/checkout`: Multi-step / single-page checkout (Shipping address, Delivery provider, Payment method, Coupon, Loyalty points, Order summary).
- `/order-confirmation/:orderNumber`: Instant receipt, order status, invoice download, and tracking link.
- `/account`: Customer account dashboard.
  - `/account/orders`: Order history & detailed tracking timeline.
  - `/account/orders/:orderNumber`: Single order detail & invoice.
  - `/account/addresses`: Saved delivery addresses.
  - `/account/loyalty`: Fursan Rewards points ledger & redemption rules.
  - `/account/wishlist`: Saved favorite crops & equipment.
  - `/account/back-in-stock`: Subscribed restock alert notifications.
  - `/account/settings`: Profile details & password reset.
- `/coffee-finder`: Interactive Coffee Quiz wizard.
- `/about`: Roastery story, sourcing ethics, and roasting philosophy.
- `/contact`: Contact form, store locations, customer support details.
- `/wholesale`: Business & Cafe wholesale inquiries form.
- `/terms`: Terms & Conditions.
- `/privacy`: Privacy Policy.
- `/shipping-policy`: Delivery & Shipping terms.
- `/return-policy`: Return & Refund policies.

## Protected Admin Routes (`/admin`)
- `/admin`: Dashboard Overview (KPIs, Sales chart, Recent Orders, Low Stock Alerts, Top Products).
- `/admin/products`: Product List, Create Product, Edit Product, Duplicate, Manage Variants & Stock.
- `/admin/categories`: Categories & Mega Menu hierarchy manager.
- `/admin/orders`: Orders list, Filter by status, Change status, Print Tax Invoice, Shipping Label, Add Tracking Number.
- `/admin/customers`: Customer profiles, Loyalty points adjustment, Address book, Order stats.
- `/admin/inventory`: Live stock levels, Variant inventory logs, Restock alert queue.
- `/admin/coupons`: Discount codes, Free shipping rules, Usage limits, Expiry control.
- `/admin/loyalty`: Loyalty program parameters, Earn rates, Manual points adjustment.
- `/admin/reviews`: Review moderation (Approve/Reject/Reply/Delete) and Q&A responses.
- `/admin/homepage`: Section Builder (Reorder, Edit slides, Banner configuration, Hero messaging).
- `/admin/navigation`: Header Mega Menu & Announcement Bar configuration.
- `/admin/content`: Pages manager (About, Legal, Wholesale submissions list, Contact submissions list).
- `/admin/settings`: Store settings (VAT, Currencies, Payment sandbox toggles, Shipping zones, Email/SMS notifications).
- `/admin/reports`: Export CSV reports for Sales, VAT Tax, Customer Growth, and Stock.

## API Endpoints (`/api/...`)
- `/api/auth/login`: Customer & Admin login.
- `/api/auth/register`: Customer account creation.
- `/api/auth/me`: Current session user info.
- `/api/auth/logout`: Session logout.
- `/api/products`: GET product list with query parameters, POST new product (Admin).
- `/api/products/:id`: GET single product by id/slug, PUT update product, DELETE product.
- `/api/categories`: GET categories tree, POST/PUT/DELETE categories.
- `/api/cart`: GET cart, POST sync cart items.
- `/api/checkout`: POST create order, validate coupon, process payment.
- `/api/orders`: GET orders (Customer / Admin), PUT update order status.
- `/api/orders/:id/invoice`: GET digital HTML/PDF printable tax invoice.
- `/api/coupons/validate`: POST validate coupon code against cart total & items.
- `/api/reviews`: GET reviews for product, POST submit review, PUT moderate review.
- `/api/questions`: GET questions for product, POST submit question, POST answer question.
- `/api/stock-notifications`: POST subscribe to back-in-stock alerts.
- `/api/loyalty`: GET customer points, POST redeem points.
- `/api/wholesale`: POST submit wholesale inquiry.
- `/api/contact`: POST submit contact message.
- `/api/admin/stats`: GET dashboard aggregated analytics.
- `/api/admin/homepage`: GET/PUT homepage configuration sections.
- `/api/admin/settings`: GET/PUT store settings.
- `/api/admin/reports/export`: GET CSV export files.
