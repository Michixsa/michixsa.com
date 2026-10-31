---
title: hermes-agent-cachix — AI エージェントのビルドを肩代わりするキャッシュ
summary: 非力なサーバでは長時間かかっていた AI エージェントのビルドを、CI とバイナリキャッシュ（Cachix）で肩代わりする仕組みです。上流のリリースを毎日追って、人の手を介さずに更新します。
period: 2026年8月〜（継続中）
role: 個人で設計・構築
tech:
  - Nix
  - GitHub Actions
  - Cachix
kind: personal
status: active
order: 60
links:
  - label: GitHub で見る
    href: https://github.com/asktt1770/hermes-agent-cachix
---

## 目的

小さなサーバで AI エージェント（Hermes Agent）を NixOS 上に入れようとすると、ビルドに長い時間がかかります。動かすサーバとビルドするマシンを分け、ビルド済みのものを配る仕組みを作りました。

## 仕組み

- GitHub Actions の CI でエージェントをビルドし、結果をバイナリキャッシュ（Cachix）に置く
- 利用する側の NixOS は、ビルド済みのものを取得するだけで済む
- 上流のリリースを毎日確認し、新しい版が出れば無人で更新する

## 判断の理由

運用の手間を増やさないことを優先し、更新の確認からビルド、配布までを人が介さずに回る形にしました。
