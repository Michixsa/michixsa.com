/**
 * What the sample bar says on each fictional sample. `src/middleware.ts` puts
 * the bar at the top of every page under `/lp/` and `/demo/`, so a new sample
 * only needs an entry here; the build fails until it has one.
 */
export type SampleBarEntry = {
  /** URL prefix the entry covers. The longest matching prefix wins. */
  prefix: string;
  /** Fictional name, shown as 「name」は実在しません。 */
  name: string;
  /** What else visitors should know, shown on wide screens. */
  note: string;
  /** The same, short enough for a phone. */
  shortNote: string;
  /** Explanation page, when the sample has one. */
  explainHref?: string;
  /** Adds the demo's 最初の状態に戻す button, handled by the demo's own script. */
  reset?: boolean;
};

export const sampleBarEntries: readonly SampleBarEntry[] = [
  {
    prefix: '/lp/cafe/',
    name: '珈琲 ゆうまど',
    note: '写真は AI で生成した画像です。',
    shortNote: '写真はAI生成です。',
    explainHref: '/works/sample-cafe-lp/',
  },
  {
    prefix: '/lp/kodachi/',
    name: '木立造園',
    note: '写真は AI で生成した画像です。',
    shortNote: '写真はAI生成です。',
    explainHref: '/works/sample-kodachi/',
  },
  {
    prefix: '/lp/kodachi/legacy/',
    name: '木立造園',
    note: '作り直す前を想定して再現した、古いページです。',
    shortNote: '再現した旧ページ。',
    explainHref: '/works/sample-kodachi/',
  },
  {
    prefix: '/lp/hinata/',
    name: 'ひなた堂印刷',
    note: '写真は AI で生成した画像です。',
    shortNote: '写真はAI生成です。',
  },
  {
    prefix: '/lp/musubi/',
    name: '保護猫カフェ むすび',
    note: '猫の写真は無料素材です。',
    shortNote: '写真は無料素材です。',
    explainHref: '/works/sample-musubi/',
  },
  {
    prefix: '/demo/mizukane/',
    name: 'みずかね設備',
    note: '入力はこの端末のブラウザにだけ保存されます。',
    shortNote: '入力は端末に保存。',
    explainHref: '/works/sample-mizukane/',
    reset: true,
  },
];

/**
 * Finds the bar entry for a sample page.
 *
 * @param pathname - The page's URL path.
 * @returns The entry with the longest matching prefix.
 * @throws When no entry covers the page, so a new sample cannot ship without its bar.
 * @example sampleBarFor('/lp/kodachi/legacy/price/').note // "作り直す前を想定して…"
 */
export function sampleBarFor(pathname: string): SampleBarEntry {
  const entry = sampleBarEntries
    .filter((candidate) => pathname.startsWith(candidate.prefix))
    .toSorted((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!entry) {
    throw new Error(`No sample bar entry covers ${pathname}; add one to src/data/samples.ts`);
  }
  return entry;
}
