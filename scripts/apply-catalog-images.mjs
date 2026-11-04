#!/usr/bin/env node
/**
 * Seeds the catalogue with the generated category imagery in ./catalog-images.
 *
 * Why generated images: real product photography isn't available, and stock
 * sources were unusable — Wikimedia Commons returned a book page for an
 * espresso machine and a model railway for a coffee scale (see
 * docs/PRODUCT-IMAGES.md). These are clean, studio-style category shots with no
 * third-party branding, so nothing on the storefront implies a brand
 * affiliation or misrepresents a specific model.
 *
 * Each product gets the image that matches the thing it is (grinder, cup,
 * beans, dessert...), derived from its name, falling back to its category.
 *
 * Usage
 *   node scripts/apply-catalog-images.mjs            # dry run
 *   node scripts/apply-catalog-images.mjs --apply
 *   node scripts/apply-catalog-images.mjs --apply --only Cups
 */
import fs from 'node:fs';
import path from 'node:path';
import { odooConfig } from './odoo-env.mjs';

const ARGS = { apply: false, only: null };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--apply') ARGS.apply = true;
  else if (process.argv[i] === '--only') ARGS.only = process.argv[++i];
}

const { url: ODOO, db: DB, login: LOGIN, password: PASSWORD } = odooConfig();
const IMG_DIR = path.resolve('catalog-images');
const PROTECT_IDS = new Set([2423]); // [2423] Nisnas — genuine photography

// name → image slug. Order matters: specific before generic.
const RULES = [
  [/\b(grinders?|burrs?|anfim|baratza|ek43|comandante|mahlk)/i, 'grinder'],
  [/\b(espresso machines?|black eagle|linea|gb5|sphera)\b/i, 'espresso-machine'],
  [/\b(tampers?|levelers?|distribution tools?)\b/i, 'tamper'],
  [/\b(portafilters?|naked filters?|filter baskets?)\b/i, 'portafilter'],
  [/\b(kettles?|gooseneck)\b/i, 'kettle'],
  [/\b(scales?|acaia|black mirror)\b/i, 'scale'],
  [/\b(drippers?|v60|chemex|kalita|origami|aeropress|french press|moka)\b/i, 'dripper'],
  [/\b(pitchers?|milk jugs?)\b/i, 'milk-pitcher'],
  [/\b(filters?|hardness|descaler|cafetto|blutron|softener)\b/i, 'water-filter'],
  [/\b(servers?|carafes?|decanters?|reservoirs?)\b/i, 'carafe'],
  [/\b(roasters?|roasting)\b/i, 'espresso-machine'],
  [/\blids?\b/i, 'cup-paper'],
  [/\bpaper\s*cups?\b/i, 'cup-paper'],
  [/\bplastic\s*cups?\b/i, 'cup-plastic'],
  [/\b(espresso|latte|cap?puccino)\s*cups?|\b\d+\s*oz\s*cups?/i, 'cup-ceramic'],
  [/\b(glass|glasses)\b/i, 'glass'],
  [/\b(tumblers?|travel mugs?)\b/i, 'cup-paper'],
  [/\b(cups?|mugs?)\b/i, 'cup-ceramic'],
  [/\b(green beans?|green coffee)\b/i, 'beans-green'],
  [/\b(beans?|roasted)\b/i, 'beans-roasted'],
  [/\b(sleeves?|stirrers?|straws?|napkins?)\b/i, 'cup-paper'],
  [/\b(bags?|pouches?|packaging|labels?|stickers?|box(es)?|cartons?|bottles?)\b/i, 'packaging'],
  [/\b(cakes?|cookies?|croissants?|desserts?|brownies?|muffins?|pastry|tarts?)\b/i, 'dessert'],
  [/\b(syrups?|sauces?|powders?|chocolate|matcha)\b/i, 'syrup'],
  [/\b(teas?)\b/i, 'tea'],
  [/\b(sandwich(es)?|wraps?|salads?|food)\b/i, 'sandwich'],
  [/\b(shirts?|aprons?|towels?|cloth|merch)\b/i, 'apron'],
  [/\b(cleaners?|brushes?|brush|mats?|bins?|knock box)\b/i, 'brush'],
];

