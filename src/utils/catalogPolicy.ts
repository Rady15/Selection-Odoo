/**
 * Public catalog eligibility policy.
 *
 * Odoo ships a set of system products that must never reach the storefront:
 * POS tips, the POS down-payment line, discount/reward lines, gift cards and
 * eWallet top-ups. The API guide (§6, "Catalog and discovery") states these are
 * excluded from `/api/products`, but the current backend still returns five of
 * them, which pollutes:
 *
 *   - the product listing
 *   - search results            (`/api/products?q=...`)
 *   - category / flag filters   (`/api/products?category=...&flag=new`)
 *   - the displayed product count
 *
 * This module is the single place that decides what is a catalog product. It is
 * applied centrally in `utils/externalApi.ts`, so every consumer (listing page,
 * search overlay, homepage carousel, related products) inherits the same rule
 * without touching individual call sites.
 *
 * The authoritative filter still belongs in the Odoo addon — only there can
 * `meta.total`, the SQL domain and every query path be fixed at once. See
 * `docs/PATCH-exclude-internal-products.md`. This guard exists so the storefront
 * stays correct on a backend that is not yet patched, and so a future regression
 * cannot reach customers.
 *
 * ## Why the rules are narrow
 *
 * Only two signals are trusted: a known Odoo system-product name, and an Odoo
 * POS/internal category — and both are gated behind "has no purchasable
 * variant", so a sellable product is never hidden.
 *
 * The expense lines that used to leak (`VISA Renewal`, `Petrol Expenses`,
 * `Penalties / Fines`, …) are now archived in Odoo rather than filtered here, so
 * `All / Expenses` is no longer treated as internal — it only holds real
 * merchandise today (Cafetto descalers, water-hardness kits).
 *
 * Structural heuristics ("no category, no image, no description") were
 * evaluated and rejected — they also match real spare parts that are simply out
 * of stock and never got a description or photo (e.g. "Profitec - Inlet Pipe
 * Brewing Group P2524"). Hiding a real product is worse than showing a system
 * one, so anything ambiguous is kept and left for the server-side filter.
 */

/** Normalised (lowercase, punctuation-collapsed) names of Odoo system products. */
const INTERNAL_PRODUCT_NAMES: ReadonlySet<string> = new Set([
  // English
  'tips',
  'tip',
  'down payment',
  'down payment pos',
  'discount',
  'discount line',
  'gift card',
  'gift card line',
  'top-up ewallet',
  'top up ewallet',
  'ewallet top-up',
  'ewallet top up',
  'shipping',
  'delivery fee',
  'cash on delivery',
  'cod surcharge',
  'payment fee',
  // Arabic (Odoo ar translations)
  'بقشيش',
  'إكرامية',
  'دفعة مقدمة',
  'دفعة مقدمة نقطة البيع',
  'خصم',
  'سطر الخصم',
  'بطاقة هدايا',
  'بطاقة هدية',
  'تعبئة المحفظة الإلكترونية',
  'شحن',
  'رسوم التوصيل',
  'الدفع عند الاستلام',
]);

/**
 * Odoo internal / point-of-sale categories. A product filed here is an
 * accounting artefact, never merchandise — e.g. "All / Saleable / PoS".
 *
 * Bare "All" is intentionally NOT matched: it is the catalogue root and real
 * products may still sit directly under it.
 *
 * `All / Expenses` is intentionally NOT matched either. It used to hold the
 * internal expense lines, but those are now archived in Odoo; what remains there
 * is real merchandise (Cafetto descalers, water-hardness kits). Matching the
 * category would hide products customers can buy.
 */
const INTERNAL_CATEGORY_PATTERNS: readonly RegExp[] = [
  /(^|[\s/])pos$/i, // "All / Saleable / PoS"
  /\bpoint[\s-]*of[\s-]*sale\b/i,
  /(^|[\s/])internal$/i, // "All / Saleable / Internal"
];

/** Lowercase, strip punctuation noise, collapse whitespace. */
export function normalizeProductName(value: unknown): string {
  return String(value ?? '')
    .replace(/\u0640/g, '') // Arabic tatweel
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hasInternalName(raw: any): boolean {
  const candidates = [raw?.name, raw?.name_en, raw?.name_ar];
  return candidates.some((n) => {
    const norm = normalizeProductName(n);
    if (!norm) return false;
    if (INTERNAL_PRODUCT_NAMES.has(norm)) return true;
    // Also match when a locale suffix is appended, e.g. "Discount (10%)".
    return INTERNAL_PRODUCT_NAMES.has(norm.replace(/\s*\(.*?\)\s*/g, ' ').trim());
  });
}

function hasInternalCategory(raw: any): boolean {
  // Public category links, when present, are authoritative: a product linked to
  // a real storefront category is merchandise, whatever its Odoo category says.
  if (Array.isArray(raw?.categories) && raw.categories.length > 0) return false;
  const names = [raw?.categ_name, raw?.category_name, raw?.categ?.name];
  return names.some((n) => {
    const s = String(n ?? '').trim();
    return s !== '' && INTERNAL_CATEGORY_PATTERNS.some((rx) => rx.test(s));
  });
}

/**
 * True when at least one variant can actually be bought. Odoo's `purchasable`
 * already folds in active + saleable + company/website eligibility + stock.
 *
 * This is the escape hatch: a sellable product is merchandise no matter which
 * Odoo category it was filed under.
 */
function hasPurchasableVariant(raw: any): boolean {
  const variants = Array.isArray(raw?.variants) ? raw.variants : [];
  return variants.some((v: any) => v?.purchasable === true);
}

/**
 * Decide whether a raw `/api/products` payload describes an internal Odoo record
 * that must not appear in the public catalog.
 *
 * Works on both list items and detail objects — both carry `name`, `categ_name`,
 * `categories` and per-variant `purchasable`.
 */
export function isInternalProduct(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;
  if (raw.is_internal === true) return true; // forward-compatible: honours a backend flag when added
  // A buyable product is merchandise, whatever its name or category says.
  if (hasPurchasableVariant(raw)) return false;
  if (hasInternalName(raw)) return true;
  if (hasInternalCategory(raw)) return true;
  return false;
}

/** Filter a product list, preserving order. */
export function filterPublicProducts<T>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return list.filter((p) => !isInternalProduct(p));
}
