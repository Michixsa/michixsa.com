/** Deterministic fictional jobs for the landscaping-equipment contractor demo. */

export const TODAY = '2026-11-04';
export const STORAGE_KEY = 'michixsa-demo-v1';

export const statuses = ['inquiry', 'estimate', 'won', 'working', 'done', 'hold'] as const;
export type Status = (typeof statuses)[number];

export const statusLabel: Record<Status, string> = {
  inquiry: '問い合わせ',
  estimate: '調査・見積',
  won: '受注',
  working: '工事中',
  done: '完了',
  hold: '保留',
};

const legacyStatus: Record<string, Status> = {
  inquiry: 'inquiry',
  survey: 'estimate',
  quote: 'estimate',
  estimate: 'estimate',
  won: 'won',
  working: 'working',
  done: 'done',
  cancel: 'hold',
  hold: 'hold',
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
  /** Clock time on the due date, stable for the sample. */
  time: string;
  /** Short fictional task name. */
  topic: string;
  /** Status to restore when leaving 保留. */
  heldFrom?: Status;
  alias?: string;
  place?: string;
}

export interface LogItem {
  at: string;
  user: string;
  jobId: string;
  what: string;
  before: string;
  after: string;
  kind?: 'status' | 'edit' | 'csv';
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
const orgs = [
  '白樫ヶ丘レジデンス管理組合',
  'つくし野第二テラス',
  '青葉台東パーク管理組合',
  'みどり坂ガーデンコート',
  '浜風通り商店会',
  '桜ヶ丘北テラス管理組合',
  'ひかり町三丁目会館',
  'かわべ西レジデンス管理組合',
];
const towns = ['みどり', 'さくら', 'かわべ', 'ひかり', 'みなみ', 'きた', 'まつ', 'うみ'];
const topics: Record<Kind, string[]> = {
  water: ['給水管', '排水', '蛇口'],
  air: ['空調', '換気', '室外機'],
  check: ['点検', '器具の確認', '定期の確認'],
};
const times = ['9:00', '10:30', '13:00', '14:30', '16:00'];

export function buildCustomers(): Customer[] {
  const rand = rng(20261104);
  return Array.from({ length: 80 }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    const town = towns[Math.floor(rand() * towns.length)];
    const block = 1 + Math.floor(rand() * 9);
    const num = 1 + Math.floor(rand() * 20);
    const org = i % 5 === 4 ? orgs[i % orgs.length] : '';
    return {
      id: `C-${n}`,
      name: org || `${surnames[i % surnames.length]} 様`,
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
  const jobs: Job[] = [];
  const add = (status: Status, due: string, time: string, kind: Kind = kinds[jobs.length % kinds.length]) => {
    const index = jobs.length + 1;
    jobs.push({
      id: `K-${String(index).padStart(3, '0')}`,
      customerId: `C-${String(((index - 1) % 80) + 1).padStart(3, '0')}`,
      kind,
      status,
      ownerId: users[index % users.length].id,
      due,
      yen: (3 + (index % 12)) * 10000,
      memo: '架空のメモです。',
      time,
      topic: topics[kind][index % topics[kind].length],
      heldFrom: status === 'hold' ? 'estimate' : undefined,
    });
  };

  add('working', '2026-10-28', '9:00', 'water');
  add('estimate', '2026-10-30', '10:30', 'air');
  add('won', '2026-11-01', '13:00', 'check');
  add('working', TODAY, '9:00', 'water');
  add('estimate', TODAY, '10:30', 'check');
  add('won', TODAY, '16:00', 'air');

  for (const due of ['2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16', '2026-11-18']) {
    add('inquiry', due, '10:30');
  }
  for (const [due, time] of [
    ['2026-11-05', '9:00'],
    ['2026-11-05', '13:00'],
    ['2026-11-06', '10:30'],
    ['2026-11-06', '16:00'],
    ['2026-11-07', '9:00'],
    ['2026-11-07', '14:30'],
    ['2026-11-08', '11:00'],
  ] as const) {
    add('working', due, time);
  }
  for (const due of ['2026-11-05', '2026-11-06', '2026-11-08']) add('estimate', due, '11:00');
  for (const due of ['2026-11-10', '2026-11-12']) add('estimate', due, '14:30');
  for (const due of ['2026-11-09', '2026-11-12', '2026-11-13', '2026-11-19']) add('won', due, '13:00');
  for (let extra = 0; extra < 3; extra += 1) add('hold', '2026-11-20', '13:00');
  while (jobs.length < 150) add('done', addDays(TODAY, -((jobs.length % 40) + 10)), times[jobs.length % times.length]);
  return jobs;
}

export function buildLog(jobs: Job[]): LogItem[] {
  return jobs.slice(0, 40).map((job, i) => ({
    at: `${addDays(TODAY, -((i % 12) + 1))} 09:00`,
    user: users[i % users.length].name,
    jobId: job.id,
      what: '状態',
      before: '問い合わせ',
      after: statusLabel[job.status],
      kind: 'status' as const,
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
    const jobs = saved.jobs.map((job, index) => {
      const status = legacyStatus[String(job.status)] ?? 'inquiry';
      return {
        ...seed.jobs[index % seed.jobs.length],
        ...job,
        status,
        time: job.time || times[index % times.length],
        topic: job.topic || topics[job.kind]?.[0] || '点検',
      };
    });
    return {
      jobs,
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

export const flow: Status[] = ['inquiry', 'estimate', 'won', 'working', 'done'];

export function nextStatus(status: Status): Status | null {
  const index = flow.indexOf(status);
  if (index < 0 || index === flow.length - 1) return null;
  return flow[index + 1];
}

export function prevStatus(status: Status): Status | null {
  const index = flow.indexOf(status);
  if (index <= 0) return null;
  return flow[index - 1];
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