const CATEGORY_RULES = {
  'roasted coffee': 'beans-roasted',
  'green beans': 'beans-green',
  'brewing tools': 'dripper',
  'cups': 'cup-ceramic',
  'desserts': 'dessert',
  'packaging': 'packaging',
  'drinks': 'cup-ceramic',
  'take-away drinks': 'cup-paper',
  'dine-in drinks': 'cup-ceramic',
  'merchandize': 'apron',
  'commercial espresso machines': 'espresso-machine',
  'saleable': 'grinder',
  'shipping': 'packaging',
  'expenses': 'packaging',
  'booking fees': 'cup-ceramic',
  'events': 'cup-ceramic',
  'deliveries': 'packaging',
  'shipping expenses': 'packaging',
};

function slugFor(name, categName) {
  for (const [re, slug] of RULES) if (re.test(name)) return slug;
  const cat = String(categName || '').toLowerCase();
  for (const [key, slug] of Object.entries(CATEGORY_RULES)) if (cat.includes(key)) return slug;
  // Unmatched items are almost always spare parts and machine accessories, so
  // generic equipment reads better than a cup.
  return 'grinder';
}

let cookie = '';
async function call(model, method, args) {
  const r = await fetch(`${ODOO}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs: {} } }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.data?.message || 'rpc failed');
  return d.result;
}

async function main() {
  if (!fs.existsSync(IMG_DIR)) throw new Error(`Missing ${IMG_DIR}`);

  const available = new Set(
    fs.readdirSync(IMG_DIR).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f)).map((f) => f.replace(/\.\w+$/, '')),
  );
  console.log(`\n  ${available.size} generated images: ${[...available].join(', ')}\n`);

  const auth = await fetch(`${ODOO}/web/session/authenticate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: LOGIN, password: PASSWORD } }),
  });
  cookie = (auth.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  if (!(await auth.json()).result?.uid) throw new Error('Odoo auth failed');

  const products = await call('product.template', 'search_read', [
    [['sale_ok', '=', true], ['active', '=', true]],
    ['id', 'name', 'categ_id'],
  ]);

  let targets = products.filter((p) => !PROTECT_IDS.has(p.id));
  if (ARGS.only) {
    const n = ARGS.only.toLowerCase();
    targets = targets.filter((p) => String(p.categ_id?.[1] || '').toLowerCase().includes(n));
  }

  const bySlug = new Map();
  for (const p of targets) {
    const slug = slugFor(p.name, p.categ_id?.[1]);
    if (!bySlug.has(slug)) bySlug.set(slug, []);
    bySlug.get(slug).push(p);
  }

  console.log('  plan:');
  for (const [slug, list] of [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const ok = available.has(slug) ? '' : '  \x1b[31m(MISSING IMAGE)\x1b[0m';
    console.log(`    ${String(list.length).padStart(4)} products → ${slug}.png${ok}`);
  }

  if (!ARGS.apply) {
    console.log(`\n  Dry run — ${targets.length} products would be updated. Re-run with --apply.\n`);
    return;
  }

  const cache = new Map();
  for (const [slug, list] of bySlug) {
    if (!available.has(slug)) { console.log(`    \x1b[31mskip ${slug}: image missing\x1b[0m`); continue; }
    const file = fs.readdirSync(IMG_DIR).find((f) => f.replace(/\.\w+$/, '') === slug);
    const b64 = fs.readFileSync(path.join(IMG_DIR, file)).toString('base64');
    cache.set(slug, b64);

    let done = 0;
    for (const p of list) {
      try {
        await call('product.template', 'write', [[p.id], { image_1920: b64 }]);
        done++;
      } catch (e) {
        console.log(`      \x1b[31m✗\x1b[0m [${p.id}] ${e.message.slice(0, 80)}`);
      }
    }
    console.log(`    ✓ ${slug}: ${done}/${list.length}`);
  }

  const withImg = await call('product.template', 'search_count', [
    [['sale_ok', '=', true], ['active', '=', true], ['image_1920', '!=', false]],
  ]);
  console.log(`\n  sellable products with an image now: ${withImg}\n`);
}

main().catch((e) => { console.error(`\n\x1b[31m${e.message}\x1b[0m\n`); process.exit(1); });
