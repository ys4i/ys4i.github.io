---
title: YA-swapOPAMPcard
description: オペアンプを交換しよう！名刺型ヘッドホンアンプ
image: cover.webp
categories:
  - Audio
  - Hardware
tags:
  - Analog
  - KiCad
---

## 概要
「YA-swapOPAMPcard」は、名刺サイズのヘッドホンアンプです。  
オペアンプを交換して音の違いを楽しもう！  

## 主な仕様
- オペアンプ: DIP8ピン 二回路入オペアンプを交換可能
- 増幅回路: デュアルオペアンプによる2ch非反転ユニティゲインバッファ（1倍／0 dB）
- 電源: 9V角電池 (006P)
- 電源構成: 分圧回路で仮想GNDを生成し、約±4.5 Vで動作
- 入出力: 3.5 mmステレオ入力・出力

## まずはこれ！ おすすめのオペアンプ(基本編)
- **[NJM4580](https://akizukidenshi.com/catalog/g/g100069/)**
  - 定番中の定番！
- **[MUSES8820](https://akizukidenshi.com/catalog/g/g103706/) / [MUSES8920AE（DIP化モジュール）](https://akizukidenshi.com/catalog/g/g129639/)**
  - 人の感性に響く音を追求した「MUSES」シリーズで、広い音場感と高解像度を志向しています。
  - バイポーラ入力(8**8**20)、J-FET入力(8**9**20)を聴き比べてみよう！
- **[NJM5532D](https://akizukidenshi.com/catalog/g/g129564/)**
  - 低雑音で出力駆動力にも優れたデュアルオペアンプです。

## もっと！ おすすめオペアンプ(有名どころ編)
{{% details summary="**有名どころ一覧（クリックで開閉）**" class="details-outline" %}}
- **[MUSES01D](https://akizukidenshi.com/catalog/g/g103416/) / [MUSES02D](https://akizukidenshi.com/catalog/g/g103417/)**
  - MUSESシリーズのフラッグシップです。
- **[NJM4558](https://akizukidenshi.com/catalog/g/g111236/)**
  - 「伝説のオペアンプ」として知られています。
- **[OPA1612](https://akizukidenshi.com/catalog/g/g116735/)**
  - 低雑音・低歪みを特長とする、オーディオ用途向けのバイポーラ入力デュアルオペアンプです。
- **[OPA1655DR](https://akizukidenshi.com/catalog/g/g117426/)**
  - 低雑音・低歪みのOPA1655を2回路化した完成品モジュールです。本機の約±4.5 Vで動作します。
- **[OP275GPZ](https://akizukidenshi.com/catalog/g/g106716/)**
  - 低雑音・低歪み、高スルーレートを特長とする2回路入りオーディオ用オペアンプです。
<!-- - **[AD797](https://akizukidenshi.com/catalog/g/g113694/)**
  - 超低雑音・低歪みの単回路オペアンプです。2回路化が必要で、電源も±5 V以上のため、本機の約±4.5 Vでは仕様範囲外です。 -->
- **[OPA827](https://akizukidenshi.com/catalog/g/g116896/)**
  - 伝説のオペアンプ「OPA627」の後継品！

{{% /details %}}

## もっと！ おすすめオペアンプ(yasushiのお気に入り編)
{{% details summary="**お気に入り一覧（クリックで開閉）**" class="details-outline" %}}
- **[NJM2068](https://akizukidenshi.com/catalog/g/g102358/)**
  - 低雑音オーディオ用。筆者個人のお気に入りです。
- **[NJM8080G](https://akizukidenshi.com/catalog/g/g107101/)**
  - 低雑音・低歪みと高出力電流を特長とする2回路入りオーディオ用オペアンプです。SOP8パッケージのため、[SOP8-DIP変換基板](https://akizukidenshi.com/catalog/g/g105154/)が必要です。
- **[LT1364](https://akizukidenshi.com/catalog/g/g108467/)**
  - 高速・高スルーレートのデュアルオペアンプです。

{{% /details %}}

## おまけ コンデンサーを交換して遊ぼう
C1・C2には、静電容量0.47 μF・定格電圧50 V以上のコンデンサーを使用できます。以下はいずれも使用可能な候補です。
- [フィルムコンデンサー（ルビコンF2D、0.47 μF 50 V）](https://akizukidenshi.com/catalog/g/g115089/)
- [メタライズドポリエステルフィルムコンデンサー（ニッセイMMT、0.47 μF 50 V）](https://akizukidenshi.com/catalog/g/g105502/)
- [メタライズドポリエステルフィルムコンデンサー（0.47 μF 100 V）](https://akizukidenshi.com/catalog/g/g114601/)
- [積層・無誘導メタライズドポリエステルフィルムコンデンサー（0.47 μF 100 V）](https://akizukidenshi.com/catalog/g/g109791/)
- [積層セラミックコンデンサー（X7R、0.47 μF 50 V）](https://akizukidenshi.com/catalog/g/g108148/)

## 技術スタック
- KiCad
- アナログ回路設計
- プリント基板設計
