/** A photo served from `public/lp/musubi/photos/`. */
export type Photo = {
  url: string;
  width: number;
  height: number;
};

/** Adoption status shown on each cat's card. */
export const catStatuses = ['家族募集中', 'トライアル中', '卒業'] as const;
export type CatStatus = (typeof catStatuses)[number];

/** A cat after normalisation, independent of where the data came from. */
export type Cat = {
  id: string;
  name: string;
  photo: Photo;
  sex: '男の子' | '女の子';
  /** Free text such as "2歳くらい", because rescued cats rarely have a known birthday. */
  age: string;
  traits: string[];
  profile: string;
  status: CatStatus;
  /** ISO date the cat joined the café. */
  arrivedAt: string;
};

/** One row of the price table. */
export type PriceRow = {
  label: string;
  price: string;
};

/** Shop-wide information. */
export type Shop = {
  name: string;
  catchcopy: string;
  concept: string;
  activity: string;
  hours: string;
  closed: string;
  prices: PriceRow[];
  address: string;
  access: string;
  phone: string;
  email: string;
  /** House rules, in the order they are listed. */
  rules: string[];
};

/** An announcement shown on the top page. */
export type News = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
};
