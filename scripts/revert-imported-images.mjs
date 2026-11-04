#!/usr/bin/env node
/**
 * Undoes scripts/fetch-and-import-images.mjs.
 *
 * Clears product.template.image_1920 only for the products that script wrote
 * to, as recorded in its report. Products that already had a real image (e.g.
 * [2423] Nisnas) are never touched, because they never appear in `credits`.
 *
 * Usage
 *   node scripts/revert-imported-images.mjs --report ./image-import-report.json          # preview
 *   node scripts/revert-imported-images.mjs --report ./image-import-report.json --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { odooConfig } from './odoo-env.mjs';

const ARGS = { report: './image-import-report.json', apply: false, all: false, keep: new Set([2423]) };
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--apply') ARGS.apply = true;
  else if (process.argv[i] === '--report') ARGS.report = process.argv[++i];
  else if (process.argv[i] === '--all') ARGS.all = true;
  else if (process.argv[i] === '--keep') {
    for (const id of String(process.argv[++i]).split(',')) ARGS.keep.add(Number(id.trim()));
  }
}

const { url: ODOO, db: DB, login: LOGIN, password: PASSWORD } = odooConfig();

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
  const rp = path.resolve(ARGS.report);
  let ids = [];

  if (ARGS.all) {
    // Reports get overwritten between runs, so fall back to "everything that
    // isn't protected" — after a full import that is exactly the set we wrote.
    console.log(`\n  --all: clearing every sellable product except ids ${[...ARGS.keep].join(', ')}`);
  } else {
    if (!fs.existsSync(rp)) throw new Error(`Report not found: ${rp} (use --all to ignore the report)`);
    const report = JSON.parse(fs.readFileSync(rp, 'utf8'));
    ids = [...new Set((report.credits || []).map((c) => c.product_id).filter(Boolean))];
    console.log(`\n  report mode: ${report.mode} · generated ${report.generatedAt}`);
    console.log(`  products written by the importer: ${ids.length}\n`);
  }

  if (!ARGS.apply) {
    if (ids.length) {
      console.log('  Dry run. These products would lose their image:');
      for (const c of (JSON.parse(fs.readFileSync(rp, 'utf8')).credits || []).slice(0, 20)) {
        console.log(`    [${c.product_id}] ${c.product_name}`);
      }
    }
    console.log(`\n  Re-run with --apply to clear image_1920.\n`);
    return;
  }

  const auth = await fetch(`${ODOO}/web/session/authenticate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: LOGIN, password: PASSWORD } }),
  });
  cookie = (auth.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  if (!(await auth.json()).result?.uid) throw new Error('Odoo auth failed');

  if (ARGS.all) {
    const keep = [...ARGS.keep];
    ids = await call('product.template', 'search', [
      [['sale_ok', '=', true], ['active', '=', true], ['image_1920', '!=', false], ['id', 'not in', keep]],
    ]);
    console.log(`  ${ids.length} products to clear\n`);
  }

  let done = 0;
  for (const id of ids) {
    try {
      await call('product.template', 'write', [[id], { image_1920: false }]);
      done++;
      if (done % 50 === 0) console.log(`    … ${done}/${ids.length}`);
    } catch (e) {
      console.log(`    \x1b[31m✗\x1b[0m [${id}] ${e.message.slice(0, 90)}`);
    }
  }

  const left = await call('product.template', 'search_count', [
    [['sale_ok', '=', true], ['active', '=', true], ['image_1920', '!=', false]],
  ]);
  console.log(`\n  cleared ${done}/${ids.length} · sellable products with an image now: ${left}\n`);
}

main().catch((e) => { console.error(`\n\x1b[31m${e.message}\x1b[0m\n`); process.exit(1); });
