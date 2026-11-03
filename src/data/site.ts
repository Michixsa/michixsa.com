import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

/** Site-wide strings for the michixsa team site. */
export const site = {
  name: 'michixsa',
  title: 'michixsa | 公開した日から、止まりにくく速いサイトを。',
  description:
    'michixsa は、LP や小規模サイトの制作と、公開後の保守・運用を受ける小さなチームです。静的なサイトと自動チェックで、止まりにくく速いページを作ります。',
  url: 'https://michixsa.com',
} as const;

export const mainNav = [
  { href: '/works/', label: '制作サンプル' },
  { href: '/about/', label: 'チーム' },
  { href: '/contact/', label: 'お問い合わせ' },
] as const;

export const footerNav = [
  { href: '/works/', label: '制作サンプル' },
  { href: '/#terms', label: '料金の目安' },
  { href: '/contact/', label: 'お問い合わせ' },
] as const;

/** Japanese labels for each `kind`, shown as group headings. */
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

/**
 * Status badge, plus the AI-image badge when the work says its pictures are generated.
 * Both use the sample badge colours so a sample never reads like client work.
 *
 * @param data - The work's validated frontmatter.
 * @returns Badges in display order.
 */
export function badgesFor(
  data: Pick<CollectionEntry<'works'>['data'], 'kind' | 'status' | 'aiImages'>,
): WorkBadge[] {
  const badges: WorkBadge[] = [badgeFor(data)];
  if (data.aiImages) badges.push({ label: 'AI生成画像', tone: 'sample' });
  return badges;
}

/** Order of the groups on the works page: real work first, samples last. */
export const workKindOrder = ['client', 'employment', 'personal', 'sample'] as const satisfies readonly CollectionEntry<'works'>['data']['kind'][];

/**
 * Returns every published work in display order.
 * Employment and personal infra notes are not in the collection: they are not
 * the team's web-production portfolio.
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
