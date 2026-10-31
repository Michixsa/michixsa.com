---
title: dotfiles — 開発環境を Nix で宣言的に管理
summary: macOS / Linux の開発環境を Nix で宣言的に管理しています。他の方の dotfiles をフォークし、本家の変更を継続的に取り込みながら運用しています。
period: 2026年6月〜（継続中）
role: 個人で構築・運用
tech:
  - Nix
  - Claude Code
  - Codex
kind: personal
status: active
order: 70
links:
  - label: GitHub で見る
    href: https://github.com/asktt1770/dotfiles
---

## 目的

どのマシンでも、同じ開発環境を短時間で再現できるようにすることが目的です。

## 内容

- macOS / Linux の開発環境（ツール、シェル、各種設定）を Nix で宣言的に管理
- 公開されている dotfiles をフォークして運用し、本家の変更を継続的に取り込んでいる
- Claude Code・Codex 向けの Skills（作業手順の定義）や hooks も含めて管理

## 判断の理由

一から作るより、よく整備された構成を土台にして、本家の改善を取り込み続けるほうが保守の負担が小さいと判断しました。
