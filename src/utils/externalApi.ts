
import { filterPublicProducts, isInternalProduct } from './catalogPolicy';
import { cleanText, cleanUrl, stripHtml, toEmbedUrl } from './text';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://oktech24-coffee-selection-usa-staging-40504893.dev.odoo.com').replace(/\/+$/, '');

// Odoo serves media as site-relative paths (e.g. /web/image/...) but the SPA
// runs on another origin, so absolutize them to the API host.
function absUrl(u: unknown): string {
  const s = String(u ?? '');
  if (!s || /^https?:\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return s;
}

// Variant attributes come either as an object map or as an Odoo-style array
// of {attribute, value} pairs.
function variantAttr(v: any, names: string[]): string {
  const attrs = v?.attributes;
  if (Array.isArray(attrs)) {
    for (const n of names) {
      const hit = attrs.find((a: any) => String(a?.attribute ?? a?.name ?? '').toLowerCase() === n.toLowerCase());
      if (hit?.value != null && String(hit.value) !== '') return String(hit.value);
    }
    return '';
  }
  if (attrs && typeof attrs === 'object') {
    for (const n of names) {
      const hit = attrs[n] ?? attrs[n.toLowerCase()];
      if (hit != null && String(hit) !== '') return String(hit);
    }
  }
  return '';
}

function variantPrice(v: any): number {
  const cands = [v?.price, v?.sale_price, v?.price_included?.amount, v?.price_excluded?.amount];
  for (const c of cands) {
    const n = Number(c);
    if (Number.isFinite(n) && n >= 0 && String(c ?? '') !== '') return n;
  }
  return 0;
}

function normalizeProduct(p: any): any {
  if (!p) return p;
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const parsedVariants = variants.map((v: any, i: number) => {
    const weight = v.weight || variantAttr(v, ['Weight', 'weight', 'Size', 'size']) || '';
    const grind = v.grind || variantAttr(v, ['Grind', 'grind']) || 'beans';
    return {
      ...v,
      id: v.id ?? `${p.id}-v${i}`,
      sku: v.sku || '',
      weight: String(weight),
      grind,
      price: variantPrice(v),
      stock: Number(v.stock ?? v.free_qty ?? v.available_quantity ?? v.qty_available ?? 0),
      active: v.active !== false,
    };
  });
  const first = parsedVariants[0];
  const notesEn = Array.isArray(p.tasting_notes_en) ? p.tasting_notes_en : String(p.tasting_notes_en || p.tasting_notes || '').split(',').map((x:string)=>x.trim()).filter(Boolean);
  const notesAr = Array.isArray(p.tasting_notes_ar) ? p.tasting_notes_ar : String(p.tasting_notes_ar || '').split('،').map((x:string)=>x.trim()).filter(Boolean);
  const catObjs = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
  const categoryIds = catObjs.map((c: any) => c?.id).filter(Boolean);
  const firstCat = catObjs[0] || {};
  const flags = p.flags || {};
  const images = (Array.isArray(p.images) ? p.images : [p.image_url || p.image]).filter(Boolean).map(absUrl);
  return {
    ...p,
    id: p.id,
    slug: p.slug,
    name_ar: p.name_ar || p.ar_name || p.name || p.name_en || '',
    name_en: p.name_en || p.name || '',
    subtitle_ar: p.subtitle_ar || p.ar_subtitle || '',
    subtitle_en: p.subtitle_en || p.subtitle || '',
    description_ar: p.description_ar || p.ar_description || '',
    description_en: p.description_en || p.description || '',
    category_id: p.category_id || categoryIds[0] || firstCat.id || '',
    category_slug: p.category_slug || firstCat.slug || '',
    price: Number(p.price ?? p.price_from?.amount ?? first?.price ?? 0),
    sale_price: p.sale_price != null ? Number(p.sale_price) : undefined,
    stock: Number(p.stock ?? first?.stock ?? 0),
    sku: p.sku || first?.sku || '',
    rating: Number(p.rating ?? 0),
    review_count: Number(p.review_count ?? 0),
    sold_count: Number(p.sold_count ?? 0),
    is_new: p.is_new ?? flags.new ?? false,
    is_bestseller: p.is_bestseller ?? flags.bestseller ?? false,
    is_featured: p.is_featured ?? flags.featured ?? false,
    is_roasters_choice: p.is_roasters_choice ?? p.is_roaster_choice ?? flags.roaster_choice ?? flags.roasters_choice ?? false,
    tasting_notes_ar: notesAr,
    tasting_notes_en: notesEn,
    origin_country_ar: p.origin_country_ar || p.origin_country || '',
    origin_country_en: p.origin_country_en || p.origin_country || '',
    region_ar: p.region_ar || p.origin_region || '',
    region_en: p.region_en || p.origin_region || '',
    process_ar: p.process_ar || p.process || '',
    process_en: p.process_en || p.process || '',
    roast_level_ar: p.roast_level_ar || p.roast_level || '',
    roast_level_en: p.roast_level_en || p.roast_level || '',
    variety: p.variety || '',
    flavor_profile: {
      acidity: Number(p.acidity ?? 0), sweetness: Number(p.sweetness ?? 0),
      body: Number(p.body_score ?? p.body ?? 0), balance: Number(p.balance ?? 0),
      strength: Number(p.strength ?? 0), bitterness: Number(p.bitterness ?? 0), caffeine: Number(p.caffeine ?? 0)
    },
    images,
    variants: parsedVariants,
    weight_options: parsedVariants.map((v:any)=>({ value:v.weight, label_ar:v.weight, label_en:v.weight, priceModifier:0, skuSuffix:v.sku || '' })),
    grind_options: [...new Set(parsedVariants.map((v:any)=>v.grind))],
    created_at: p.created_at || p.create_date || ''
  };
}

function normalizeReview(r: any): any {
  if (!r || typeof r !== 'object') return r;
  const reply = r.staff_reply ?? r.reply ?? null;
  const replyStr = typeof reply === 'string' ? reply : '';
  const replyAr = r.staff_reply_ar || (typeof reply === 'object' ? reply?.ar || reply?.arabic || '' : replyStr);
  const replyEn = r.staff_reply_en || (typeof reply === 'object' ? reply?.en || reply?.english || '' : replyStr);
  return {
    ...r,
    id: r.id,
    title: r.title || '',
    comment: r.comment ?? r.body ?? '',
    customer_name: r.customer_name || r.customer || '',
    rating: Number(r.rating ?? 0),
    verified_purchase: r.verified_purchase ?? r.verified ?? false,
    staff_reply_ar: replyAr || '',
    staff_reply_en: replyEn || '',
    created_at: r.created_at || r.create_date || '',
    status: r.status || 'approved',
  };
}

function normalizeQuestion(q: any): any {
  if (!q || typeof q !== 'object') return q;
  const ans = q.answer ?? null;
  const ansStr = typeof ans === 'string' ? ans : '';
  return {
    ...q,
    id: q.id,
    customer_name: q.customer_name || q.customer || '',
    question: q.question || q.body || q.title || '',
    answer_ar: q.answer_ar || (typeof ans === 'object' ? ans?.ar || ans?.arabic || '' : ansStr),
    answer_en: q.answer_en || (typeof ans === 'object' ? ans?.en || ans?.english || '' : ansStr),
    status: q.status || 'approved',
    created_at: q.created_at || q.create_date || '',
  };
}

function normalizeCategory(c: any): any {
  if (!c || typeof c !== 'object') return c;
  // `GET /api/categories` now embeds the category's products. Normalising them
  // here keeps the shape identical to `GET /api/products`, so any consumer can
  // hand them straight to ProductCard.
  const products = Array.isArray(c.products) ? c.products.map(normalizeProduct) : [];
  const ownImage = absUrl(cleanText(c.image || c.image_url));
  // Every category currently has `image: null`; the first product photo is a
  // far better cover than one shared stock photo on all eleven cards.
  const coverImage = ownImage || absUrl(cleanText(products.find((p: any) => p?.image)?.image));
  return {
    ...c,
    id: c.id,
    slug: c.slug,
    name_ar: cleanText(c.name_ar) || cleanText(c.ar_name) || cleanText(c.name) || cleanText(c.name_en),
    name_en: cleanText(c.name_en) || cleanText(c.name),
    description_ar: stripHtml(c.description_ar || c.description),
    description_en: stripHtml(c.description_en || c.description),
    image: ownImage,
    cover_image: coverImage,
    products,
    product_count: products.length,
    parent_id: c.parent_id,
    sort_order: Number(c.sort_order ?? c.sequence ?? 0),
    featured: c.featured ?? false,
  };
}

function normalizeOrder(o:any):any {
  if (!o) return o;
  // Money fields arrive either as plain numbers or {amount, currency} objects.
  const money = (v: any, fb = 0): number => {
    if (v && typeof v === 'object') v = v.amount ?? v.value ?? fb;
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  const rawItems = o.items || o.lines || o.order_lines || o.order_line || [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((l: any) => {
    const qty = Number(l.quantity ?? l.qty ?? 1);
    const unit = money(l.unit_price ?? l.price ?? l.price_unit ?? 0);
    return {
      product_id: l.product_id || l.product?.id || '',
      product_name_ar: l.product_name_ar || l.name_ar || l.name || '',
      product_name_en: l.product_name_en || l.name_en || l.name || '',
      image: absUrl(l.image || l.product?.image || ''),
      weight: l.weight || variantAttr({ attributes: l.attributes }, ['Weight', 'weight', 'Size', 'size']) || '',
      grind: l.grind || variantAttr({ attributes: l.attributes }, ['Grind', 'grind']) || 'beans',
      quantity: qty, unit_price: unit,
      total_price: money(l.total_price ?? l.subtotal ?? l.price_subtotal ?? (unit * qty)),
      sku: l.sku || '',
    };
  });
  return {
    ...o,
    items,
    order_number:o.order_number || o.number || o.name,
    total_amount:money(o.total_amount ?? o.total ?? o.amount_total ?? 0),
    subtotal:money(o.subtotal ?? o.amount_untaxed ?? 0), shipping_cost:money(o.shipping_cost ?? 0),
    discount_amount:money(o.discount_amount ?? 0), tax_amount:money(o.tax_amount ?? o.tax ?? o.amount_tax ?? 0),
    customer_name:o.customer_name || o.customer?.name || '', email:o.email || o.customer?.email || '',
    phone:o.phone || o.customer?.phone || '', status:o.status || o.state || 'pending',
    payment_status:o.payment_status || o.payment_state || 'pending',
    created_at:o.created_at || o.date_order || o.create_date || ''
  };
}

const route = (path: string) => {
  const u = new URL(path, window.location.origin);
  let p = u.pathname;
  const q = u.searchParams;

  const aliases: Record<string, string> = {
    '/api/public/homepage': '/api/homepage',
    '/api/public/payment-methods': '/api/payment-methods',
    '/api/public/shipping-methods': '/api/shipping-methods',
    '/api/me': '/api/auth/me',
  };
  if (aliases[p]) p = aliases[p];

  if (p === '/api/products') {
    if (q.has('search')) { q.set('q', q.get('search') || ''); q.delete('search'); }
    if (q.has('category_slug')) { q.set('category', q.get('category_slug') || ''); q.delete('category_slug'); }
    return { path: p, query: q };
  }
  if (p === '/api/products' || p.startsWith('/api/products/')) return { path: p, query: q };
  if (p === '/api/categories') return { path: p, query: q };
  if (p === '/api/orders') return { path: p, query: q };
  if (p.startsWith('/api/orders/')) return { path: p, query: q };
  if (p === '/api/reviews' && q.has('product_id')) { q.set('product', q.get('product_id') || ''); q.delete('product_id'); }
  if (p === '/api/questions' && q.has('product_id')) { q.set('product', q.get('product_id') || ''); q.delete('product_id'); }

  const adminAliases: [RegExp, string][] = [
    [/^\/api\/admin\/products(\/.*)?$/, '/api/products$1'],
    [/^\/api\/admin\/categories(\/.*)?$/, '/api/categories$1'],
    [/^\/api\/admin\/orders(\/.*)?$/, '/api/orders$1'],
    [/^\/api\/admin\/reviews(\/.*)?$/, '/api/reviews$1'],
    [/^\/api\/admin\/questions(\/.*)?$/, '/api/questions$1'],
    [/^\/api\/admin\/coupons(\/.*)?$/, '/api/admin/coupons$1'],
  ];
  for (const [rx, replacement] of adminAliases) {
    if (rx.test(p)) {
      p = p.replace(rx, replacement);
      break;
    }
  }
  if (p === '/api/admin/orders') q.set('all', '1');

  return { path: p, query: q };
};

const jsonResponse = (value: unknown, status: number, headers: Headers) => {
  const h = new Headers(headers);
  h.set('content-type', 'application/json');
  return new Response(JSON.stringify(value), { status, statusText: status === 200 ? 'OK' : undefined, headers: h });
};

const LIST_PATHS = new Set([
  '/api/products', '/api/categories', '/api/payment-methods', '/api/shipping-methods',
  '/api/orders', '/api/reviews', '/api/questions', '/api/addresses',
  '/api/admin/coupons'
]);

/* ------------------------------------------------------------------------ *
 * Homepage blocks -> HomepageSection[]
 *
 * `GET /api/homepage` returns the CMS blocks in editorial order, and every
 * block carries its own data:
 *
 *   0 hero          image + linked product
 *   1 hero          image
 *   2 categories    title
 *   3 products      title + 10 linked products
 *   4 products      title + 48 linked products
 *   5 video         video_url
 *   6 testimonials  title
 *   7 newsletter
 *   8 coffee_finder
 *   9 story
 *
 * Two things were wrong before: the `video` block was silently dropped, and
 * both `products` blocks were rendered by fetching `?flag=new&limit=12` — so
 * they showed the same twelve items instead of the products the editor
 * attached to each block. The transform below keeps one section per block, in
 * payload order, carrying that block's own products / categories / media.
 * ------------------------------------------------------------------------ */

const HERO_BLOCK_TYPES = new Set(['hero', 'hero_slider', 'slider']);

const BLOCK_TYPE_MAP: Record<string, string> = {
  hero: 'hero_slider',
  hero_slider: 'hero_slider',
  slider: 'hero_slider',
  categories: 'featured_categories',
  category: 'featured_categories',
  products: 'product_carousel',
  product_carousel: 'product_carousel',
  coffee_finder: 'coffee_quiz',
  coffee_quiz: 'coffee_quiz',
  testimonials: 'testimonials',
  newsletter: 'newsletter',
  story: 'roastery_story',
  roastery_story: 'roastery_story',
  video: 'video',
  benefits: 'benefits',
  values_carousel: 'values_carousel',
  banner: 'banner',
};

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1920&q=80';

const blockId = (block: any, fallback: string): string => cleanText(block?.id) || fallback;

const blockObjects = (value: any): any[] =>
  (Array.isArray(value) ? value : []).filter((item: any) => item && typeof item === 'object');

function buildHeroSlide(block: any, index: number): any {
  const product = blockObjects(block?.products)[0];
  const category = blockObjects(block?.categories)[0];

  const title = stripHtml(block?.title);
  const subtitle = stripHtml(block?.body);
  const badge = cleanText(category?.name);

  const cmsImage = absUrl(cleanText(block?.image));
  const productImage = absUrl(cleanText(product?.image));
  const categoryImage = absUrl(cleanText(category?.image));
  // Ordered fallback chain — the slider walks it when a source is missing or
  // is one of Odoo's 256px placeholders.
  const sources = [cmsImage, productImage, categoryImage, HERO_FALLBACK_IMAGE].filter(
    (url, i, all) => Boolean(url) && all.indexOf(url) === i
  );

  // An explicit CMS CTA wins. Otherwise the product/category the editor
  // attached to the block becomes the call to action: without this both hero
  // slides render as bare images, because title/body/cta are all empty.
  let ctaText = cleanText(block?.cta?.label);
  let ctaLink = cleanUrl(block?.cta?.url);
  if (!ctaText && !ctaLink) {
    if (product) {
      ctaText = cleanText(product.name_en) || cleanText(product.name_ar);
      ctaLink = `/product/${cleanText(product.slug) || cleanText(product.id)}`;
    } else if (category) {
      ctaText = cleanText(category.name_en) || cleanText(category.name_ar);
      ctaLink = `/products?category=${cleanText(category.slug)}`;
    }
  }

  return {
    id: blockId(block, `slide-${index}`),
    title_ar: title,
    title_en: title,
    subtitle_ar: subtitle,
    subtitle_en: subtitle,
    badge_ar: badge,
    badge_en: badge,
    cta_text_ar: ctaText,
    cta_text_en: ctaText,
    cta_link: ctaLink,
    link_url: ctaLink,
    image_desktop: sources[0] || '',
    image_mobile: sources[0] || '',
    sources,
  };
}

function buildHomepageSections(blocks: any[]): any[] {
  const sections: any[] = [];
  const heroSlides: any[] = [];
  let heroIndex = -1;

  blocks.forEach((block, index) => {
    if (!block || typeof block !== 'object') return;
    const rawType = cleanText(block.type).toLowerCase();
    if (!rawType) return;

    // Consecutive hero blocks are slides of one slider, not separate sections.
    if (HERO_BLOCK_TYPES.has(rawType)) {
      if (heroIndex === -1) heroIndex = index;
      heroSlides.push(buildHeroSlide(block, heroSlides.length));
      return;
    }

    const type = BLOCK_TYPE_MAP[rawType];
    if (!type) return; // genuinely unknown block type — never force it into the hero

    const title = stripHtml(block.title);
    const subtitle = stripHtml(block.body);
    const image = absUrl(cleanText(block.image));
    const ctaLabel = cleanText(block.cta?.label);
    const ctaLink = cleanUrl(block.cta?.url);
    const config: Record<string, any> = {};

    if (type === 'product_carousel') {
      config.products = blockObjects(block.products).map(normalizeProduct);
      config.collection = cleanText(block.configuration?.collection) || 'new';
      config.categorySlug = cleanText(block.configuration?.categorySlug);
      config.badge_ar = title;
      config.badge_en = title;
      config.image = image;
    } else if (type === 'featured_categories') {
      config.categories = blockObjects(block.categories).map(normalizeCategory);
      config.image = image;
    } else if (type === 'roastery_story' || type === 'video') {
      config.video_url = toEmbedUrl(block.video_url);
      config.image = image;
    } else {
      config.image = image;
    }

    if (ctaLabel) {
      config.cta_label = ctaLabel;
      config.cta_link = ctaLink;
    }

    sections.push({
      id: blockId(block, `sec-${type}-${index}`),
      type,
      is_enabled: block.is_enabled !== false && block.enabled !== false,
      // Payload order is the editorial order — keep it, with gaps so a block
      // can be reordered server-side without renumbering.
      sort_order: index * 10,
      title_ar: title,
      title_en: title,
      subtitle_ar: subtitle,
      subtitle_en: subtitle,
      cta_label: ctaLabel,
      cta_link: ctaLink,
      image,
      config,
    });
  });

  if (heroSlides.length > 0) {
    const cfg = blocks[0]?.configuration || {};
    const interval = Number(cfg.interval);
    sections.push({
      id: 'sec-hero',
      type: 'hero_slider',
      is_enabled: true,
      sort_order: (heroIndex < 0 ? 0 : heroIndex) * 10,
      title_ar: '',
      title_en: '',
      config: {
        slides: heroSlides,
        autoplay: cfg.autoplay !== false,
        interval: Number.isFinite(interval) && interval > 0 ? interval : 6000,
      },
    });
  }

  return sections.sort((a, b) => a.sort_order - b.sort_order);
}

async function transformResponse(response: Response, path: string, method: string, includeInternal = false): Promise<Response> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return response;
  const clone = response.clone();
  let body: any;
  try { body = await clone.json(); } catch { return response; }

  if (!body || typeof body !== 'object' || !('success' in body)) return response;

  // GET list endpoints must always resolve to arrays so consumers can safely
  // .map/.filter — on backend errors resolve to []. Failures for writes
  // (POST/PUT/DELETE) keep the error object so the UI can show the reason.
  if (!body.success) {
    const err = body.error || {};
    if (method === 'GET' && LIST_PATHS.has(path)) return jsonResponse([], response.status, response.headers);
    return jsonResponse({
      error: err.message,
      error_en: err.message,
      error_ar: err.message,
      code: err.code,
    }, response.status, response.headers);
  }

  const data = body.data;

  // CMS homepage blocks -> HomepageSection[], in payload order, each with its
  // own products / categories / media. See buildHomepageSections above.
  if (path === '/api/homepage' && Array.isArray(data)) {
    return jsonResponse(buildHomepageSections(data), response.status, response.headers);
  }

  // Keep the existing frontend contract while the real source of truth is Odoo.
  if (/\/api\/auth\/(login|register|google)$/.test(path)) {
    return jsonResponse({ token: data?.access_token || data?.token || data?.session_id, user: data?.user }, response.status, response.headers);
  }
  // /api/me is consumed as {user, transactions, reviews} — only wrap when the
  // backend returned the user object directly.
  if (path === '/api/auth/me') {
    if (data && typeof data === 'object' && !Array.isArray(data) && 'user' in data) {
      return jsonResponse(data, response.status, response.headers);
    }
    return jsonResponse({ user: data }, response.status, response.headers);
  }
  if (path === '/api/coupons/validate') return jsonResponse({ ...(data || {}), valid: true, coupon: data?.coupon || data }, response.status, response.headers);

  if (path === '/api/admin/stats') {
    return jsonResponse({
      totalRevenue: data?.revenue ?? 0,
      totalOrders: data?.orders ?? 0,
      avgOrderValue: data?.average_order_value ?? 0,
      pendingOrders: data?.pending_orders ?? 0,
      totalCustomers: data?.customers ?? 0,
      lowStockCount: data?.low_stock_variants ?? 0,
      lowStockProducts: [],
      recentOrders: [],
    }, response.status, response.headers);
  }

  if (LIST_PATHS.has(path)) {
    // Reviews/questions resolve to an {items, summary} envelope — unwrap it.
    if (path === '/api/reviews' || path === '/api/questions') {
      const d: any = data;
      const arr = Array.isArray(d) ? d : (Array.isArray(d?.items) ? d.items : (Array.isArray(d?.results) ? d.results : []));
      const mapped = arr.map((x: any) => path === '/api/reviews' ? normalizeReview(x) : normalizeQuestion(x));
      return jsonResponse(mapped, response.status, response.headers);
    }
    if (!Array.isArray(data) && method === 'GET') {
      // GET lists must resolve to arrays (safe .map/.filter downstream) —
      // except orders, whose envelope is handled by its own branch below.
      if (path !== '/api/orders') return jsonResponse([], response.status, response.headers);
    }
    if (path === '/api/products') {
      // Odoo system products (POS tips, down payment, discount/reward lines,
      // gift cards, eWallet top-ups) must never reach the storefront. Filtering
      // here covers the listing, search, every filter and the displayed count in
      // one place. `include_internal=1` opts out for the admin manager.
      const list = Array.isArray(data) ? data : (data ? [data] : []);
      const visible = includeInternal ? list : filterPublicProducts(list);
      if (!Array.isArray(data)) {
        const single = visible[0];
        if (!single && data) return jsonResponse({ error: 'not_found' }, 404, response.headers);
        return jsonResponse(normalizeProduct(single), response.status, response.headers);
      }
      const arr = visible.map(normalizeProduct);
      // Pagination has to survive the envelope unwrap, and it cannot ride on
      // the array (JSON.stringify drops non-index properties). It goes out as
      // response headers instead — the array stays a plain array.
      const h = new Headers(response.headers);
      if (body.meta && typeof body.meta === 'object') {
        if (body.meta.pages != null) h.set('x-catalog-pages', String(body.meta.pages));
        if (body.meta.total != null) h.set('x-catalog-total', String(body.meta.total));
        if (body.meta.page != null) h.set('x-catalog-page', String(body.meta.page));
      }
      return jsonResponse(arr, response.status, h);
    }
    if (path === '/api/categories') {
      if (!Array.isArray(data)) return jsonResponse(method === 'GET' ? [] : normalizeCategory(data), response.status, response.headers);
      // Odoo nests sub-categories under `children` — flatten so the catalog
      // carousel sees every category.
      const flat: any[] = [];
      const push = (c: any) => {
        if (!c || typeof c !== 'object') return;
        flat.push(normalizeCategory(c));
        (Array.isArray(c.children) ? c.children : []).forEach(push);
      };
      data.forEach(push);
      return jsonResponse(flat, response.status, response.headers);
    }
    if (path === '/api/orders') {
      // POST /api/orders (checkout) resolves to a single order object or an
      // {order} envelope — never coerce those to []. A payment_action
      // (Stripe client_secret...) rides along untouched for the checkout UI.
      const d: any = data;
      if (Array.isArray(d)) return jsonResponse(d.map(normalizeOrder), response.status, response.headers);
      if (d?.order) {
        const o = normalizeOrder(d.order);
        if (d.payment_action) o.payment_action = d.payment_action;
        return jsonResponse(o, response.status, response.headers);
      }
      if (d && typeof d === 'object') {
        const o = normalizeOrder(d);
        if (d.payment_action) o.payment_action = d.payment_action;
        return jsonResponse(o, response.status, response.headers);
      }
      return jsonResponse([], response.status, response.headers);
    }
    if (path === '/api/shipping-methods') {
      // Odoo shape: {id, code, name, base_fee:{amount}, cod_supported}.
      // UI shape: {name_ar/name_en, base_fee:number, ...}.
      if (!Array.isArray(data)) return jsonResponse([], response.status, response.headers);
      return jsonResponse(data.map((m: any) => ({
        ...m,
        code: m.code || m.id,
        name_ar: m.name_ar || m.name || '',
        name_en: m.name_en || m.name || '',
        description_ar: m.description_ar || (typeof m.description === 'string' ? m.description : '') || '',
        description_en: m.description_en || (typeof m.description === 'string' ? m.description : '') || '',
        base_fee: Number(m.base_fee?.amount ?? m.base_fee ?? 0),
        cod_supported: m.cod_supported ?? true,
        enabled: m.enabled ?? true,
      })), response.status, response.headers);
    }
    if (path === '/api/admin/coupons') {
      const mapCoupon = (c: any) => ({
        ...c, discount_type:c.type === 'percent' ? 'percentage' : c.type,
        discount_value:Number(c.amount ?? 0), min_order_amount:Number(c.minimum_spend ?? 0),
        valid_until:c.date_end || '', usage_count:Number(c.usage_count ?? 0),
        usage_limit:Number(c.usage_limit ?? 0), is_active:c.active !== false
      });
      return jsonResponse(Array.isArray(data) ? data.map(mapCoupon) : (method === 'GET' ? [] : mapCoupon(data)), response.status, response.headers);
    }
    return jsonResponse(data, response.status, response.headers);
  }

  // Public detail endpoints are consumed as objects by the existing UI.
  if (/^\/api\/products\/[^/]+$/.test(path) && data) {
    // An internal record must not be reachable by direct link either.
    if (!includeInternal && isInternalProduct(data)) {
      return jsonResponse({ error: 'not_found' }, 404, response.headers);
    }
    return jsonResponse(normalizeProduct(data), response.status, response.headers);
  }
  if (/^\/api\/orders\/[^/]+$/.test(path) && data) {
    const src: any = data?.order || data;
    const o = normalizeOrder(src);
    const pa = (data as any)?.payment_action || src?.payment_action;
    if (pa) o.payment_action = pa;
    return jsonResponse(o, response.status, response.headers);
  }

  return jsonResponse(data, response.status, response.headers);
}

export function installExternalApi() {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const original = typeof input === 'string'
      ? input
      : input instanceof URL ? input.toString() : input.url;

    if (!original.includes('/api/')) return nativeFetch(input, init);

    const { path, query } = route(original);
    let targetPath = path;
    const requestMethod = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    // Send the storefront language as a `lang` query param so Odoo returns
    // translated content (title/body/cta...). Query-only on purpose: custom
    // headers would force CORS preflights.
    let appLang = 'ar';
    try {
      const saved = localStorage.getItem('selection_lang');
      if (saved === 'en' || saved === 'ar') appLang = saved;
    } catch { /* storage unavailable — default Arabic */ }
    const odooLang = appLang === 'ar' ? 'ar_001' : 'en_US';
    if (!query.has('lang')) query.set('lang', odooLang);
    // Frontend-only flag: lets the admin manager see internal Odoo system
    // products. Stripped before forwarding so Odoo never receives it.
    const includeInternal = query.get('include_internal') === '1';
    if (includeInternal) query.delete('include_internal');
    // These content endpoints are not implemented by the Odoo staging backend
    // (404). Serve local stubs so the storefront renders without network spam.
    // Remove once the backend provides them.
    if (requestMethod === 'GET') {
      if (targetPath === '/api/banners') return jsonResponse([], 200, new Headers());
      if (targetPath === '/api/public/announcement') return jsonResponse(null, 200, new Headers());
      if (targetPath === '/api/public/settings') {
        return jsonResponse({
          store_name_ar: 'سليكشن',
          store_name_en: 'Selection',
          vat_number: '',
          vat_rate: 0.15,
          free_shipping_threshold: 199,
          default_currency: 'SAR',
          support_phone: '9200 12345',
          support_email: 'care@selection.coffee',
          whatsapp_number: '+966 50 000 0000',
          address_ar: 'الرياض - حي حطين - طريق الملك فهد',
          address_en: 'Riyadh - Hittin District - King Fahd Rd',
          instagram_url: '',
          twitter_url: '',
          tiktok_url: '',
          enable_loyalty: true,
          points_per_sar: 0.1,
          sar_per_point: 0.05,
        }, 200, new Headers());
      }
    }
    // Odoo staging has no per-user record endpoint (404). Short-circuit so the
    // account page doesn't spam the network; the callers already null-check.
    // Remove once the backend implements GET/PUT /api/users/:id.
    if (targetPath === '/api/users' || targetPath.startsWith('/api/users/')) {
      if (requestMethod === 'GET') return jsonResponse(null, 200, new Headers());
      if (requestMethod === 'PUT' || requestMethod === 'PATCH') {
        try {
          return jsonResponse({ user: JSON.parse(String(init?.body) || '{}') }, 200, new Headers());
        } catch {
          return jsonResponse({ user: null }, 200, new Headers());
        }
      }
    }
    if (path === '/api/orders' && requestMethod === 'POST') targetPath = '/api/checkout';
    // Same-origin always: Vite's dev proxy handles local dev, Vercel rewrites
    // handle production. The browser therefore only ever shows our own
    // /api/* paths — the Odoo backend origin never appears in DevTools.
    // (API_BASE_URL is still used to absolutize Odoo media URLs.)
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const target = `${targetPath}${queryString}`;
    const token = localStorage.getItem('selection_token');
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    // NOTE: do NOT send Accept-Language (or any custom header) here.
    // Values like ar_001/en_US contain "_" so the header is NOT CORS-
    // safelisted → forces a preflight that Odoo rejects. The `lang` query
    // param above already carries the language with zero preflight.

    // X-Cart-Token and Idempotency-Key are deliberately forwarded unchanged.
    const requestInit: RequestInit = { ...init, headers };
    if (typeof input !== 'string' && !(input instanceof URL)) {
      requestInit.method = init?.method || input.method;
    }

    // The original UI used a legacy local order payload. Convert it to the
    // documented Odoo checkout contract at the network boundary.
    if (path === '/api/products' && ['POST','PUT'].includes(requestMethod) && typeof requestInit.body === 'string') {
      try {
        const p = JSON.parse(requestInit.body);
        const weightOptions = Array.isArray(p.weight_options) ? p.weight_options : [];
        const grinds = Array.isArray(p.grind_options) && p.grind_options.length ? p.grind_options : ['beans'];
        const variants = Array.isArray(p.variants) && p.variants.length
          ? p.variants
          : weightOptions.flatMap((w:any) => grinds.map((g:string) => ({
              attributes: { Weight: w.value, Grind: g }, sku: `${p.sku || 'SKU'}-${String(w.value).replace(/\W+/g,'')}-${g}`,
              price: Number(p.price || 0) + Number(w.priceModifier || 0), active: true
            })));
        requestInit.body = JSON.stringify({
          ...p,
          categories: p.categories || (p.category_id ? [p.category_id] : []),
          attributes: p.attributes || [{ name: 'Weight', values: weightOptions.map((w:any)=>w.value).filter(Boolean) }],
          variants,
          tasting_notes_en: Array.isArray(p.tasting_notes_en) ? p.tasting_notes_en.join(', ') : p.tasting_notes_en,
          tasting_notes_ar: Array.isArray(p.tasting_notes_ar) ? p.tasting_notes_ar.join('، ') : p.tasting_notes_ar
        });
      } catch {}
    }

    if (path === '/api/admin/coupons' && ['POST','PUT'].includes(requestMethod) && typeof requestInit.body === 'string') {
      try {
        const c = JSON.parse(requestInit.body);
        requestInit.body = JSON.stringify({
          name: c.name || c.code, code: c.code, active: c.is_active !== false,
          type: c.discount_type === 'percentage' ? 'percent' : c.discount_type,
          amount: Number(c.discount_value || 0), minimum_spend: Number(c.min_order_amount || 0),
          usage_limit: Number(c.usage_limit || 0), date_end: c.valid_until
        });
      } catch {}
    }

    if (path === '/api/orders' && (requestInit.method || 'GET').toUpperCase() === 'POST' && typeof requestInit.body === 'string') {
      try {
        const legacy = JSON.parse(requestInit.body);
        const lines = (legacy.items || []).map((item: any) => ({
          variant_id: item.variant_id ||
            item.product?.variants?.find((v: any) => v.weight === item.weight && v.grind === item.grind)?.id ||
            item.product?.variants?.find((v: any) => v.weight === item.weight)?.id ||
            item.sku,
          sku: item.sku || item.product?.variants?.find((v: any) => v.weight === item.weight)?.sku || undefined,
          quantity: Number(item.quantity || 1),
        }));
        const checkout: any = {
          lines,
          shipping_method_id: legacy.shipping_method_id || legacy.shipping_method || legacy.selected_shipping_id,
          payment_method: legacy.payment_method || 'cod',
          coupon_code: legacy.coupon_code || undefined,
          loyalty_points: Number(legacy.loyalty_points_used || 0),
          address: legacy.shipping_address ? {
            name: legacy.shipping_address.full_name || legacy.customer_name,
            email: legacy.email,
            phone: legacy.shipping_address.phone || legacy.phone,
            street: legacy.shipping_address.street,
            street2: legacy.shipping_address.building || undefined,
            district: legacy.shipping_address.district,
            city: legacy.shipping_address.city,
            zip: legacy.shipping_address.postal_code,
            country: 'SA',
          } : undefined,
          email: legacy.email,
        };
        if (legacy.address_id) checkout.address_id = legacy.address_id;
        if (legacy.payment_method && legacy.payment_method !== 'cod') checkout.payment_method = legacy.payment_method;
        requestInit.body = JSON.stringify(checkout);
        headers.set('Idempotency-Key', headers.get('Idempotency-Key') || crypto.randomUUID());
      } catch { /* let the upstream API return its validation error */ }
    }

    const response = await nativeFetch(target, requestInit);
    // Keep list consumers stable when the upstream API returns a 404/500 HTML
    // page or a non-standard error envelope. Writes retain their real response.
    if (requestMethod === 'GET' && LIST_PATHS.has(path) && !response.ok) {
      console.error(`API list request failed (${response.status}): ${target}`);
      return jsonResponse([], 200, new Headers(response.headers));
    }
    const transformed = await transformResponse(response, path, requestMethod, includeInternal);
    if (requestMethod === 'GET' && LIST_PATHS.has(path) && transformed.ok) {
      try {
        const payload = await transformed.clone().json();
        if (Array.isArray(payload)) return transformed;
        const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.results) ? payload.results : [];
        return jsonResponse(list, transformed.status, transformed.headers);
      } catch {
        return jsonResponse([], 200, new Headers(transformed.headers));
      }
    }
    return transformed;
  };
}
