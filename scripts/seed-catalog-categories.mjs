#!/usr/bin/env node
/**
 * Seed the storefront category tree and link every sellable product to it.
 *
 * WHY THIS EXISTS
 * ---------------
 * `GET /api/categories` reads `product.public.category` (Odoo's *website*
 * category model). This database has only two demo records there ("Test",
 * "Specialty Coffee") and 2 products linked to them. Every other product has
 * `public_categ_ids = []`, so:
 *   - the storefront shows 2 category tabs instead of the real taxonomy,
 *   - `product.categories` is empty → `category_slug` is undefined → clicking
 *     any tab filters 487 products down to zero.
 *
 * The fix is data, not code: create the real public categories and link each
 * product. After that the addon's own `?category=<slug>` filter works too.
 *
 * USAGE
 *   node scripts/seed-catalog-categories.mjs                 # report only
 *   node scripts/seed-catalog-categories.mjs --verbose       # list every product
 *   node scripts/seed-catalog-categories.mjs --apply         # write to Odoo
 *   node scripts/seed-catalog-categories.mjs --apply --prune-legacy
 *
 * Credentials come from the environment, falling back to the staging defaults
 * used by the other maintenance scripts in this folder.
 */

import fs from 'node:fs';
import path from 'node:path';
import { odooConfig } from './odoo-env.mjs';

const { url: ODOO, db: DB, login: LOGIN, password: PASSWORD } = odooConfig();

const ARGS = { apply: false, verbose: false, pruneLegacy: false, archiveJunk: false, csv: './catalog-classification.csv' };
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--apply') ARGS.apply = true;
  else if (a === '--verbose') ARGS.verbose = true;
  else if (a === '--prune-legacy') ARGS.pruneLegacy = true;
  else if (a === '--archive-junk') ARGS.archiveJunk = true;
  else if (a === '--csv') ARGS.csv = process.argv[++i];
}

const C = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  err: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/* ────────────────────────────── taxonomy ────────────────────────────── */

/**
 * The storefront tree. `fromCateg` maps Odoo's internal `product.category`
 * ids onto a public category; it is authoritative and always wins over the
 * name-based classifier.
 */
const TAXONOMY = [
  { slug: 'roasted-coffee',     en: 'Roasted Coffee',             ar: 'قهوة محمصة',        seq: 10, featured: true,  fromCateg: [57] },
  { slug: 'green-beans',        en: 'Green Beans',                ar: 'بن أخضر',           seq: 20, featured: true,  fromCateg: [66] },
  { slug: 'espresso-machines',  en: 'Espresso Machines',          ar: 'ماكينات ومعدات',    seq: 30, featured: true,  fromCateg: [72] },
  { slug: 'brewing-tools',      en: 'Brewing Tools',              ar: 'أدوات التحضير',     seq: 40, featured: true,  fromCateg: [58] },
  { slug: 'cups',               en: 'Cups & Glassware',           ar: 'أكواب وكاسات',      seq: 50, featured: true,  fromCateg: [59] },
  { slug: 'spare-parts',        en: 'Spare Parts & Accessories',  ar: 'قطع غيار وملحقات',  seq: 60, featured: false },
  { slug: 'drinks',             en: 'Drinks',                     ar: 'مشروبات',           seq: 70, featured: true,  fromCateg: [61, 62, 63] },
  { slug: 'desserts',           en: 'Desserts & Food',            ar: 'حلويات وأطعمة',     seq: 80, featured: true,  fromCateg: [65] },
  { slug: 'merchandise',        en: 'Merchandise',                ar: 'منتجات المتجر',     seq: 90, featured: true,  fromCateg: [56] },
  { slug: 'packaging',          en: 'Packaging',                  ar: 'تغليف',             seq: 100, featured: false, fromCateg: [60] },
  { slug: 'services',           en: 'Services',                   ar: 'خدمات',             seq: 110, featured: false, fromCateg: [3, 4, 64, 68, 69, 70, 71, 73] },
];

