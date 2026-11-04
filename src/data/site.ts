import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

/** Site-wide strings for the michixsa team site. */
export const site = {
  name: 'michixsa',
  title: 'michixsa｜途中からでも、はじめからでも。Web制作・システム開発・サーバー運用',
  description:
    'michixsaは、ホームページの制作、業務システム・管理画面の開発と改修、サーバー・クラウドの構築と移転、公開後の保守・運用までをお受けする少人数のチームです。全国オンライン対応。',
  url: 'https://michixsa.com',
  email: 'info@michixsa.com',
} as const;

/** mailto with a subject and a short body template. */
export function mailHref(subject: string, body: string): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

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
  client: '受託案件',
  employment: '担当した業務',
  personal: '自主制作',
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
