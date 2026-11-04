#!/usr/bin/env node
/**
 * Bulk product-image importer for the Selection storefront.
 *
 * Writes images straight into Odoo via JSON-RPC, because the REST addon has no
 * image-write path at all:
 *   - POST /api/upload              -> 404 (endpoint does not exist)
 *   - PUT  /api/products/{id}       -> 200 but silently drops image fields
 *   - product.template.image_1920   -> writable via /web/dataset/call_kw  ✅
 *
 * Matching order (unless an explicit manifest is supplied):
 *   1. exact SKU  (product.template.default_code)
 *   2. exact normalised name
 *   3. token-overlap score >= --threshold
 * Anything below the threshold is reported, never guessed.
 *
 * Usage
 *   node scripts/import-product-images.mjs --dir ./product-images            # dry run (default)
 *   node scripts/import-product-images.mjs --dir ./product-images --apply    # actually write
 *   node scripts/import-product-images.mjs --write-manifest                  # emit CSV to fill in
 *   node scripts/import-product-images.mjs --manifest ./images.csv --apply   # explicit mapping
 *
 * Options
 *   --dir <path>        folder of images            (default ./product-images)
 *   --manifest <path>   CSV: file,sku,product_name  (overrides auto-matching)
 *   --apply             write to Odoo               (default is dry run)
 *   --overwrite         replace images that already exist (default: skip them)
 *   --gallery           also create product.image rows from suffixed files (foo-2.jpg)
 *   --threshold <0..1>  auto-match cut-off          (default 0.72)
 *   --limit <n>         stop after n writes
 *   --report <path>     JSON report output          (default ./image-import-report.json)
 *
 * Credentials (env, falls back to the staging defaults used by the test suite)
 *   ODOO_URL, ODOO_DB, ODOO_LOGIN, ODOO_PASSWORD
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { odooConfig } from './odoo-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────── args ───────────────────────────────
function parseArgs(argv) {
  const out = {
    dir: './product-images', manifest: null, apply: false, overwrite: false,
    gallery: false, threshold: 0.72, limit: Infinity,
    report: './image-import-report.json', writeManifest: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--dir': out.dir = argv[++i]; break;
      case '--manifest': out.manifest = argv[++i]; break;
      case '--apply': out.apply = true; break;
      case '--overwrite': out.overwrite = true; break;
      case '--gallery': out.gallery = true; break;
      case '--threshold': out.threshold = Number(argv[++i]); break;
      case '--limit': out.limit = Number(argv[++i]); break;
      case '--report': out.report = argv[++i]; break;
      case '--write-manifest': out.writeManifest = true; break;
      case '--help': case '-h': out.help = true; break;
      default:
        if (a.startsWith('--')) { console.error(`Unknown flag: ${a}`); process.exit(2); }
    }
  }
  return out;
}
const ARGS = parseArgs(process.argv.slice(2));

if (ARGS.help) {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace(/^#!.*\n/, ''));
  process.exit(0);
}

const { url: BASE, db: DB, login: LOGIN, password: PASSWORD } = odooConfig();

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.avif']);
const MAX_BYTES = 8 * 1024 * 1024; // Odoo will downscale to 1920px anyway

// ─────────────────────────────── rpc ────────────────────────────────
let cookie = '';

async function authenticate() {
  const r = await fetch(`${BASE}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: LOGIN, password: PASSWORD } }),
  });
  const setCookie = r.headers.getSetCookie?.() || [];
  cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const d = await r.json();
  if (d.error) throw new Error(`Odoo auth failed: ${d.error.data?.message || 'unknown'}`);
  if (!d.result?.uid) throw new Error('Odoo auth failed: no uid returned (check DB name / credentials)');
  return d.result.uid;
}

async function call(model, method, args, kwargs = {}) {
  const r = await fetch(`${BASE}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { model, method, args, kwargs } }),
  });
  const d = await r.json();
  if (d.error) {
    const msg = d.error.data?.message || JSON.stringify(d.error).slice(0, 300);
    throw new Error(`${model}.${method}: ${msg}`);
  }
  return d.result;
}

// ─────────────────────────── normalisation ──────────────────────────
const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function norm(s) {
  return stripAccents(String(s || ''))
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const skuKey = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

function tokens(s) {
  return new Set(norm(s).split(' ').filter((w) => w.length > 1 && !STOP.has(w)));
}
const STOP = new Set(['the', 'and', 'of', 'for', 'with', 'pc', 'pcs', 'pack', 'copy', 'new']);

function score(fileStem, productName) {
  const a = tokens(fileStem), b = tokens(productName);
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const jaccard = inter / (a.size + b.size - inter);
  // reward a filename that fully appears inside the product name
  const contained = inter === a.size ? 1 : 0;
  return Math.min(1, jaccard * 0.75 + contained * 0.35);
}

/** Split "anfim-alba-2.jpg" into base "anfim alba" + gallery index 2. */
function splitGalleryIndex(stem) {
  const m = stem.match(/^(.*?)[\s_-]+(?:img|image|photo)?[\s_-]*(\d{1,2})$/i);
  if (!m) return { base: stem, index: 1 };
  return { base: m[1], index: Number(m[2]) };
}

