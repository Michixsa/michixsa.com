import type { CollectionEntry } from 'astro:content';

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

/** Japanese labels for each `kind`, shown as group headings. */
export const fictionalKinds = ['sample', 'demo', 'case'] as const;

export function isFictional(kind: CollectionEntry<'works'>['data']['kind']): boolean {
  return (fictionalKinds as readonly string[]).includes(kind);
}

export const kindLabels: Record<CollectionEntry<'works'>['data']['kind'], string> = {
  client: '受託案件',
  employment: '担当した業務',
  personal: '自主制作',
  sample: '架空のサンプル',
  demo: '架空のサンプル',
  case: '架空のサンプル',
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
  if (isFictional(data.kind)) return { label: '架空のサンプル', tone: 'sample' };
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
