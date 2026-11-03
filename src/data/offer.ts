/**
 * Owner-approved provisional prices and terms.
 * Every amount is tax-included and a starting price (〜). Do not invent figures.
 * Items this file does not decide stay as 【要確認】 on the site.
 */

export type CopyPart = string | { tbd: string };

/** Tax-included starting prices. The 〜 is part of the figure. */
const yen = {
  lp: '80,000円〜',
  site: '160,000円〜',
  page: '15,000円〜/ページ',
  edit: '5,000円〜',
  domain: '15,000円〜',
  light: '月4,800円〜',
  standard: '月12,000円〜',
  consultHour: '8,000円〜/時間',
  buildHour: '6,000円〜/時間',
  buildProject: '90,000円〜/案件',
  advisor: '45,000円〜',
} as const;

export const strengths = [
  {
    title: '止まりにくく、速い',
    body: '静的なサイトとして作り、Cloudflare で公開します。型・リンク・表示品質の自動チェックを通してから出します。',
  },
  {
    title: 'サーバと運用も相談できる',
    body: 'サーバの構成、監視、公開後の運用を、制作と切り分けずにご相談いただけます。',
  },
  {
    title: '引き継ぎまで文書にする',
    body: '手順と判断の理由を文書に残します。インフラの構築には、手順書をつけてお渡しします。',
  },
] as const;

export const services = [
  {
    title: 'LP・小規模サイト',
    body: '1ページの LP から、数ページのサイトまで。スマートフォンでの読みやすさを先に作ります。',
  },
  {
    title: 'ドメイン・公開設定',
    body: 'ドメイン取得の補助、DNS、SSL、公開の確認を行います。契約の名義は、原則としてお客様です。',
  },
  {
    title: 'インフラ・自動化の相談',
    body: '構成の相談、サーバやクラウドの構築、監視、手順の自動化を、時間単位または案件単位でお受けします。',
  },
  {
    title: '保守・運用',
    body: '公開後の稼働や期限の見守り、軽い修正、更新の代行を、月額のプランでお受けします。',
  },
] as const;

export const steps = [
  { title: 'ヒアリング', body: '目的、届けたい相手、今の困りごとを伺います。' },
  { title: '構成', body: 'ページに載せる内容と、その順番を決めます。' },
  { title: 'デザイン', body: '狭い画面から見た目を組み立て、広い画面では並べ方を広げます。' },
  { title: '実装と自動チェック', body: 'ページを作り、型・リンク・表示品質のチェックを通します。' },
  { title: '確認用URLで確認', body: '公開前の URL で、仕上がりを見ていただきます。' },
  { title: '公開', body: '問題がなければ、本番の URL に出します。' },
] as const;

export const priceIntro =
  'ここに書いた金額は目安です（税込）。「〜」は、その金額から、という意味です。内容を伺ったうえでお見積もりします。お見積もりは無料です。';

export interface PriceItem {
  name: string;
  figures: readonly string[];
  /** Word between figures, such as または. */
  joiner?: string;
  /** Extra condition shown under the figure. */
  note?: string;
  includes: string;
}

export const prices: readonly PriceItem[] = [
  {
    name: 'LP（1ページ）',
    figures: [yen.lp],
    includes: '構成案、デザイン、コーディング、スマホ対応、問い合わせ導線、公開作業',
  },
  {
    name: 'コーポレートサイト（5ページ程度）',
    figures: [yen.site],
    includes: '5ページ、スマホ対応、基本SEO、問い合わせフォーム、公開作業',
  },
  {
    name: 'ページ追加',
    figures: [yen.page],
    includes: '既存デザインに合わせた追加',
  },
  {
    name: '既存サイトの修正',
    figures: [yen.edit],
    includes: '文言・画像の差し替えなど',
  },
  {
    name: 'ドメイン・公開設定（単体）',
    figures: [yen.domain],
    note: '制作のご依頼時は無料',
    includes:
      'ドメイン取得補助、DNS設定、SSL、公開確認。ドメイン・サーバはお客様名義で、実費はお客様負担です',
  },
  {
    name: '保守ライト',
    figures: [yen.light],
    includes: '稼働監視、SSL・ドメイン期限の監視、月1回の軽微な修正（30分程度）、障害時の初動対応',
  },
  {
    name: '保守スタンダード',
    figures: [yen.standard],
    includes: 'ライトの内容に加えて、更新代行（月2時間程度まで）、バックアップ、月次の簡易レポート',
  },
  {
    name: 'インフラ・自動化のスポット相談',
    figures: [yen.consultHour],
    note: '初回30分無料',
    includes: '構成の相談・レビュー、トラブルの切り分け',
  },
  {
    name: 'インフラ構築・自動化（作業）',
    figures: [yen.buildHour, yen.buildProject],
    joiner: 'または',
    includes: 'サーバ・クラウド構築、監視、自動化。手順書つき',
  },
  {
    name: 'インフラ顧問（月額）',
    figures: [yen.advisor],
    note: '月10時間まで',
    includes: '継続的な相談、レビュー、改善提案',
  },
];

