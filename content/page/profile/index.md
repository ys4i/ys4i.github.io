---
title: yasushi
slug: Profile
description: 回路とソフトウェアで体験を届ける
image: cover.webp
layout: profile
menu:
  main:
    name: Profile
    weight: -100
    params:
      icon: user
---

<!-- 概要: Profileページは layout: profile でヘッダー画像を非表示にした。編集箇所: 本ファイルと layouts/page/profile.html -->

{{< figure src="profile_3x2.webp" alt="プロフィール画像" >}}
聞いて、整理して、作る。要件とプロダクトをつなぐエンジニアです。  
試作から製品化・展示まで、体験として仕上げます。  
## 自己紹介  
<dl class="profile-grid">
  <dt>ハンドルネーム</dt><dd>やすし (yasushi)</dd>
  <dt>大学・専門</dt><dd>学部生(理系) 電気電子工学、情報系</dd>
  <dt>技術・開発</dt><dd>技術系団体 souz(そうぞう) 代表</dd>
</dl>

## 実績 / 経歴
<dl class="profile-grid">
  <dt>実務経験</dt><dd>「e-lamp」他 ODM供給・受託</dd>
  <dt>雑誌掲載</dt><dd>「@DIME」・「ステレオ時代neo」</dd>
  <dt>代表作</dt><dd>「YSP-01」・「Analightic」</dd>
</dl>

{{% details summary="**実績 / 経歴 / メディア掲載 詳細（クリックで開閉）**" class="details-outline" %}}  

