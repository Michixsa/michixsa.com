import type { Cat, Photo, News, Shop } from './types';

// Fictional content. Every name, address and number here is made up; photo
// credits are on the explanation page, src/content/works/sample-musubi.md.

const photo = (id: string): Photo => ({
  url: `/lp/musubi/photos/${id}.webp`,
  width: 800,
  height: 800,
});

export const cats: Cat[] = [
  {
    id: 'mugi',
    name: 'むぎ',
    photo: photo('mugi'),
    sex: '男の子',
    age: '2歳くらい',
    traits: ['人なつこい', 'おしゃべり'],
    profile:
      '公園で保護された茶トラの男の子です。来店したお客さまを玄関まで迎えに来るのが日課で、名前を呼ぶと「にゃっ」と返事をします。',
    status: '家族募集中',
    arrivedAt: '2027-03-20',
  },
  {
    id: 'sumi',
    name: 'すみ',
    photo: photo('sumi'),
    sex: '女の子',
    age: '4歳くらい',
    traits: ['マイペース', 'ひなたぼっこ好き'],
    profile:
      '黒猫の女の子です。はじめは棚の上から様子を見ていますが、慣れるとひざに乗ってきます。窓際のクッションがお気に入りです。',
    status: '家族募集中',
    arrivedAt: '2027-03-12',
  },
  {
    id: 'kinako',
    name: 'きなこ',
    photo: photo('kinako'),
    sex: '女の子',
    age: '1歳くらい',
    traits: ['遊び好き', 'ちょっと甘えん坊'],
    profile:
      'クリーム色と白の長い毛がふわふわの女の子です。猫じゃらしを見せると、ずっと追いかけています。遊び疲れるとそのまま寝てしまいます。',
    status: 'トライアル中',
    arrivedAt: '2027-02-28',
  },
  {
    id: 'tama',
    name: 'たま',
    photo: photo('tama'),
    sex: '女の子',
    age: '6歳くらい',
    traits: ['おだやか', '先輩猫'],
    profile:
      '三毛猫の女の子で、お店の猫たちのまとめ役です。若い猫がけんかを始めると、間に入って止めてくれます。',
    status: '家族募集中',
    arrivedAt: '2027-02-10',
  },
  {
    id: 'sora',
    name: 'そら',
    photo: photo('sora'),
    sex: '男の子',
    age: '3歳くらい',
    traits: ['こわがり', '抱っこは苦手'],
    profile:
      'グレーの男の子です。大きな音が苦手で、静かに過ごせるご家庭にお迎えいただきました。',
    status: '卒業',
    arrivedAt: '2027-01-15',
  },
  {
    id: 'hachi',
    name: 'はち',
    photo: photo('hachi'),
    sex: '男の子',
    age: '5歳くらい',
    traits: ['食いしん坊', 'のんびり'],
    profile:
      'ハチワレの男の子です。ごはんの時間になると誰よりも早く集まっていました。先住猫のいるご家庭で、のんびり暮らしています。',
    status: '卒業',
    arrivedAt: '2026-12-01',
  },
];

export const shop: Shop = {
  name: '保護猫カフェ むすび',
  catchcopy: 'ここにいる猫は、みんな家族を探しています。',
  concept:
    'むすびは、保護された猫たちが新しい家族と出会うためのカフェです。猫たちはお店で暮らしながら、人と過ごすことに少しずつ慣れていきます。お茶を飲みながら、気になる子とのんびり過ごしてください。',
  activity:
    '地域のボランティア団体と協力して、行き場をなくした猫を保護しています。健康診断・ワクチン・不妊去勢手術を済ませたうえでお店に迎え、譲渡の前にはご自宅での「トライアル」期間を設けています。',
  hours: '11:00〜19:00（最終入店 18:00）',
  closed: '毎週水曜日',
  prices: [
    { label: '30分', price: '800円' },
    { label: '60分', price: '1,400円' },
    { label: '延長10分ごと', price: '250円' },
    { label: '小学生以下', price: '半額（保護者の方と一緒にご来店ください）' },
  ],
  address: '〒000-0000 架空県ひだまり市さくら町1-2-3 さくらビル2階',
  access: '架空線「ひだまり駅」北口から徒歩5分',
  phone: '000-0000-0000',
  email: 'info@example.com',
  rules: [
    '入店前に手を洗い、消毒をお願いします。',
    '寝ている猫は起こさず、そっと見守ってください。',
    '抱っこは猫が嫌がらない範囲でお願いします。',
    '猫に人の食べ物を与えないでください。',
    'フラッシュを使った撮影はご遠慮ください。',
  ],
};

export const news: News[] = [
  {
    id: 'open',
    title: '4月1日にオープンします',
    body: 'オープン初日は混雑が予想されるため、ご予約のお客さまを優先してご案内します。',
    publishedAt: '2027-03-25T09:00:00.000Z',
  },
  {
    id: 'mugi',
    title: '新しい仲間「むぎ」が来ました',
    body: '茶トラの男の子です。猫たちの紹介ページをご覧ください。',
    publishedAt: '2027-03-20T09:00:00.000Z',
  },
  {
    id: 'trial',
    title: '「きなこ」がトライアルを始めました',
    body: 'ご家族のもとで、新しい暮らしに慣れているところです。',
    publishedAt: '2027-03-15T09:00:00.000Z',
  },
];