export const terms = [
  {
    term: '納期',
    detail:
      'LP は2〜3週間、コーポレートサイト（5ページ程度）は4〜6週間が目安です。インフラの作業は、内容ごとに見積もります。期間は、着手金のお支払いと、素材・原稿のお預かりが済んでから数えます。',
  },
  {
    term: '支払い',
    detail:
      '制作は、着手前に着手金として50%、納品後14日以内に残りの50%です。保守と顧問は、月額の前払いです。お支払いは銀行振込で、振込手数料はお客様のご負担です。',
  },
  {
    term: '修正回数',
    detail:
      'デザインを確認いただく段階で、2回までです。納品後2週間以内は、3回まで無料です。一度にまとめてのご依頼を、1回と数えます。大きな変更や、機能の追加は、別途お見積もりします。',
  },
  {
    term: 'キャンセル',
    detail: '着手したあとのキャンセルは、進み具合に応じた費用をご請求します。着手金は返金しません。',
  },
  {
    term: '契約形態',
    detail:
      '制作と構築は、請負契約です。保守、相談、時間単価の作業は、準委任契約です。保守の最低契約期間は、3か月です。',
  },
  {
    term: '権利',
    detail:
      'ドメイン、サーバ、各アカウントは、原則としてお客様の名義です。著作権は、料金を全額お支払いいただいたあと、お客様に譲渡します。AI で生成した画像を使うときは、そのことをお伝えします。',
  },
] as const;

export const faqs: readonly { question: string; parts: readonly CopyPart[] }[] = [
  {
    question: '相談は有料ですか？',
    parts: [
      `ご相談とお見積もりは無料です。インフラ・自動化のスポット相談は、初回の30分が無料で、その後は${yen.consultHour}（税込）です。`,
    ],
  },
  {
    question: 'ドメインやサーバの名義は誰になりますか？',
    parts: [
      `ドメイン、サーバ、各アカウントは、原則としてお客様の名義です。取得や維持の実費はお客様のご負担です。設定だけをご依頼いただく場合の作業費は${yen.domain}（税込）で、サイト制作と同時の場合はこの作業費をいただきません。`,
    ],
  },
  {
    question: '公開したあとの更新はどうしますか？',
    parts: [
      `文言や画像の差し替えは、${yen.edit}（税込）からお受けします。ページの追加は、${yen.page}（税込）です。毎月の対応が必要なら、保守プランでもお受けします。保守ライトは月1回・30分程度の軽微な修正、保守スタンダードは月2時間程度までの更新代行を含みます。`,
    ],
  },
  {
    question: '保守はお願いできますか？',
    parts: [
      `お受けしています。保守ライトは${yen.light}（税込）、保守スタンダードは${yen.standard}（税込）です。最低契約期間は3か月です。含む内容は、上の料金の欄に書いています。`,
    ],
  },
  {
    question: '遠方からでも依頼できますか？',
    parts: [
      '遠方からのご依頼や、対面での打ち合わせについては',
      { tbd: '【要確認】' },
      'です。',
    ],
  },
];

export const contactChannelParts: readonly CopyPart[] = [
  'ご連絡の窓口は',
  { tbd: '【要確認】' },
  'です。決まり次第、この場所に載せます。',
];

export const replyText = '返信の目安は、通常2営業日以内です。受付は24時間を想定しています。';

export const consultNote = 'ご相談とお見積もりは無料です。';

export const inquiryPoints = [
  '作りたいページの目的と、届けたい相手',
  'ページ数のイメージ（1ページの LP か、数ページか）',
  '希望の時期',
  'すでにあるサイト、ドメイン、サーバの有無',
] as const;
