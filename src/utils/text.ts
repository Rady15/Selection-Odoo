/**
 * Text sanitising for CMS payloads.
 *
 * The Odoo backend serialises an *empty* CMS field as JSON `false` — not null,
 * not "". `String(false)` is `"false"`, so any `String(value ?? '')` in the
 * transform layer turned every blank field into the literal word "false", which
 * then rendered as visible text on top of the hero image.
 *
 * Rich-text bodies make it worse: they arrive as `<div data-oe-version="1.2">
 * &nbsp;</div>`, which strips down to the literal characters "&nbsp;" because
 * entities are not whitespace.
 *
 * Everything here therefore treats `false`/`null`/`undefined`/empty markup as
 * the empty string, and decodes entities before deciding a value is blank.
 */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  laquo: '\u00ab',
  raquo: '\u00bb',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  middot: '\u00b7',
  times: '\u00d7',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  deg: '\u00b0',
  zwnj: '',
  zwj: '',
  shy: '',
};

/** Strings that mean "no value" when the backend stringifies a boolean. */
const NULLISH_TOKENS = new Set(['false', 'null', 'undefined', 'none', 'nil', 'nan']);

/** Decode HTML entities (`&nbsp;`, `&#39;`, `&#x27;`, …). */
export function decodeEntities(input: string): string {
  if (!input || input.indexOf('&') === -1) return input;
  return input.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (match, code: string) => {
    const key = code.toLowerCase();
    if (key.startsWith('#x')) {
      const n = parseInt(key.slice(2), 16);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    if (key.startsWith('#')) {
      const n = parseInt(key.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    const named = NAMED_ENTITIES[key];
    return named !== undefined ? named : match;
  });
}

/**
 * Coerce any CMS value to a plain string, or `''` when it carries no content.
 *
 * Handles the `false` sentinel, the stringified sentinels, and numbers.
 */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (NULLISH_TOKENS.has(trimmed.toLowerCase())) return '';
  return trimmed;
}

/** True when `cleanText(value)` is empty. */
export function isEmptyText(value: unknown): boolean {
  return cleanText(value) === '';
}

/**
 * Strip markup and entities from a rich-text field.
 *
 * Returns `''` for the `false` sentinel and for markup that contains no
 * readable characters (`<div>&nbsp;</div>`, `<p><br></p>`, …).
 */
export function stripHtml(value: unknown): string {
  const raw = cleanText(value);
  if (!raw) return '';

  const text = decodeEntities(
    raw
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
  )
    // Zero-width and non-breaking spaces become real spaces before collapsing.
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // A body made only of punctuation/separators is still "empty".
  if (!text || !/[\p{L}\p{N}]/u.test(text)) return '';
  return text;
}

/** First candidate that yields readable text, cleaned. */
export function pickText(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const text = stripHtml(candidate);
    if (text) return text;
  }
  return '';
}

/**
 * Normalise a CMS link target.
 *
 * `/shop` is the Odoo default and has no counterpart in this SPA, so it maps to
 * the catalogue. Anything that is not a usable link resolves to `''`.
 */
export function cleanUrl(value: unknown): string {
  const url = cleanText(value);
  if (!url) return '';
  if (url === '/shop' || url === '/shop/') return '/products';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('/') || url.startsWith('#')) return url;
  return url;
}

/**
 * Convert a YouTube/Vimeo page URL into its embeddable form.
 *
 * The CMS stores `https://www.youtube.com/watch?v=ID`, which browsers refuse to
 * render inside an iframe ("YouTube refused to connect"). Returns `''` when the
 * value is not a video URL we can embed.
 */
export function toEmbedUrl(value: unknown): string {
  const url = cleanUrl(value);
  if (!url) return '';

  const youtube =
    url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/i) ||
    url.match(/youtu\.be\/([\w-]{6,})/i) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/i) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/i);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}?rel=0`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d{4,})/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  if (/^https?:\/\/[^/]+\.(mp4|webm|ogg)(\?|$)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url) && /\/embed\//i.test(url)) return url;
  return '';
}
