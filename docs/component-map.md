# Component Architecture Map

## 1. Storefront Components (`/src/components/storefront/`)
- `Header.tsx`: Announcement bar, Logo, Primary Navigation, Search trigger, Currency/Language selector, Wishlist trigger, Account button, Cart trigger.
- `MegaMenu.tsx`: Database-driven multi-column mega menu with categories, subcategories, and featured banners.
- `MobileMenu.tsx`: Drawer for mobile screens with accordion categories, search, language toggle, and account shortcuts.
- `SearchOverlay.tsx`: Real-time modal search with debounced backend query, recent search memory, trending keywords, and product preview list.
- `CartDrawer.tsx`: Slide-in cart drawer with free shipping progress bar, quantity controls, grind type display, coupon input, and checkout CTA.
- `Footer.tsx`: Newsletter form, quick links, category links, payment badges (Mada, Visa, Mastercard, Apple Pay), VAT registration number, social links, copyright.
- `ProductCard.tsx`: Reusable product card with dual hover images, tasting notes pills, grind size selection modal/action, wishlist button, stock badges, rating stars.
- `ProductGrid.tsx`: Grid or carousel renderer for product lists with loading skeleton states.
- `ProductQuickViewModal.tsx`: Fast product inspection overlay.
- `CoffeeFinderQuiz.tsx`: Step-by-step interactive quiz to recommend specialty coffee crops.
- `FlavorChart.tsx`: Radar or bar chart representing coffee flavor attributes (Acidity, Sweetness, Body, Balance).
- `StockAlertModal.tsx`: Out-of-stock restock subscription form.
- `ReviewsSection.tsx`: Customer ratings, photo gallery, review submission form, staff replies.
- `QuestionsSection.tsx`: Public Q&A list and question submission form.

## 2. Homepage Section Components (`/src/components/homepage/`)
- `HeroSlider.tsx`: Hero banner slider with desktop/mobile images, Arabic/English text, CTA buttons, autoplay controls.
- `FeaturedCategories.tsx`: Visual category cards with hover zoom effects.
- `ProductCarouselSection.tsx`: Reusable section showing products in a carousel (New Arrivals, Best Sellers, Roastery Picks).
- `PromoBannerSection.tsx`: Full-width or split promotional banner with custom CTA.
- `CoffeeFinderCallout.tsx`: Interactive callout promoting the Coffee Quiz tool.
- `RoasteryStorySection.tsx`: Video highlight or brand story block showcasing roasting process & bean sourcing.
- `BenefitsBar.tsx`: Icons highlighting 100% Specialty Arabica, Fresh Weekly Roast, Express Delivery, Secure Payment.
- `TestimonialsSection.tsx`: Customer reviews ticker / slider.
- `NewsletterSection.tsx`: Subscriber signup with instant confirmation.

## 3. Account & Checkout Components (`/src/components/account/` & `/src/components/checkout/`)
- `CheckoutForm.tsx`: Multi-step checkout (Contact, Shipping address, Delivery option, Payment method, Coupon & Loyalty redemption, Order summary).
- `OrderTimeline.tsx`: Live 5-stage shipment visual progress tracker.
- `TaxInvoice.tsx`: Printable Saudi compliant VAT tax invoice component.
- `AddressModal.tsx`: Add/edit delivery address modal.
- `LoyaltyHub.tsx`: Points wallet, progress to next tier, voucher generation.

## 4. Admin Components (`/src/components/admin/`)
- `AdminLayout.tsx`: Protected sidebar, top navbar, breadcrumbs, user info, language toggle.
- `DashboardOverview.tsx`: Analytics KPIs, sales revenue line chart, order status pie chart, recent transactions, low stock table.
- `ProductFormModal.tsx`: Comprehensive product editor (Translations, SKU, Pricing, Variants, Grind types, Tasting notes, Origin stats, Multi-image gallery upload).
- `OrderDetailsModal.tsx`: Order details viewer, status change dropdown, packing slip printer, tracking link generator.
- `CouponFormModal.tsx`: Create discount code with rules and expiration dates.
- `HomepageSectionEditor.tsx`: Section ordering, toggling visibility, slide builder.
- `ReviewModerationModal.tsx`: Approve, reject, or reply to customer reviews.
- `WholesaleRequestsTable.tsx`: View & manage business B2B leads.
- `SettingsForm.tsx`: Configure VAT rate, currencies, shipping methods, payment keys.

## 5. Backend Services & Repositories (`/src/server/`)
- `db.ts`: In-memory & JSON file-backed relational data repository with seed records, persistent state across server restarts, and atomic transactional operations.
- `services/productService.ts`: Filtering, sorting, searching, stock updates, variant resolution.
- `services/orderService.ts`: Order creation, inventory reservation, status state machine, VAT calculation, order numbers.
- `services/couponService.ts`: Coupon code verification and discount calculation.
- `services/loyaltyService.ts`: Points calculation, reward balance history.
- `services/authService.ts`: Session tokens, password verification, role authorization.
