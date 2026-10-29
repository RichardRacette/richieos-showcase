// Picture delivery for this synthetic demonstration: one independent 3:4 image per page, in several widths.
// Pure functions so they run under node:test; app.mjs does the DOM work.

// "assets/pages/demo-01", [540,810,1086], "webp" -> srcset string
export const srcsetFor = ({ base, widths, ext }) => widths.map(w => `./${base}-${w}.${ext} ${w}w`).join(', ');
export const defaultSrc = ({ base, widths, ext }) => `./${base}-${widths[Math.floor(widths.length / 2)]}.${ext}`;

// Attributes (as a string) for a story page or shelf cover. `priority` images get a real src and load first. Every other page is
// DEFERRED: it carries data-src/data-srcset only (native lazy loading still fetches pages a few screens away, and here every page is
// exactly one screen apart), and the reader calls applyDeferred() for the current, next and previous page only. Opening a book
// therefore transfers the current picture and one neighbour, not all six (quality gate: investigate initial transfer above 3 MB).
export function imageAttributes(image, { priority = false, sizes = '(min-width: 800px) 440px, 92vw' } = {}) {
  const common = `sizes="${sizes}" width="${image.width}" height="${image.height}" decoding="async"`;
  return priority
    ? `src="${defaultSrc(image)}" srcset="${srcsetFor(image)}" ${common} fetchpriority="high"`
    : `data-src="${defaultSrc(image)}" data-srcset="${srcsetFor(image)}" ${common} fetchpriority="low"`;
}
// Turns a deferred <img> into a loading one (idempotent). Takes anything with dataset/getAttribute/srcset/src, so it runs under node:test.
export function applyDeferred(img) {
  if (!img || !img.dataset || !img.dataset.src || img.getAttribute('src')) return false;
  img.srcset = img.dataset.srcset; img.src = img.dataset.src;
  return true;
}

// Retry policy for a failed or slow picture: three tries with growing waits, each with a cache-busting query.
export const RETRY_DELAYS = [700, 2000, 5000];
export const retryUrl = (url, attempt) => `${url.split('?')[0]}?retry=${attempt}`;
export const nextRetryDelay = attempt => (attempt >= 0 && attempt < RETRY_DELAYS.length ? RETRY_DELAYS[attempt] : null);

// Which pages to warm up around the current one (current page first, then the next, then the previous).
export const preloadOrder = (current, count) => [current, current + 1, current - 1].filter(i => i >= 0 && i < count);