// ───────────────────────────── csv utils ────────────────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ────────────────────────────── main ────────────────────────────────
const stats = { matched: 0, ambiguous: 0, unmatched: 0, skippedExisting: 0, written: 0, failed: 0, galleryWritten: 0 };
const plan = [];

async function main() {
  console.log(`\nSelection · product image importer`);
  console.log(`  Odoo   ${BASE}`);
  console.log(`  DB     ${DB}`);
  console.log(`  mode   ${ARGS.apply ? '\x1b[31mAPPLY (writes to Odoo)\x1b[0m' : 'dry run (no writes)'}\n`);

  const uid = await authenticate();
  console.log(`  authenticated as uid=${uid}\n`);

  // ---- catalogue
  const products = await call('product.template', 'search_read', [
    [['sale_ok', '=', true], ['active', '=', true]],
    ['id', 'name', 'default_code', 'categ_id'],
  ]);
  const haveImage = new Set(await call('product.template', 'search', [
    [['sale_ok', '=', true], ['active', '=', true], ['image_1920', '!=', false]],
  ]));
  console.log(`  catalogue: ${products.length} sellable products, ${haveImage.size} already have an image\n`);

  // ---- manifest template mode
  if (ARGS.writeManifest) {
    const out = path.resolve(process.cwd(), 'images-manifest.csv');
    const lines = ['file,sku,product_name'];
    for (const p of products) {
      lines.push([csvEscape(''), csvEscape(p.default_code || ''), csvEscape(p.name)].join(','));
    }
    fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
    console.log(`  wrote manifest template -> ${out}`);
    console.log(`  ${products.length} rows. Fill the "file" column with image filenames, then:`);
    console.log(`    node scripts/import-product-images.mjs --manifest images-manifest.csv --apply\n`);
    return;
  }

  // ---- index products for matching
  const bySku = new Map();
  for (const p of products) {
    const k = skuKey(p.default_code);
    if (k) bySku.set(k, p);
  }

  // ---- resolve work items
  let items = [];

  if (ARGS.manifest) {
    const mp = path.resolve(process.cwd(), ARGS.manifest);
    if (!fs.existsSync(mp)) throw new Error(`Manifest not found: ${mp}`);
    const rows = parseCsv(fs.readFileSync(mp, 'utf8'));
    const header = rows.shift().map((h) => h.trim().toLowerCase());
    const ci = (n) => header.indexOf(n);
    const iFile = ci('file'), iSku = ci('sku'), iName = ci('product_name');
    if (iFile < 0) throw new Error('Manifest must have a "file" column');

    for (const r of rows) {
      const file = (r[iFile] || '').trim();
      if (!file) continue;
      const sku = iSku >= 0 ? (r[iSku] || '').trim() : '';
      const name = iName >= 0 ? (r[iName] || '').trim() : '';
      let product = sku ? bySku.get(skuKey(sku)) : null;
      if (!product && name) {
        product = products.find((p) => norm(p.name) === norm(name)) || null;
      }
      items.push({
        file, product,
        reason: product ? (sku ? 'manifest:sku' : 'manifest:name') : 'manifest:no-match',
        confidence: product ? 1 : 0,
      });
    }
  } else {
    // ---- auto-match from a directory
    const dir = path.resolve(process.cwd(), ARGS.dir);
    if (!fs.existsSync(dir)) {
      console.error(`  \x1b[31mImage directory not found:\x1b[0m ${dir}`);
      console.error(`  Put your product photos there, or generate a manifest to fill in:`);
      console.error(`    node scripts/import-product-images.mjs --write-manifest\n`);
      process.exit(2);
    }
    const files = fs.readdirSync(dir)
      .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
      .sort();

    if (!files.length) {
      console.error(`  \x1b[31mNo image files in ${dir}\x1b[0m (looked for ${[...IMAGE_EXT].join(', ')})\n`);
      process.exit(2);
    }
    console.log(`  found ${files.length} image file(s) in ${dir}\n`);

    for (const file of files) {
      const stem = path.basename(file, path.extname(file));
      const { base, index } = splitGalleryIndex(stem);

      // 1. exact SKU
      let product = bySku.get(skuKey(stem)) || bySku.get(skuKey(base));

      // 2. exact name
      let reason = product ? 'sku' : '';
      if (!product) {
        const target = norm(base);
        const exact = products.filter((p) => norm(p.name) === target);
        if (exact.length === 1) { product = exact[0]; reason = 'exact-name'; }
        else if (exact.length > 1) {
          items.push({ file, product: null, reason: 'ambiguous:exact-name', confidence: 1, candidates: exact.map((p) => p.name) });
          continue;
        }
      }

      // 3. fuzzy
      if (!product) {
        const scored = products
          .map((p) => ({ p, s: score(base, p.name) }))
          .sort((a, b) => b.s - a.s);
        const best = scored[0], second = scored[1];
        if (best && best.s >= ARGS.threshold && (!second || best.s - second.s >= 0.08)) {
          product = best.p; reason = `fuzzy:${best.s.toFixed(2)}`;
        } else if (best && best.s >= ARGS.threshold) {
          items.push({
            file, product: null, reason: `ambiguous:fuzzy(${best.s.toFixed(2)} vs ${second.s.toFixed(2)})`,
            confidence: best.s, candidates: scored.slice(0, 3).map((x) => x.p.name),
          });
          continue;
        } else {
          items.push({ file, product: null, reason: `unmatched:best=${best ? best.s.toFixed(2) : '0'}`, confidence: best?.s || 0, candidates: scored.slice(0, 2).map((x) => x.p.name) });
          continue;
        }
      }

      items.push({ file, product, reason, confidence: reason.startsWith('fuzzy') ? Number(reason.split(':')[1]) : 1, galleryIndex: index });
    }
  }

  // ---- filter + dedupe (first file per product wins as the primary image)
  const seenPrimary = new Map();
  for (const it of items) {
    if (!it.product) { plan.push(it); continue; }
    const isGallery = ARGS.gallery && (it.galleryIndex || 1) > 1;
    if (isGallery) { plan.push(it); continue; }
    if (seenPrimary.has(it.product.id)) {
      plan.push({ ...it, product: null, reason: `duplicate:already-claimed-by-${seenPrimary.get(it.product.id)}` });
      continue;
    }
    seenPrimary.set(it.product.id, it.file);
    if (haveImage.has(it.product.id) && !ARGS.overwrite) {
      plan.push({ ...it, reason: `${it.reason} (already has image, skipped)` });
      stats.skippedExisting++;
      continue;
    }
    plan.push(it);
  }

  // ---- report the plan
  const matched = plan.filter((p) => p.product);
  const problems = plan.filter((p) => !p.product);
  stats.matched = matched.length;
  stats.ambiguous = problems.filter((p) => p.reason.startsWith('ambiguous')).length;
  stats.unmatched = problems.filter((p) => !p.reason.startsWith('ambiguous') && !p.reason.startsWith('duplicate')).length;

  if (matched.length) {
    console.log(`  \x1b[32mmatched (${matched.length})\x1b[0m`);
    for (const m of matched.slice(0, 30)) {
      console.log(`    ${m.file.padEnd(46).slice(0, 46)} → [${m.product.id}] ${m.product.name.slice(0, 52)}  \x1b[90m(${m.reason})\x1b[0m`);
    }
    if (matched.length > 30) console.log(`    … and ${matched.length - 30} more`);
    console.log('');
  }

  if (problems.length) {
    console.log(`  \x1b[33mneeds attention (${problems.length})\x1b[0m`);
    for (const p of problems.slice(0, 30)) {
      console.log(`    ${p.file.padEnd(46).slice(0, 46)} \x1b[33m${p.reason}\x1b[0m`);
      if (p.candidates?.length) console.log(`      \x1b[90mcandidates: ${p.candidates.join(' | ').slice(0, 150)}\x1b[0m`);
    }
    if (problems.length > 30) console.log(`    … and ${problems.length - 30} more`);
    console.log('');
  }

  // ---- apply
  if (ARGS.apply && matched.length) {
    console.log(`  writing ${Math.min(matched.length, ARGS.limit)} image(s)…\n`);
    let n = 0;
    for (const m of matched) {
      if (n >= ARGS.limit) break;
      const filePath = ARGS.manifest
        ? path.resolve(process.cwd(), ARGS.dir, m.file)
        : path.resolve(process.cwd(), ARGS.dir, m.file);
      if (!fs.existsSync(filePath)) { console.log(`    \x1b[31mMISSING FILE\x1b[0m ${m.file}`); stats.failed++; continue; }

      const buf = fs.readFileSync(filePath);
      if (buf.length > MAX_BYTES) {
        console.log(`    \x1b[31mTOO LARGE\x1b[0m ${m.file} (${(buf.length / 1e6).toFixed(1)} MB, limit ${MAX_BYTES / 1e6} MB)`);
        stats.failed++; continue;
      }
      const b64 = buf.toString('base64');

      try {
        if (ARGS.gallery && (m.galleryIndex || 1) > 1) {
          await call('product.image', 'create', [{
            product_tmpl_id: m.product.id,
            name: path.basename(m.file, path.extname(m.file)),
            image_1920: b64,
          }]);
          stats.galleryWritten++;
          console.log(`    \x1b[32m+\x1b[0m gallery  ${m.file} → ${m.product.name.slice(0, 44)}`);
        } else {
          await call('product.template', 'write', [[m.product.id], { image_1920: b64 }]);
          stats.written++;
          console.log(`    \x1b[32m✓\x1b[0m ${m.file} → [${m.product.id}] ${m.product.name.slice(0, 48)}`);
        }
      } catch (e) {
        stats.failed++;
        console.log(`    \x1b[31m✗\x1b[0m ${m.file}: ${e.message.slice(0, 140)}`);
      }
      n++;
    }
    console.log('');
  }

  // ---- verify against the live REST API
  if (ARGS.apply && stats.written) {
    const after = await call('product.template', 'search_count', [
      [['sale_ok', '=', true], ['active', '=', true], ['image_1920', '!=', false]],
    ]);
    console.log(`  verified via Odoo: ${after} sellable products now carry an image\n`);
  }

  // ---- write report
  const report = {
    generatedAt: new Date().toISOString(),
    mode: ARGS.apply ? 'apply' : 'dry-run',
    odoo: BASE,
    catalogue: products.length,
    alreadyHadImage: haveImage.size,
    stats,
    matched: matched.map((m) => ({ file: m.file, id: m.product.id, name: m.product.name, sku: m.product.default_code || null, reason: m.reason })),
    needsAttention: problems.map((p) => ({ file: p.file, reason: p.reason, candidates: p.candidates || [] })),
  };
  const rp = path.resolve(process.cwd(), ARGS.report);
  fs.writeFileSync(rp, JSON.stringify(report, null, 2), 'utf8');

  console.log(`  summary: ${stats.matched} matched · ${stats.ambiguous} ambiguous · ${stats.unmatched} unmatched · ${stats.skippedExisting} skipped (had image) · ${stats.written} written · ${stats.failed} failed`);
  console.log(`  report:  ${rp}\n`);

  if (!ARGS.apply) {
    console.log(`  \x1b[90mDry run — nothing was written. Re-run with --apply to commit.\x1b[0m\n`);
  }
}

main().catch((e) => {
  console.error(`\n\x1b[31m${e.message}\x1b[0m\n`);
  process.exit(1);
});
