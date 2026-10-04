---
title: YA-swap-OPAMPcard
description: オペアンプを交換しよう！ヘッドホンアンプ名刺
image: cover.webp
categories:
  - Audio
  - Hardware
tags:
  - Analog
  - KiCad
---

## 概要
「YA-swap-OPAMPcard」は、DIP-8パッケージのデュアルオペアンプを交換できる、
名刺サイズのヘッドホンアンプです。006P形9V電池で駆動し、
オペアンプによる2chの非反転ユニティゲインバッファを構成しています。

## 主な仕様
- 基板サイズ: 85.0 × 49.0 mm
- 基板: 2層FR-4、板厚1.6 mm
- 電源: 006P形9V電池単体
- 電源構成: 分圧回路で仮想GNDを生成し、約±4.5 Vで動作
- 入出力: 3.5 mmステレオ入力・出力
- 操作部: スイッチ付き2連ボリューム
- 増幅回路: デュアルオペアンプによる2ch非反転ユニティゲインバッファ（1倍／0 dB）
- オペアンプ: ICソケットによりDIP-8デュアルオペアンプを交換可能

## おすすめのオペアンプ
- **[NJM4580](https://akizukidenshi.com/catalog/g/g100069/)**
  - 定番のオーディオ用2回路入りオペアンプです。
- **[NJM4558](https://akizukidenshi.com/catalog/g/g111236/)**
  - 「伝説のオペアンプ」として知られています。
- **[NJM2068](https://akizukidenshi.com/catalog/g/g102358/)**
  - 低雑音オーディオ用。筆者個人のお気に入りです。
- **[MUSES8820](https://akizukidenshi.com/catalog/g/g103706/)**
  - 人の感性に響く音を追求したシリーズで、広い音場感と高解像度を志向しています。
- **[MUSES01D](https://akizukidenshi.com/catalog/g/g103416/) / [MUSES02D](https://akizukidenshi.com/catalog/g/g103417/)**
  - MUSESシリーズのフラッグシップです。
- **[NJM5532D](https://akizukidenshi.com/catalog/g/g129564/)**
  - 低雑音で出力駆動力にも優れたデュアルオペアンプです。
- **[LT1364](https://akizukidenshi.com/catalog/g/g108467/)**
  - 高速・高スルーレートのデュアルオペアンプです。
- **[OPA1612](https://akizukidenshi.com/catalog/g/g116735/)**
  - 低雑音・低歪みを特長とする、オーディオ用途向けのバイポーラ入力デュアルオペアンプです。

聴感には個人差があります。交換前に、電源条件・ピン配置・実装形状が本機に適合することを確認してください。

## yasushiの担当
(単独開発のプロダクトです)

## 技術スタック
- KiCad
- アナログ回路設計
- プリント基板設計
