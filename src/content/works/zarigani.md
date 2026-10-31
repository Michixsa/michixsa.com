---
title: ZARIGANI — エージェント実行環境の構築自動化（Ansible）
summary: OSS の AI エージェントを常時動かすためのサーバ構築を、Ubuntu 上で Ansible により自動化しました。要件定義を先に文書にし、そこから逆算して構成を設計しています。
period: 2026年3月〜7月
role: 個人で設計・構築
tech:
  - Ansible
  - Ubuntu
  - Jinja2
  - UFW
  - fail2ban
  - Tailscale
  - etckeeper
kind: personal
status: completed
featured: true
order: 50
---

## 目的

OSS の AI エージェント（OpenClaw）を常時稼働させるサーバを、手作業ではなく、何度実行しても同じ状態になる手順で構築することが目的です。

## やったこと

- 構築作業を 17 本のロール（役割ごとの部品）に分け、Jinja2 テンプレートとハンドラで構成
- UFW、Tailscale、自動セキュリティ更新、netplan、GRUB などを含む初期構築を一括で実行
- etckeeper で `/etc` を Git 管理下に置き、各プレイブックの実行後に自動で記録
- 手順書に、ネットワーク設定の名前の不一致で接続が切れるなどの失敗条件と、その復旧手順を明記

## 判断の理由

### SSH のポート移行を2段階に分けた

SSH のポートを変える作業は、途中で失敗すると自分自身がサーバに入れなくなります。そこで、1本目のプレイブックはポート 22 で接続して鍵の配布と新ポートの開放までを行い、2本目で新ポート・鍵認証で接続してからポート 22 を閉じる構成にしました。

### 起動しない原因を突き止めて回避した

- socket 経由で起動する環境で `ssh.socket` が "Address already in use" で起動に失敗し、どのポートでも SSH を受け付けなくなる事象を特定。override で `ListenStream` をリセットし、`BindIPv6Only=both` を指定して回避
- fail2ban の設定ファイルで `[sshd]` セクションが重複してサービスが起動しない問題を、既存のセクションを無効にしてから追記する方式で回避

## その後

Ansible の「実行して状態を収束させる」方式では、実行時の状態に左右される箇所が残りました。そこで同じ要件を NixOS の「宣言して再現する」方式で作り直したのが [Iris](/works/iris/) です。