/**
 * Internal categories whose members are invoicing lines rather than
 * merchandise: shipping, delivery, booking/event charges, expense
 * adjustments. They stay in the catalogue (the shop really does sell
 * installation and training) but belong under "Services", never under a
 * product category.
 */
const NON_MERCHANDISE_CATEG = new Set([3, 4, 64, 68, 69, 70, 71, 73]);

const CATEG_TO_SLUG = new Map();
for (const t of TAXONOMY) for (const id of t.fromCateg || []) CATEG_TO_SLUG.set(id, t.slug);


/**
 * Name classifier. Order is significant: the first match wins.
 *
 * Two lessons are baked into these patterns:
 *   1. `word(s)?` is wrong in JS — `brushes?` means "brushe" + optional "s",
 *      so it never matches "brush". Always write `brush(es)?`, `box(es)?`.
 *   2. A trailing `\b` after an alternative that ends in a digit never matches
 *      ("INV-2025" stops mid-number). Keep boundaries inside the alternative.
 */
const RULES = [
  // raw coffee
  [/\b(green\s*(bean|coffee)s?|unroasted|raw\s*(bean|coffee))\b/i, 'green-beans'],

  // machines — the generic noun comes before spare parts so "Ice Machine"
  // is not mistaken for a part, and before the "espresso" coffee rule
  [/\b(espresso|coffee|ice|grinding|proofing)\s*machine\b|\bice\s*maker\b|\bmachine\b/i, 'espresso-machines'],

  // grinders (this catalogue is grinder-heavy, and the brands are distinctive)
  [/\bgrinders?\b/i, 'brewing-tools'],
  [/\b(anfim|baratza|eureka|ceado|mahlk(ö|o)nig|mazzer|compak|fiorenzato|niche|comandante|1zpresso|lagom|option-?o|df64|ek\s*43|vario|sette|forte|encore|atom|mignon|specialita|kony|robur|mythos|ditting|rev\s*steel)\b/i, 'brewing-tools'],

  // kettles / scales
  [/\b(kettles?|gooseneck|stagg|brewista|buono)\b/i, 'brewing-tools'],
  [/\b(scales?|acaia|lunar|pearl|orion|black\s*mirror)\b/i, 'brewing-tools'],

  // brewers before cups: "Chemex 6 Cup Coffeemaker" is a brewer, not a cup,
  // and "Toddy Cold Brew System With Lid" is a brewer, not packaging
  [/\b(chemex|v60|kalita|origami|aeropress|french\s*press|coffee\s*maker|coffeemaker|drip\s*maker|cold\s*drip\s*maker|brewers?|brewing\s*system|toddy)\b/i, 'brewing-tools'],

  // cups & glassware
  [/\b(cups?|mugs?|saucers?|glass(es)?|tumblers?|acme|loveramics)\b/i, 'cups'],

  // spare parts — narrow part nouns, checked before brand names so that
  // "Cafelat Simonelli Gasket" is a gasket, not a machine
  [/\b(gaskets?|o-?rings?|seals?|valves?|solenoids?|boilers?|elements?|thermostats?|thermometers?|probes?|sensors?|transducers?|pumps?|hoses?|pipes?|tubes?|fittings?|connectors?|regulators?|impellers?|flow\s*meters?|flowmeter|shafts?|springs?|screws?|nuts?|bolts?|bearings?|brackets?|screens?|shower\s*screen|jets?|gigle?urs?|wands?|knobs?|panels?|boards?|displays?|harness|cylinders?|tanks?|trays?|plugs?|kits?|installation|spares?)\b/i, 'spare-parts'],
  [/\b(f\.\d|p\d{4}|rb\s*b\.\d)/i, 'spare-parts'],

  // machine brands (after spare parts)
  [/\b(la\s*marzocco|lamarzocco|marzocco|victoria\s*arduino|rocket|profitec|ecm|lelit|gaggia|rancilio|rancillio|simonelli|bezzera|slayer|synesso|sanremo|faema|expobar|ascaso|delonghi|de'?longhi|jura|brema|scotsman|blupura|marco|orchestrale|wpm|diletta|breville|sage|casadio|wega|astoria|grimac|promac|sphera|black\s*eagle|linea\s*mini|lineamini|gs3)\b/i, 'espresso-machines'],
  [/\b\d\s*gr\b/i, 'espresso-machines'],

  // packaging & disposables
  [/\b(lids?|sleeves?|stirrers?|straws?|napkins?|wraps?|bags?|pouches?|box(es)?|cartons?|labels?|stickers?|packaging|film)\b/i, 'packaging'],

  // merchandise
  [/\b(shirts?|caps?|aprons?|towels?|cloths?|badges?|magnets?|merch(andise)?)\b/i, 'merchandise'],

  // food
  [/\b(cakes?|cookies?|croissants?|brownies?|muffins?|pastr(y|ies)|tarts?|desserts?|sandwich(es)?|salads?|donuts?)\b/i, 'desserts'],

  // brewing tools, brewers and cleaning
  [/\b(tampers?|levelers?|distribut(er|or)s?|wdt|portafilters?|baskets?|pitchers?|jugs?|drippers?|brewers?|syphons?|siphons?|v60|chemex|kalita|origami|aeropress|french\s*press|moka|servers?|decanters?|reservoir|brush(es)?|cleaners?|cafetto|catetto|descalers?|mats?|bins?|knock\s*box|tamp\s*station|filters?|xbloom|tricolate|blutron|ecosoft)\b/i, 'brewing-tools'],

  // drinks & ingredients
  [/\b(syrups?|sauces?|powders?|chocolate|matcha|teas?|juice|soda|tonic)\b/i, 'drinks'],

  // generic coffee last — origins, blends, "espresso" as a bean product
  [/\b(ethiopia|yirgacheffe|sidamo|guji|harrar|limu|kenya|colombia|brazil|panama|geisha|gesha|guatemala|costa\s*rica|honduras|rwanda|burundi|yemen|sumatra|indonesia|peru|bolivia|mexico|salvador|nicaragua|india|tanzania|malawi|zambia|uganda|blends?|decaf|single\s*origin|microlot|micro-?lot|bourbon|pacamara|caturra|heirloom|sl28)\b/i, 'roasted-coffee'],
  [/\b(roasted|beans?|espresso)\b/i, 'roasted-coffee'],
];

/**
 * Invoicing lines: installation, maintenance, delivery, fees, event booths.
 * These are sold, so they stay published — but they are services, not goods.
 */
const SERVICE = /\b(services?|delivery|shipp\w*|surcharge|discount|redemption|coupon|fees?|training|booth|participation|check\s*-?\s*up|pull\s*-?\s*out|maintenance|printing|woc|rental|subscription|gift\s*card|top-?up|down\s*payment|sales\s*via|installation\s*service)\b/i;

/** Demo / test records and accounting artefacts — never merchandise. */
const JUNK = /^(zz\b|test\b|check\b|checup\b)|(doc\s*example|account\s*difference|sample\s*product|test\s*product)|\binv[-\s]?\d/i;

/**
 * Internal categories that are too coarse to be trusted. "Merchandize" holds
 * branded coffee cups alongside cloths and badges, so the name classifier
 * knows better; it is used only as a fallback.
 */
const WEAK_CATEG = new Set([56]);

function isService(name) {
  return SERVICE.test(name);
}

/** Product-only classification, ignoring the service/junk rules. */
function classifyProduct(name) {
  for (const [re, slug] of RULES) if (re.test(name)) return slug;
  return null;
}

/**
 * Full decision for one product.
 *
 * The internal category is normally authoritative — otherwise every Ethiopian
 * lot filed under "Green Beans" would be re-labelled "Roasted Coffee" by the
 * origin rule. Two exceptions:
 *   - non-merchandise buckets (expenses / shipping) also contain real
 *     merchandise filed in the wrong place, e.g. the Cafetto descalers;
 *   - "Merchandize" is too coarse to trust.
 * For both, the name rules win and the category is only a fallback.
 */
function classify(name, categId) {
  const byName = classifyProduct(name);
  const categSlug = CATEG_TO_SLUG.get(categId) || null;
  if (categSlug === 'services') return byName || 'services';
  if (WEAK_CATEG.has(categId)) return byName || categSlug;
  if (categSlug) return categSlug;
  if (isService(name)) return 'services';
  return byName;
}

/* ─────────────────────────────── odoo ──────────────────────────────── */

let cookie = '';

async function rpc(model, method, args, kwargs = {}) {
  const r = await fetch(`${ODOO}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs } }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.data?.message || d.error.message);
  return d.result;
}

async function login() {
  const r = await fetch(`${ODOO}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: LOGIN, password: PASSWORD } }),
  });
  const d = await r.json();
  if (!d.result?.uid) throw new Error('Odoo authentication failed');
  cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  return d.result.uid;
}