| 年 | 実績 / 経歴 / メディア掲載 | 備考 |
| --- | --- | --- |
| 2018 | エコ1チャレンジカップ2018 | 4位 |
| 2018 | 第61回フィールドデーコンテスト | 電信電話部門マルチオペジュニア XMJ 3位 |
| 2023~ | 自主制作プロダクトの展示・頒布を開始 |  |
| 2023~24 | e-lamp社「e-lamp ONE」「e-lamp ONE sky」をODM供給 |  |
| 2023 | 「@DIME」誌(小学館) 掲載 | 記事内[5ページ](https://dime.jp/genre/1689809/5/) に<span style="white-space: nowrap;">「YA-YMH142」</span>が掲載 |
| 2025 | 「エレキ万博」LT登壇 | [公式HP](https://eleki-expo2025.cqpub.co.jp/) |
| 2025 | 「ステレオ時代neo」誌(合同会社ステレオ時代) Vol.10 掲載 | [雑誌紹介ページ](https://stereojidai.com/blogs/news/%E3%82%B9%E3%83%86%E3%83%AC%E3%82%AA%E6%99%82%E4%BB%A3neo-vol-10%E3%81%AF2025%E5%B9%B49%E6%9C%883%E6%97%A5%E7%99%BA%E5%A3%B2%E3%81%A7%E3%81%99) | 

このほか雑誌執筆、学会発表(登壇/ポスター)予定。
{{% /details %}}

## スキル / 強み
回路、ソフトウェアからユーザー体験までを俯瞰し、量産・頒布・マーケティングまで見据えた設計提案と、短期プロトタイピングを両立できます。  

{{% details summary="**スキルセット詳細（クリックで開閉）**" class="details-outline" %}}  
- **プログラミング言語 / ファームウェア開発**
  - C / C++(8年): 競技用電気自動車のブラシレスモータ正弦波駆動、ワイヤレスDAC用ファームウェア開発
  - Python(7年): データ分析、画像認識
- **開発環境**
  - Arch Linux(4年): 開発環境として使用(パッケージマネージャで依存関係・ツールを管理)
  - Docker: 開発環境のコンテナ化、顧客への迅速な環境引き渡し
  - Git: バージョン管理と迅速な切り戻し
- **組込みプラットフォーム**
  - Arduino(8年): 顧客企業向けIoTデバイスのファームウェア開発
  - RaspberryPi, ESP32, nRF系マイコン: IoT機器試作・開発
  - STM32, CH32, ATtiny: USB機器・省電力機器試作・検証
- **電子回路 / 基板 / シミュレーション**
  - Eagle(3年): 競技用電気自動車のブラシレスモータ正弦波駆動回路の設計
  - KiCad(4年): アンプ、DC-DC、LDO、IoT機器の回路・PCB設計
  - LTspice: 回路シミュレーション
- **CAD / デザイン**
  - 3DCAD
    - Autodesk Fusion: 機器筐体の作成
    - Onshape: 機器筐体の作成
    - openSCAD(プログラムで3Dモデルを定義): 治具の自動生成
  - デザイン
    - Adobe Illustrator: 切削加工用データ作成、宣伝用ポスター作成
    - Canva: 宣伝用ポスター作成
- **計測 / 実験**
  - オシロスコープ: 動作確認、各種デバッグ
  - スペクトラムアナライザ: 電源リプル、スパイク評価
  - ネットワークアナライザ: アンプ性能評価
  - ひずみ計: アンプひずみ率測定
{{% /details %}}

## 主なプロジェクト
1. **ワイヤレススピーカー「YSP-01」**
  {{< figure src="/assets/images/about/YSP-01.webp" alt="ワイヤレススピーカー「YSP-01」" >}}
  音楽を聴くだけでなく、見て楽しめる、魅せるスピーカー  
  [YSP-01紹介ページ]({{< relref "projects/ysp-01/index.md" >}})  

1. **ランプシェード「Analightic」**
  <video controls playsinline preload="metadata" width="100%" muted loop autoplay>
    <source src="/assets/videos/analightic.mp4" type="video/mp4">
    お使いのブラウザは動画に対応していません。
  </video>
  数式由来の連続曲面が浮かび上がるランプシェード  
  [Analightic紹介ページ]({{< relref "projects/analightic/index.md" >}})    

**この他[プロジェクトの一覧]({{< relref "/" >}})も併せてご覧ください** 

## ODM供給・業務委託事例
※全案件は守秘義務・知財・情報管理を遵守したうえで、反社排除を含む契約上の条項に従って取引しています。  
1. **心拍可視化デバイス「e-lamp」**
  {{< youtube u3EIpsf70VQ >}}
  担当: 回路設計・ファームウェア開発・展示会デモ運用  
  成果: センサーモジュールから量産/市場投入まで一貫対応  
  [紹介ページ]({{< relref "projects/e-lamp/index.md" >}})

1. **(匿名1)オーディオ専業メーカー様向け製品開発**  
  {{< figure src="wirelessDAC.webp" alt="ワイヤレスオーディオレシーバー イメージ図" class="img-figure" caption="※画像はイメージ図で実際と異なります" >}}
  担当: 無線 + DAC 搭載オーディオ機器の開発・試作  
  成果: 一次試作機を納品、フィードバックを基に二次試作中  

1. **(匿名2)電子機器メーカー様: 回路シミュレーション(LTspice)**
  {{< figure src="spice.webp" alt="シミュレーションイメージ図" class="img-figure" caption="※画像はイメージ図で実際と異なります" >}}
  担当: フィルタ回路の設計・AC 解析(ゲイン/位相)  
  成果: 仕様帯域の通過/不要帯域の抑圧を満たす回路として納品  

※ODM供給: 他社ブランド製品を、設計から量産まで一括で受託して供給すること  
※秘密保持契約(NDA)により、取引先名/型番/数量などの詳細を公開できない案件・実績が複数あります。    
面談などでは開示可能範囲で担当範囲・設計意図・成果を説明可能です。  

<!-- 
## 現在の関心・目標
半導体に興味があります。
-->

## 連絡先
<dl class="profile-grid">
  <dt>Email</dt><dd><a class="link" href="mailto:yasushitech@gmail.com">yasushitech@gmail.com</a></dd>
  <dt>GitHub</dt><dd><a class="link" href="https://github.com/ys4i" target="_blank" rel="noopener">https://github.com/ys4i</a></dd>
  <dt>Twitter</dt><dd><a class="link" href="https://twitter.com/yasushi_tech" target="_blank" rel="noopener">https://twitter.com/yasushi_tech</a></dd>
</dl>
※上記のほか、所属大学のメールアドレスからご連絡する場合があります。
