# Reference Audit: Specialty Coffee Platform (Inspired by b-k.coffee)

## 1. Storefront Visual & Structural Analysis
- **Theme & Branding**: Arabic-first RTL design language with sleek roasted espresso tones (`#110E0C`, `#1C1613`, `#8C532B`, `#D99B26`, `#F8F5F0`), pristine layout density, high typography contrast (Cairo/Tajawal feel), and responsive smooth interactions.
- **Header & Navigation**:
  - Top Announcement Bar: Live promo messages ("Free shipping over 199 SAR"), countdown timers, dismissible toggle.
  - Primary Header: Logo, Mega Menu with nested subcategories (Coffee Crops, Specialty Boxes, Drip Bags, Equipment & Tools, Cups & Accessories), Live AJAX Search with instant thumbnail results, Currency Switcher (SAR, AED, KWD, QAR, USD), Language Switcher (AR/EN), Wishlist Counter, Cart Drawer Button with badge.
- **Interactive Experience**:
  - Search Modal / Overlay: Real-time search with debounced backend query, popular search keywords, recent search history, categorized results.
  - Slide-in Cart Drawer: Instant quantity updates, free shipping threshold progress bar, coupon code input, loyalty discount estimator, sticky checkout CTA.
  - Coffee Beans Quiz / Finder: "Find Your Perfect Crop" step-by-step selector based on brewing method, roast level, and flavor preferences.

## 2. Product Catalog & Details
- **Coffee Crops Metadata**: Origin Country, Region, Altitude (MASL), Processing Method (Natural, Washed, Anaerobic, Honey), Tasting Notes (e.g. Jasmine, Dried Fruits, Milk Chocolate, Honey), Roast Profile (Light, Medium-Light, Medium, Espresso).
- **Variant Matrix**:
  - Grind Types: Whole Beans (حبوب كاملة), V60 (فلتر/مقطرة), Espresso (إسبرسو), French Press (مكبس فرنسي), Aeropress, Cold Brew, Turkish.
  - Weights: 250g, 500g, 1kg, Box of 10 bags.
  - SKU, Stock inventory, Custom pricing per variant.
- **Product Gallery**: Multi-image slider with zoom, variant image auto-swap, video preview, tasting chart radar/bar visuals.
- **Out-of-Stock Notifications**: Request notification modal capturing customer phone & email for restock alerts.
- **Reviews & Q&A**: Verified customer reviews with star ratings, photos, and public answers by roasters.

## 3. Customer & Admin Commerce Engine
- **Customer Auth & Dashboard**: Order tracking timeline, digital tax invoices, address manager with map coordinates, loyalty rewards ledger, back-in-stock alerts wishlist.
- **Checkout Engine**: Registered checkout (login required), Saudi region/city selector, shipping rates (SMSA, Aramex, Local Express), payments (Mada, Apple Pay, Visa/Mastercard, COD), VAT 15% itemization, coupons, loyalty points redemption.
- **Admin Management Panel (`/admin`)**:
  - Live Sales Dashboard & KPIs.
  - Product & Variant Builder with multi-language fields.
  - Category & Mega Menu Builder.
  - Order Processing & Invoice PDF/Print system.
  - Customer & Loyalty Points Manager.
  - Coupon & Banner Campaign Manager.
  - Review & Q&A Moderation.
  - Storefront Section Builder & Settings.
