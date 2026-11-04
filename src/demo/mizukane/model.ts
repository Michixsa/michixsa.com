/** Deterministic fictional jobs for the landscaping-equipment contractor demo. */

export const TODAY = '2026-11-04';
export const STORAGE_KEY = 'michixsa-demo-v1';

export const statuses = [
  'inquiry',
  'survey',
  'quote',
  'won',
  'working',
  'done',
  'cancel',
] as const;
export type Status = (typeof statuses)[number];

export const statusLabel: Record<Status, string> = {
  inquiry: '問い合わせ',
  survey: '現地調査',
  quote: '見積もり',
  won: '受注',
  working: '工事中',
  done: '完了',
  cancel: 'キャンセル',
};

export const kinds = ['water', 'air', 'check'] as const;
export type Kind = (typeof kinds)[number];
export const kindLabel: Record<Kind, string> = {
  water: '給排水',
  air: '空調',
  check: '点検',
};

export interface User {
  id: string;
  name: string;
  role: 'office' | 'field' | 'admin';
  roleLabel: string;
}

export const users: User[] = [
  { id: 'u1', name: '佐藤', role: 'office', roleLabel: '事務' },
  { id: 'u2', name: '鈴木', role: 'office', roleLabel: '事務' },
  { id: 'u3', name: '高橋', role: 'field', roleLabel: '現場担当' },
  { id: 'u4', name: '田中', role: 'field', roleLabel: '現場担当' },
  { id: 'u5', name: '伊藤', role: 'admin', roleLabel: '管理者' },
];

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Job {
  id: string;
  customerId: string;
  kind: Kind;
  status: Status;
  ownerId: string;
  due: string;
  yen: number;
  memo: string;
}

export interface LogItem {
  at: string;
  user: string;
  jobId: string;
  what: string;
  before: string;
  after: string;
}

export interface DemoState {
  jobs: Job[];
  log: LogItem[];
  userId: string;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const surnames = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水', '山崎', '森', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川', '前田', '岡田', '長谷川', '藤田', '近藤', '後藤', '村上', '遠藤', '青木', '坂本'];
const towns = ['みどり', 'さくら', 'かわべ', 'ひかり', 'みなみ', 'きた', 'まつ', 'うみ'];

export function buildCustomers(): Customer[] {
  const rand = rng(20261104);
  return Array.from({ length: 80 }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    const town = towns[Math.floor(rand() * towns.length)];
    const block = 1 + Math.floor(rand() * 9);
    const num = 1 + Math.floor(rand() * 20);
    return {
      id: `C-${n}`,
      name: `${surnames[i % surnames.length]} 様`,
      phone: `000-0000-${String(1000 + i).slice(0, 4)}`,
      address: `〒000-0000 架空県サンプル市${town}${block}-${num}`,
    };
  });
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildJobs(): Job[] {
  const rand = rng(42);
  const flow: Status[] = ['inquiry', 'survey', 'quote', 'won', 'working', 'done', 'cancel'];
  return Array.from({ length: 150 }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    const status = flow[Math.floor(rand() * flow.length)];
    const dueOffset = Math.floor(rand() * 21) - 7;
    return {
      id: `K-${n}`,
      customerId: `C-${String((i % 80) + 1).padStart(3, '0')}`,
      kind: kinds[Math.floor(rand() * kinds.length)],
      status,
      ownerId: users[Math.floor(rand() * users.length)].id,
      due: addDays(TODAY, dueOffset),
      yen: (2 + Math.floor(rand() * 18)) * 10000,
      memo: '架空のメモです。',
    };
  });
}

export function buildLog(jobs: Job[]): LogItem[] {
  return jobs.slice(0, 40).map((job, i) => ({
    at: `${addDays(TODAY, -((i % 12) + 1))} 09:00`,
    user: users[i % users.length].name,
    jobId: job.id,
    what: '状態',
    before: '問い合わせ',
    after: statusLabel[job.status],
  }));
}

export function seedState(): DemoState {
  const jobs = buildJobs();
  return { jobs, log: buildLog(jobs), userId: 'u5' };
}

export function loadState(): DemoState {
  const seed = seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Partial<DemoState>;
    if (!saved.jobs || !Array.isArray(saved.jobs)) return seed;
    return {
      jobs: saved.jobs,
      log: saved.log ?? seed.log,
      userId: saved.userId ?? seed.userId,
    };
  } catch {
    return seed;
  }
}

export function saveState(state: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function customerMap(): Map<string, Customer> {
  return new Map(buildCustomers().map((item) => [item.id, item]));
}

export function userById(id: string): User {
  return users.find((item) => item.id === id) ?? users[0];
}

export function nextStatus(status: Status): Status | null {
  const order: Status[] = ['inquiry', 'survey', 'quote', 'won', 'working', 'done'];
  const index = order.indexOf(status);
  if (index < 0 || index === order.length - 1) return null;
  return order[index + 1];
}

export function weekDays(anchor = TODAY): string[] {
  const date = new Date(`${anchor}T00:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(date.toISOString().slice(0, 10), i));
}

export function yen(value: number): string {
  return `${value.toLocaleString('ja-JP')}円`;
}

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char];
  });
}
