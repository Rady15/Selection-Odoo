/**
 * Browser-level check of the storefront catalogue page.
 *
 * Verifies what the user actually sees: how many products render, that the
 * category tabs filter correctly, that the counter matches, and that search
 * narrows the grid. Runs against the Vite dev server (IPv6 loopback).
 *
 * Run: node tests/verify-listing-ui.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.LOCAL_BASE || 'http://[::1]:5199';

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; console.log(`  \x1b[31m✗\x1b[0m ${name} ${detail ? '\x1b[2m' + detail + '\x1b[0m' : ''}`); }
};

// The npm playwright build and the cached browser build can differ; point at
// whichever Chromium is actually present instead of demanding a download.
const CHROME = process.env.CHROME_PATH || [
  `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`,
  `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium_headless_shell-1243\\chrome-headless-shell-win64\\chrome-headless-shell.exe`,
  `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium_headless_shell-1234\\chrome-headless-shell-win64\\chrome-headless-shell.exe`,
].find((p) => { try { return fs.existsSync(p); } catch { return false; } });

const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

console.log('\n\x1b[1mStorefront listing UI verification\x1b[0m');

try {
  await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  // Wait for real product cards — skeletons use animate-pulse, which other
  // parts of the page may keep around, so counting cards is the reliable signal.
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="product-card"]').length >= 12,
    null, { timeout: 45000 }
  );
  await page.waitForTimeout(800);

  const counter = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /Showing|عرض/.test(s.textContent || ''));
    return el?.textContent?.replace(/\s+/g, ' ').trim() || '';
  });
  console.log(`\n  counter: "${counter}"`);

  const total = Number((counter.match(/of\s+(\d+)|من\s+(\d+)/) || []).slice(1).find(Boolean) || 0);
  ok('the page knows about the full catalogue', total > 400, `${total} products`);

  const shown = Number((counter.match(/Showing\s+(\d+)|عرض\s+(\d+)/) || []).slice(1).find(Boolean) || 0);
  ok('first batch is capped for performance', shown > 0 && shown <= 24, `${shown} rendered`);

  const cards = await page.locator('[data-testid="product-card"]').count();
  ok('cards render', cards >= 20, `${cards} cards`);

  const tabs = await page.locator('button:has-text("(")').allInnerTexts().catch(() => []);
  const catTabs = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => /\(\d+\)/.test(b.textContent || ''))
      .map((b) => b.textContent.replace(/\s+/g, ' ').trim())
  );
  ok('category tabs show real counts', catTabs.length >= 10, catTabs.slice(0, 12).join(' | '));

  // ── click a category and check the counter changes to that category size ──
  const target = catTabs.find((t) => /Brewing Tools|أدوات التحضير/.test(t));
  if (target) {
    await page.getByRole('button', { name: target, exact: false }).first().click();
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => {
      const el = [...document.querySelectorAll('span')].find((s) => /Showing|عرض/.test(s.textContent || ''));
      return el?.textContent?.replace(/\s+/g, ' ').trim() || '';
    });
    console.log(`\n  after "Brewing Tools": "${after}"`);
    const n = Number((after.match(/of\s+(\d+)|من\s+(\d+)/) || []).slice(1).find(Boolean) || 0);
    ok('category filter returns products (was 0 before)', n > 50, `${n} products`);

    const emptyState = await page.locator('text=No products matching this filter').count();
    ok('no empty state after filtering', emptyState === 0);

    // load more increases the rendered cards
    const before = await page.locator('[data-testid="product-card"]').count();
    const more = page.getByRole('button', { name: /Load more|عرض المزيد/ });
    if (await more.count()) {
      await more.first().click();
      await page.waitForTimeout(700);
      const afterCards = await page.locator('[data-testid="product-card"]').count();
      ok('load more appends cards', afterCards > before, `${before} → ${afterCards}`);
    } else {
      ok('load more button present', false, 'not found');
    }
  } else {
    ok('brewing tools tab found', false);
  }

  // ── search narrows results ──
  await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"], input[placeholder*="تصفية"]').first();
  await input.fill('grinder');
  await page.waitForTimeout(900);
  const searchCounter = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /Showing|عرض/.test(s.textContent || ''));
    return el?.textContent?.replace(/\s+/g, ' ').trim() || '';
  });
  console.log(`\n  after search "grinder": "${searchCounter}"`);
  const n = Number((searchCounter.match(/of\s+(\d+)|من\s+(\d+)/) || []).slice(1).find(Boolean) || 0);
  ok('search narrows the grid', n > 0 && n < 200, `${n} results`);

  // ── price slider uses the catalogue's real bounds and actually filters ──
  await page.goto(`${BASE}/products`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => document.querySelectorAll('[data-testid="product-card"]').length >= 12,
    null, { timeout: 45000 }
  );
  await page.waitForTimeout(600);

  const slider = page.locator('input[type="range"]').first();
  const min = Number(await slider.getAttribute('min'));
  const max = Number(await slider.getAttribute('max'));
  ok('price slider is not the old hardcoded 30–1000', !(min === 30 && max === 1000), `min=${min} max=${max}`);
  ok('price slider bounds are sane', max > min && min >= 0, `min=${min} max=${max}`);

  const totalBefore = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /Showing|عرض/.test(s.textContent || ''));
    return Number((el?.textContent || '').match(/of\s+(\d+)|من\s+(\d+)/)?.slice(1).find(Boolean) || 0);
  });
  await slider.fill(String(Math.round(min + (max - min) * 0.35)));
  await page.waitForTimeout(600);
  const totalAfter = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /Showing|عرض/.test(s.textContent || ''));
    return Number((el?.textContent || '').match(/of\s+(\d+)|من\s+(\d+)/)?.slice(1).find(Boolean) || 0);
  });
  ok('price filter narrows the catalogue', totalAfter > 0 && totalAfter < totalBefore, `${totalBefore} → ${totalAfter}`);

  ok('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' | '));

  await page.screenshot({ path: 'tests/.listing.png', fullPage: false });
} finally {
  await browser.close();
}

console.log(`\n  ${fail === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}  ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
