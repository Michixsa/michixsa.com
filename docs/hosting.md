# ホスティングとドメイン

michixsa.com の公開に関わるサービスと設定の記録です。DNS やドメインを触る前に読んでください。

## 全体の構成

| 役割 | 担当 | 管理する場所 |
| --- | --- | --- |
| ドメインの登録 | Squarespace Domains | Squarespace の管理画面 |
| ドメインの支払いと自動更新 | Google Workspace | Google 管理コンソールの「お支払い」 |
| DNS | Cloudflare | Cloudflare の michixsa.com → DNS |
| サイト | Cloudflare Pages（プロジェクト名 `michixsa-com`） | Cloudflare の Workers & Pages |
| メール（`info@michixsa.com`） | Google Workspace（Gmail） | Google 管理コンソール |

## Cloudflare Pages

Cloudflare Pages の GitHub 連携で、このリポジトリ（`Michixsa/michixsa.com`）とつないでいます。GitHub 側では、Organization `Michixsa` に Cloudflare Workers and Pages のアプリを入れ、このリポジトリだけを許可しています。

| 項目 | 値 |
| --- | --- |
| プロジェクト名 | `michixsa-com`（`https://michixsa-com.pages.dev`） |
| プロダクションブランチ | `main` |
| ビルドコマンド | `bun run build` |
| 出力ディレクトリ | `dist` |
| カスタムドメイン | `michixsa.com` |

レスポンスヘッダーは `public/_headers` で設定しており、`/lp/*` には `X-Robots-Tag: noindex` を付けています。

## DNS

ネームサーバーは Cloudflare（`fattouche.ns.cloudflare.com`、`holly.ns.cloudflare.com`）です。DNSSEC はオフです。

| 種類 | 名前 | 値 | 役割 |
| --- | --- | --- | --- |
| CNAME | `michixsa.com` | `michixsa-com.pages.dev`（プロキシ） | サイト。Pages のカスタムドメインが管理するので、手で変えない |
| A | `www` | `192.0.2.1`（プロキシ） | 転送用。どこにもつながらない見本用のアドレスで、Cloudflare が転送する。消すと `www` が開けなくなる |
| MX | `michixsa.com` | `smtp.google.com`（優先度 1） | メールの受け取り先 |
| TXT | `michixsa.com` | `v=spf1 include:_spf.google.com ~all` | SPF（送ってよいサーバー） |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=…` | DKIM（なりすまし防止の署名）。値は Google 管理コンソールの「メールの認証」でも確認できる |

**MX・SPF・DKIM の3つは消さないでください。** 消すと、メールが届かなくなったり、送ったメールが迷惑メールに入りやすくなったりします。

## 転送

| 来たアドレス | 転送先 | 設定 |
| --- | --- | --- |
| `http://〜` | `https://〜` | SSL/TLS → エッジ証明書 →「常に HTTPS を使用」をオン |
| `https://www.michixsa.com/*` | `https://michixsa.com/${1}`（301、クエリ文字列を保持） | ルール → リダイレクト ルール |

`http://www.michixsa.com/〜` は、HTTPS への転送と `www` の転送を順に通って `https://michixsa.com/〜` に届きます。
