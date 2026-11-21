import { defineMiddleware } from 'astro:middleware';
import { sampleBarFor, type SampleBarEntry } from './data/samples';
import barCss from './styles/sample-bar.css?raw';

/** Paths that hold fictional samples rather than the team site. */
const samplePrefixes = ['/lp/', '/demo/'];

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char);

/**
 * Renders the bar that marks a page as a fictional sample.
 *
 * @param entry - What the bar says for this sample.
 * @returns The bar's HTML.
 */
function renderBar(entry: SampleBarEntry): string {
  const name = escapeHtml(entry.name);
  const links = [
    entry.explainHref && `<a href="${escapeHtml(entry.explainHref)}">解説を見る</a>`,
    '<a href="/">michixsa のトップへ戻る</a>',
    // data-act is what the demo's own click handler listens for.
    entry.reset &&
      '<button type="button" data-act="reset"><span class="mx-sample-bar__long">最初の状態に戻す</span><span class="mx-sample-bar__short">最初に戻す</span></button>',
  ].filter(Boolean);
  return [
    '<div class="mx-sample-bar" role="note">',
    '<p class="mx-sample-bar__main">',
    '<span class="mx-sample-bar__badge">架空のサンプル</span>',
    `<span class="mx-sample-bar__long">「${name}」は実在しません。${escapeHtml(entry.note)}</span>`,
    `<span class="mx-sample-bar__short">実在しません。${escapeHtml(entry.shortNote)}</span>`,
    '</p>',
    `<p class="mx-sample-bar__links">${links.join('')}</p>`,
    '</div>',
  ].join('');
}

/**
 * Puts the sample bar at the top of every sample page, so a new sample gets
 * it without its author doing anything beyond adding an entry to
 * `src/data/samples.ts`. Runs at build time for the static pages.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const { pathname } = context.url;
  if (!samplePrefixes.some((prefix) => pathname.startsWith(prefix))) return response;
  if (!response.headers.get('content-type')?.includes('text/html')) return response;

  const bar = renderBar(sampleBarFor(pathname));
  const html = (await response.text())
    .replace('</head>', `<style>${barCss}</style></head>`)
    // After a leading skip link, so it stays the first thing a keyboard reaches.
    .replace(/<body[^>]*>(\s*<a class="skip"[^>]*>.*?<\/a>)?/s, (opening) => `${opening}${bar}`);
  return new Response(html, { status: response.status, headers: response.headers });
});
