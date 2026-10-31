import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

/** Site-wide strings used by the portfolio layout and pages. */
export const site = {
  name: 'asktt1770',
  title: 'asktt1770 | インフラ設計・構築と業務自動化',
  description:
    'フリーランスのインフラエンジニア asktt1770 のポートフォリオ。監視基盤の設計・構築、無停止での移行、Ansible / NixOS による構築自動化の実績と、制作サンプルを掲載しています。',
} as const;

/** Japanese labels for each `kind`, shown as badges. */
export const kindLabels: Record<CollectionEntry<'works'>['data']['kind'], string> = {
  client: '受託実績',
  employment: '会社員時代の業務',
  personal: '個人開発',
  sample: '架空のサンプル',
};

/** A status badge as shown on cards and case studies. */
export interface WorkBadge {
  label: string;
  tone: 'active' | 'completed' | 'sample';
}

/**
 * Derives the status badge from a work's frontmatter, so it never has to be
 * written by hand. Samples always read as fictional, whatever else is set.
 *
 * @param data - The work's validated frontmatter.
 * @returns The badge label and its colour tone.
 * @example
 * badgeFor({ kind: 'personal', status: 'active' }); // { label: '稼働中', tone: 'active' }
 */
export function badgeFor(
  data: Pick<CollectionEntry<'works'>['data'], 'kind' | 'status'>,
): WorkBadge {
  if (data.kind === 'sample') return { label: '架空のサンプル', tone: 'sample' };
  return data.status === 'active'
    ? { label: '稼働中', tone: 'active' }
    : { label: '完了', tone: 'completed' };
}

/** Order of the groups on the works page: real work first, samples last. */
export const workKindOrder = ['client', 'employment', 'personal', 'sample'] as const satisfies readonly CollectionEntry<'works'>['data']['kind'][];

/**
 * Returns every work in display order.
 *
 * @returns Works sorted by `order`, then by title.
 * @example
 * const works = await getSortedWorks();
 */
export async function getSortedWorks(): Promise<CollectionEntry<'works'>[]> {
  const works = await getCollection('works');
  return works.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ja'),
  );
}
