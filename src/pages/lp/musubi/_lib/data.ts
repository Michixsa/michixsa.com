import { cats, news, shop } from './content';
import type { Cat, News, Photo, Shop } from './types';

/**
 * Lists every cat, newest arrival first.
 *
 * @returns The cats in `content.ts`.
 */
export function getCats(): Cat[] {
  return cats.toSorted((a, b) => b.arrivedAt.localeCompare(a.arrivedAt));
}

/**
 * Reads the shop-wide information.
 *
 * @returns The shop in `content.ts`.
 */
export function getShop(): Shop {
  return shop;
}

/**
 * Lists the latest announcements.
 *
 * @param limit - How many to return.
 * @returns Newest first.
 */
export function getNews(limit = 3): News[] {
  return news.toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

/**
 * Picks the photo file sized for `width`.
 *
 * Each photo is stored at 800px and 480px; the smaller one is enough when it
 * stays sharp at twice the display width on high-density phone screens.
 *
 * @param photo - The photo to show.
 * @param width - Display width in CSS pixels.
 * @returns A URL suitable for `<img src>`.
 * @example imageUrl(cat.photo, 240) // "/lp/musubi/photos/480/mugi.webp"
 */
export function imageUrl(photo: Photo, width: number): string {
  return width * 2 <= 480 ? photo.url.replace('/photos/', '/photos/480/') : photo.url;
}

/**
 * Formats an ISO date with dots, as the design sets dates in Lato.
 *
 * @example dotDate('2027-04-01T00:00:00.000Z') // "2027.4.1"
 */
export function dotDate(iso: string): string {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' })
    .format(new Date(iso))
    .split('-');
  return `${year}.${Number(month)}.${Number(day)}`;
}

/**
 * Formats an ISO date as a Japanese calendar date.
 *
 * @example formatDate('2027-04-01T00:00:00.000Z') // "2027年4月1日"
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'long', timeZone: 'Asia/Tokyo' }).format(
    new Date(iso),
  );
}