const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

/* ─────────────────────────────── main ──────────────────────────────── */

async function main() {
  console.log(`\n${C.bold('Selection — seed storefront categories')}`);
  console.log(C.dim(`  ${ODOO}\n`));

  const uid = await login();
  console.log(`  authenticated as uid ${uid}${ARGS.apply ? C.warn('  (APPLY)') : C.dim('  (dry run)')}\n`);

  const products = await rpc('product.template', 'search_read', [
    [['sale_ok', '=', true], ['active', '=', true]],
    ['name', 'categ_id', 'public_categ_ids', 'selection_store_enabled'],
  ]);
  console.log(`  sellable + active products: ${products.length}\n`);

  // ── decide a target for every product ──
  const assignment = new Map(); // slug -> [ids]
  const unclassified = [];
  const junk = [];
  const services = [];
  const rows = [];

  for (const p of products) {
    const name = String(p.name || '').replace(/\s+/g, ' ').trim();
    const categId = p.categ_id ? p.categ_id[0] : null;
    const categName = p.categ_id ? p.categ_id[1] : '';

    if (JUNK.test(name)) {
      junk.push({ ...p, name });
      rows.push([p.id, name, categName, '— junk —']);
      continue;
    }

    const slug = classify(name, categId);
    if (!slug) {
      unclassified.push({ ...p, name });
      rows.push([p.id, name, categName, '— UNCLASSIFIED —']);
      continue;
    }
    if (slug === 'services') services.push({ ...p, name });

    rows.push([p.id, name, categName, slug]);
    if (!assignment.has(slug)) assignment.set(slug, []);
    assignment.get(slug).push(p.id);
  }

  // ── report ──
  console.log(C.bold('  distribution'));
  const bySlug = new Map(TAXONOMY.map((t) => [t.slug, t]));
  for (const [slug, ids] of [...assignment.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const t = bySlug.get(slug);
    console.log(`   ${String(ids.length).padStart(4)}  ${t.en.padEnd(28)} ${C.dim(t.ar)}  ${C.dim('/' + slug)}`);
  }
  console.log(`   ${String(unclassified.length).padStart(4)}  ${C.warn('unclassified')}`);
  console.log(`   ${String(junk.length).padStart(4)}  ${C.warn('junk / demo records')}`);

  if (unclassified.length) {
    console.log(`\n${C.bold('  unclassified — no rule matched, left out of the tabs')}`);
    unclassified.slice(0, 60).forEach((p) => console.log('    ' + p.name.slice(0, 70)));
    if (unclassified.length > 60) console.log(C.dim(`    … and ${unclassified.length - 60} more`));
  }
  if (services.length) {
    console.log(`\n${C.bold('  services (published, filed under /services)')}`);
    services.slice(0, 40).forEach((p) => console.log('    ' + p.name.slice(0, 60)));
    if (services.length > 40) console.log(C.dim(`    … and ${services.length - 40} more`));
  }
  if (junk.length) {
    console.log(`\n${C.bold('  junk / demo records — recommend archiving')}`);
    junk.forEach((p) => console.log('    [' + p.id + '] ' + p.name.slice(0, 60)));
  }
  if (ARGS.verbose) {
    console.log(`\n${C.bold('  every assignment')}`);
    rows.forEach((r) => console.log(`    ${String(r[0]).padStart(5)}  ${r[3].padEnd(22)} ${r[1].slice(0, 55)}`));
  }

  fs.writeFileSync(path.resolve(ARGS.csv), 'id,name,odoo_category,public_category\n' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
  console.log(C.dim(`\n  review file: ${ARGS.csv}`));

  if (!ARGS.apply) {
    console.log(`\n${C.warn('  dry run — nothing written.')} Re-run with ${C.bold('--apply')} to write.\n`);
    return;
  }

  /* ── 1. make sure the public categories exist ── */
  console.log(`\n${C.bold('  categories')}`);
  const existing = await rpc('product.public.category', 'search_read', [[], ['id', 'name', 'selection_slug']]);
  const bySlugExisting = new Map(existing.filter((c) => c.selection_slug).map((c) => [c.selection_slug, c]));
  const categIdBySlug = new Map();

  for (const t of TAXONOMY) {
    const found = bySlugExisting.get(t.slug);
    if (found) {
      await rpc('product.public.category', 'write', [[found.id], {
        name: t.en, selection_name_en: t.en, selection_name_ar: t.ar,
        selection_featured: t.featured, sequence: t.seq,
      }]);
      categIdBySlug.set(t.slug, found.id);
      console.log(`   ${C.dim('updated')} ${t.slug} (id ${found.id})`);
    } else {
      const id = await rpc('product.public.category', 'create', [{
        name: t.en, selection_slug: t.slug, selection_name_en: t.en,
        selection_name_ar: t.ar, selection_featured: t.featured, sequence: t.seq,
      }]);
      categIdBySlug.set(t.slug, id);
      console.log(`   ${C.ok('created')} ${t.slug} (id ${id})`);
    }
  }

  /* ── 2. link products, one batched write per category ── */
  console.log(`\n${C.bold('  linking products')}`);
  let linked = 0;
  for (const [slug, ids] of assignment) {
    const catId = categIdBySlug.get(slug);
    if (!catId) continue;
    for (const batch of chunk(ids, 80)) {
      // (6, 0, [id]) = replace the whole m2m with this single category.
      // The third element of command 6 must be a list — passing a bare int
      // fails server-side with "'int' object is not iterable".
      await rpc('product.template', 'write', [batch, { public_categ_ids: [[6, 0, [catId]]] }]);
      linked += batch.length;
    }
    console.log(`   ${String(ids.length).padStart(4)} → ${slug}`);
  }
  console.log(`   ${C.ok(linked + ' products linked')}`);

  /* ── 3. archive demo / test records ── */
  if (ARGS.archiveJunk && junk.length) {
    const ids = junk.map((p) => p.id);
    for (const batch of chunk(ids, 80)) {
      await rpc('product.template', 'write', [batch, { active: false }]);
    }
    console.log(`\n   ${C.ok('archived ' + ids.length + ' demo/test records')} ${C.dim('(active = false, reversible)')}`);
  }

  /* ── 4. drop the demo categories ── */
  if (ARGS.pruneLegacy) {
    const legacy = existing.filter((c) => !c.selection_slug || !TAXONOMY.some((t) => t.slug === c.selection_slug));
    for (const c of legacy) {
      const used = await rpc('product.template', 'search_count', [[['public_categ_ids', 'in', [c.id]]]]);
      if (used) {
        console.log(`   ${C.warn('kept')} "${c.name}" — still used by ${used} product(s)`);
        continue;
      }
      await rpc('product.public.category', 'unlink', [[c.id]]);
      console.log(`   ${C.ok('deleted')} demo category "${c.name}"`);
    }
  }

  /* ── 5. verify through the public API ── */
  const api = await (await fetch(`${ODOO}/api/categories?lang=en`)).json();
  console.log(`\n${C.bold('  verification')}`);
  console.log(`   /api/categories now returns ${(api.data || []).length} categories`);
  for (const c of api.data || []) {
    const q = await (await fetch(`${ODOO}/api/products?lang=en&limit=1&category=${c.slug}`)).json();
    console.log(`     ${String(q.meta?.total ?? 0).padStart(4)}  ${c.slug}`);
  }
  console.log();
}

main().catch((e) => {
  console.error(`\n${C.err('failed:')} ${e.message}\n`);
  process.exit(1);
});
