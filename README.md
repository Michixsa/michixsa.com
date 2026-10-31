# portfolio

フリーランスのインフラエンジニア **asktt1770** のポートフォリオサイトです（インフラの設計・構築、監視、Ansible・NixOS・AI エージェントによる自動化）。

サイトは [Astro](https://astro.build/) で作った静的サイトです。実績は Markdown で書き、変更はすべて PR を通します。CI で型チェック・ビルド・誤字チェック・リンクチェック・Lighthouse による採点に合格するまで、本番には反映しません。

## 変更が公開されるまでの流れ

```mermaid
flowchart LR
    A["Markdown を書く・直す<br/>src/content/works/*.md"] --> B["PR を出す"]
    B --> C{"GitHub Actions CI"}
    C --> C1["astro check + ビルド"]
    C --> C2["typos"]
    C --> C3["リンクチェック（lychee）"]
    C --> C4["Lighthouse CI<br/>4項目すべて 100 点"]
    B --> D["Cloudflare Pages<br/>PR ごとのプレビュー URL"]
    C1 & C2 & C3 & C4 --> E{"すべて合格し、<br/>プレビューも問題ない？"}
    D --> E
    E -- はい --> F["main にマージ"]
    E -- いいえ --> A
    F --> G["Cloudflare Pages が<br/>本番をビルドして公開"]
```

1. **書く**：実績は1件ごとに `src/content/works/` の Markdown ファイルで書きます。先頭の項目（frontmatter）は zod のスキーマ（`src/content.config.ts`）で検証します。タイトル・期間・担当・使用技術・`kind` のどれかが欠けているとビルドが失敗するので、書きかけのページが公開されることはありません。
2. **PR を出す**：`main` に直接反映することはありません。
3. **チェックとプレビュー**：CI が下のチェックを実行し、同じコミットについて Cloudflare Pages がプレビュー URL を作ります。公開前にスマートフォンで見た目を確認できます。
4. **マージ**：`main` にマージすると、Cloudflare Pages で本番への公開が始まります。

## 品質チェック

| チェック | ツール | 失敗する条件 |
| --- | --- | --- |
| 型とビルド | `astro check`、`astro build` | 型エラーがある、または frontmatter がスキーマに合わない |
| 誤字 | [typos](https://github.com/crate-ci/typos) | コードやドキュメントに既知の綴り間違いがある |
| リンク | [lychee](https://github.com/lycheeverse/lychee) | サイト内・外部のリンクが1つでも切れている |
| Lighthouse | [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) | パフォーマンス・アクセシビリティ・ベストプラクティス・SEO のどれかが 100 点未満（モバイル） |

架空のサンプル LP には、検索結果に出ないよう `noindex` を付けています。Lighthouse の SEO 項目は `noindex` を減点するため、LP の計測（`lighthouserc.lp.json`）ではその1項目（`is-crawlable`）だけを対象から外しています。それ以外の項目はすべて合格が必要です。

## 構成

```
src/
├─ pages/
│  ├─ index.astro            # トップページ
│  ├─ works/index.astro      # 実績一覧（種類ごとに表示）
│  ├─ works/[slug].astro     # src/content/works から作る実績の詳細
│  ├─ about.astro            # プロフィールとスキル
│  ├─ contact.astro          # お問い合わせ方法
│  └─ lp/<name>/index.astro  # 独立したサンプル LP
├─ content/works/*.md        # 実績（1件1ファイル）
├─ layouts/BaseLayout.astro  # ポートフォリオのレイアウト（サンプル LP は使わない）
├─ data/site.ts              # サイトの文言、種類のラベル
└─ content.config.ts         # 実績の zod スキーマ
```

実績にはすべて `kind`（`client`・`employment`・`personal`・`sample`）があります。実在の実績には `status`（`active`・`completed`）も必須で、カードには「稼働中」「完了」「架空のサンプル」のバッジが自動で付きます。サイト上でそれぞれにラベルを表示し、架空のサンプルを受託実績と取り違えられないようにしています。

## ローカルでの開発

[Bun](https://bun.sh/) が必要です。`typos` と `lychee` は単体のコマンドなので、好きな方法（たとえば Nix）で入れてください。

```sh
bun install
bun run dev          # http://localhost:4321/
bun run verify       # 型チェック・ビルド・typos・リンク・Lighthouse をまとめて実行
```

| スクリプト | 内容 |
| --- | --- |
| `bun run dev` | 開発サーバーを起動 |
| `bun run check` | `astro check`（型と診断） |
| `bun run build` | 静的サイトを `dist/` に生成 |
| `bun run preview` | `dist/` をローカルで表示 |
| `bun run lint:typos` | 誤字チェック |
| `bun run lint:links` | `dist/` 内のすべてのリンクをチェック |
| `bun run lighthouse` | `dist/` に対して Lighthouse CI を実行 |

## ホスティング

Cloudflare Pages の GitHub 連携で、このリポジトリとつないでいます。ビルドコマンドは `bun run build`、出力ディレクトリは `dist` です。レスポンスヘッダーは `public/_headers` で設定しており、`/lp/*` には `X-Robots-Tag: noindex` を付けています。
