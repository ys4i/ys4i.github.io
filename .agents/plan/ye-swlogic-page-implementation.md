# YE-SWlogic 製品ページの調査と実装案

調査日: 2026-10-18（日本時間）

## 1. 推奨する構成

`https://ys4i.jp/YE-SWlogic/` に、YE-BM83-devkitと同じHugoの製品ページを作成した。
ページの内容は「概要・主な特長 → 説明書 → 秋月電子 一括注文 → 発注数量について」とする。
AND・ORを1ページで紹介し、共通の取扱説明書と、AND用・OR用の回路図を配布する。

この文書は最初の調査・実装案に加え、実装内容と残作業を記録する。

## 2. 調査結果

### 既存サイトと参考ページ

- サイトはHugo + hugo-theme-stack。参考ファイルは [`content/projects/YE-BM83-devkit/index.md`](../../content/projects/YE-BM83-devkit/index.md)。依頼文の「YE-bm83-deykit」に対応する既存ページはこの製品と判断した。
- 参考ページはfront matterの `url: /YE-BM83-devkit/` でルート直下のURLを指定し、画像とPDFをPage Bundleに同梱している。
- トップページは `projects` セクションの通常ページを自動で一覧表示する。新しいPage Bundleを追加すればカードにも掲載される。`/projects/` はトップへの転送ページ。
- 共通テーマでカバー画像、目次、ダークモードが用意されているため、初期実装はMarkdown・画像・PDF・同期スクリプトの追加で対応できる。
- 既存のPDF同期は [`scripts/sync-ye-bm83-manual.sh`](../../scripts/sync-ye-bm83-manual.sh) と [`.githooks/pre-commit`](../../.githooks/pre-commit) を使用。取得元は `ys4i/YE-BM83-devkit` の `master`。
- GitHub Actionsはサイトリポジトリにコミット済みのPDFでビルドする。取得元リポジトリへのアクセスはローカル同期時に行う。

### 公開URL

HTTPリクエストで以下を確認した。

| URL | 調査時の結果 |
| --- | --- |
| `https://ys4i.jp/YE-BM83-devkit/` | 200。canonicalも同じURL |
| `https://ys4i.jp/YE-SWlogic/` | 404 |
| `https://ys4i.github.io/YE-BM83-devkit/` | `ys4i.jp` の既存ページへ転送して200 |
| `https://ys4i.github.io/YE-SWlogic/` | 404 |

`hugo.yaml` の `baseurl` は `https://ys4i.github.io/` だが、公開ビルドではActionsの `configure-pages` が返すURLを `--baseURL` に渡している。
今回のページは `url: /YE-SWlogic/` で追加する。公開後にcanonical・画像・PDFのホストを確認する。Pages設定・DNSの変更は現時点で必要と判断する根拠がない。

### YE-SWlogicの資料

取得元はサイトリポジトリの隣にある `../YE-SWlogic`。

- `manual/manual.pdf`: A4・4ページ、Rev.2026-10-18。1ページ目と4ページ目のサポート案内に `https://ys4i.jp/YE-SWlogic/` が記載されている。本文抽出と該当ページの画像表示で確認。
- `manual/manual.md`: YAMLの `manual.support-url` も同じURL。
- `manual/fig/schematic_and.pdf` と `manual/fig/schematic_or.pdf`: 配布する回路図がローカルに存在する。
- `manual/fig/render_3d.png`: AND・OR基板を左右に並べた既存画像。目視確認済み。約516 KiBなのでWebPに変換してカバーに利用する。
- 取得元: `git@github.com:ys4i/YE-SWlogic.git`、ブランチ: **`main`**。配布PDFはコミット `5ec82f9719b0ba77cccf970847ae70028fdeaab6` で管理対象にし、プッシュ済み。
- 調査時のローカルHEADとリモート `refs/heads/main` は、ともに `f7d4b8fe656d229eb337023e4a642bec72d6c5af`。通常の `git status --short` に変更表示はなかった。

### 自動同期の取得元

調査開始時、3つのPDFは取得元の `manual/.gitignore` の `*.pdf` によって除外され、リモートmainから取得できなかった。`manual/.gitignore` に対象3ファイルだけを管理対象にする例外を追加し、同じコミットでPDFをGit管理してリモートmainにプッシュした。

同期スクリプトは、まずリモートを確認する。PDFが見つからない場合は、リモートmainとHEADが一致する `../YE-SWlogic` のPDFを使う。一致しなければ同期を止め、別の設計版のPDFが混ざるのを防ぐ。現在はPDFがリモートにあるため、通常のリモート同期を使う。

## 3. ページの内容案

### front matter

```yaml
---
title: YE-SWlogic
url: /YE-SWlogic/
description: スイッチで学ぶAND・OR論理回路キット
image: cover.webp
categories:
  - Hardware
tags:
  - KiCad
---
```

タイトルはシリーズ名で統一し、本文ではAND版を `YE-SW-AND`、OR版を `YE-SW-OR` と記す。基板シルク上の `YE-SWlogic-AND` / `YE-SWlogic-OR` と混同しない。

### 概要・主な特長

導入文の案:

> YE-SWlogicは、2つのタクトスイッチとLEDでAND・ORの動作を学べる電子工作キットです。直列接続のYE-SW-ANDと並列接続のYE-SW-ORの2種類があり、スイッチを押したときのLEDの点灯で、論理回路の基本を確かめられます。

続けて、説明書に記載された内容を簡潔に掲載する。

- AND版: 2つのスイッチを両方押すと点灯。
- OR版: 片方または両方のスイッチを押すと点灯。
- スルーホール部品を使う、はんだ付け式の入門工作キット。
- 電源は単3乾電池2本のDC 3 V。乾電池は別途用意。
- 基板寸法32.0 × 24.0 mm、板厚1.6 mm。消費電流は約1 mA（説明書記載値）。

詳細な組み立て手順と真理値表は共通PDFに集約し、WebページにはBM83と同程度の短い概要を載せる。

### 説明書

```markdown
## 説明書

- [取扱説明書（AND・OR共通／PDF）](./manual/manual.pdf)
- [回路図（YE-SW-AND／PDF）](./manual/fig/schematic_and.pdf)
- [回路図（YE-SW-OR／PDF）](./manual/fig/schematic_or.pdf)
```

### 秋月電子 一括注文

初期実装ではANDまたはORの **基板1枚分** を掲載する。基板2枚分を誤って注文しないよう、両方同じリストを使うことを明記する。

```text
125102 1
103647 2
111577 1
110202 1
```

説明書の部品表と、2026-10-18に確認した秋月電子の商品ページを照合した。

| 販売コード | 部品 | 基板1枚分の必要数 | 注文数量と根拠 |
| --- | --- | --- | --- |
| [125102](https://akizukidenshi.com/catalog/g/g125102/) | 1 kΩカーボン抵抗 | 1本 | 1袋。100本入り |
| [103647](https://akizukidenshi.com/catalog/g/g103647/) | タクトスイッチ | 2個 | 2個。1個単位 |
| [111577](https://akizukidenshi.com/catalog/g/g111577/) | 3 mm赤色LED | 1個 | 1個。1個単位 |
| [110202](https://akizukidenshi.com/catalog/g/g110202/) | 単3×2本用・リード線付き電池ボックス | 1個 | 1個。1個単位 |

「発注数量について」で、抵抗は販売単位の都合で余ること、専用基板・説明書・乾電池はこのリストに含まれないことを説明する。
LEDは説明書で同梱色がランダムとされているため、この注文リストは赤色LEDの構成例であることを明記する。
電池ボックス110202は調査時に「在庫かぎり」の表示があった。公開時に販売状況を再確認し、入手不可なら互換品を確認して資料との対応も整理する。価格・在庫数はページ本文に固定掲載しない。

一括注文フォームはBM83と同じ `https://akizukidenshi.com/catalog/quickorder/blanketorder.aspx` へ案内する。

## 4. ファイル配置と変更範囲

```text
content/projects/YE-SWlogic/
├── index.md
├── cover.webp
└── manual/
    ├── manual.pdf
    ├── source-commit.txt
    └── fig/
        ├── schematic_and.pdf
        └── schematic_or.pdf

scripts/sync-ye-swlogic-manual.sh   # 新規
scripts/setup-preview.sh            # 新規
.githooks/pre-commit               # 既存BM83同期に続けてSWlogic同期を実行
agents.md                         # 同期元・操作方法・前提条件を追記
```

- PDFの公開パスは `/YE-SWlogic/manual/manual.pdf`、`/YE-SWlogic/manual/fig/schematic_and.pdf`、`/YE-SWlogic/manual/fig/schematic_or.pdf`。
- カバーは既存の `render_3d.png` をWebPへ変換する。元画像は部品実装前の基板レンダリングなので、完成品写真として説明しない。長辺1600 px程度、200 KB以下を目標にする。
- 既存のテーマ・レイアウト・SCSS・メニュー・Actionsの変更は初期実装には含めない。

## 5. PDF同期の実装

### 取得元側の準備

`YE-SWlogic/manual/.gitignore` の `*.pdf` に対し、次の3つだけ例外を設定して管理対象にする。他の生成PDFまで一括で管理対象にしない。

```gitignore
!manual.pdf
!fig/schematic_and.pdf
!fig/schematic_or.pdf
```

例外設定に加え、PDF3点を取得元コミット `5ec82f9719b0ba77cccf970847ae70028fdeaab6` で追加して `main` にプッシュした。リモート同期でサイト側のPDFと版情報を更新済み。

この手順は生成済みPDFの管理方法を変更するもの。設計データの変更や回路図の再生成は、このページ作成のためには不要。

### サイト側の同期

BM83の実装パターンに合わせ、製品専用の `scripts/sync-ye-swlogic-manual.sh` を追加する。今回の2製品のために同期基盤全体を作り直す必要はない。

- `--update` / `--stage` / `--check` を提供。
- 既定取得元は `git@github.com:ys4i/YE-SWlogic.git`、既定ブランチは `main`。
- 必要なら `YE_SWLOGIC_SOURCE_URL` / `YE_SWLOGIC_SOURCE_REF` で変更できるようにする。
- 一時cloneから3つのPDFを取得し、全ファイルの存在と `%PDF-` ヘッダーを確認してからコピーする。取得元にPDFが未コミットの間は、両リポジトリのHEAD一致を確認し、ローカルのPDFを同期する。
- PDFに対応する取得元コミットIDを `manual/source-commit.txt` に保存する。ローカル作業ツリーのPDFである場合は、そのこともファイルに明記する。
- `--check` は取得元と配置済みPDFを比較し、ローカルPDFへの切り替え時は両方のコミットIDも比較する。取得失敗・PDF形式違反は明示的なエラーにする。
- `--stage` は対象PDFと版情報だけをステージする。取得元の認証失敗時にはコミットを中断する。

現在のpre-commitは `exec` でBM83同期を起動している。その後ろに処理を追加しても実行されないため、BM83同期を通常呼び出しにし、その成功後にSWlogic同期を実行する。`set -euo pipefail` は維持する。

GitHub Actionsは引き続きコミット済みPDFだけを利用し、取得元へのSSH接続やPDFビルド環境を追加しない。

取得元でPDFがリモートにまだない場合は、`source-commit.txt` にローカル作業ツリーのPDFであることを明記する。リモートにPDFがある場合は、取得元コミットIDだけを記録する。

## 6. 実装状況と確認項目

1. **完了:** Page Bundle、製品紹介、PDFリンク、一括注文リストを追加し、既存の基板レンダリングからカバーを作成。
2. **完了:** 3つのPDFと取得元コミット情報を配置。
3. **完了:** 専用同期スクリプトを追加。リモートにPDFがない場合のローカル同期にも対応。
4. **完了:** pre-commitにBM83とYE-SWlogicの同期を順に接続し、`agents.md` を更新。
5. **完了:** プレビュー環境を追加し、Hugo Extended 0.128.0でサイトをビルド。ページとPDF3点をローカルサーバーで確認。
6. **完了:** 取得元にPDF3点と `.gitignore` の変更をコミット・プッシュし、サイトをリモートPDFに同期。
7. **保留:** 公開後に製品ページとPDF URLを確認。

取得元へのコミット・プッシュは完了。サイト本体のコミット・プッシュと公開後のURL確認はこれから行う。

受け入れ条件:

- `/YE-SWlogic/index.html` とPDF3ファイルがビルド結果に存在する。
- トップの製品カードから `/YE-SWlogic/` に到達できる。
- 概要・説明書・一括注文・発注数量の見出しと目次が表示される。
- モバイルとデスクトップ、ライトとダークの表示でカバーとコードブロックが読める。
- PDFの相対リンクがすべて有効で、AND・ORのリンク先が取り違えられていない。
- 同期された3つのPDFが記録された取得元コミットの内容と一致する。
- 同期エラー時に欠けたPDFで正常終了しない。
- 既存BM83ページと同期処理が維持される。
- 公開後は `https://ys4i.jp/YE-SWlogic/` とPDF3URLが200を返し、canonicalも公開先に一致する。

プレビューは `scripts/setup-preview.sh` でHugo Extended 0.128.0をユーザー領域に導入する。Dockerは不要。開発サーバーは `http://127.0.0.1:1313/` で動作し、YE-SWlogicページは `http://127.0.0.1:1313/YE-SWlogic/` で表示する。

## 7. 参照資料

- サイト: [`agents.md`](../../agents.md)、[`hugo.yaml`](../../hugo.yaml)、[Actions](../../.github/workflows/hugo.yml)、[トップのテンプレート](../../layouts/index.html)。
- 参考ページ: [公開中のYE-BM83-devkit](https://ys4i.jp/YE-BM83-devkit/)、[ページ本文](../../content/projects/YE-BM83-devkit/index.md)、[PDF同期](../../scripts/sync-ye-bm83-manual.sh)。
- YE-SWlogic: `../YE-SWlogic/manual/manual.pdf`、`manual/manual.md`、`manual/.gitignore`、`manual/fig/`、`README.md` とGitの管理状況。
- 注文数量の根拠: 第3節の秋月電子公式商品ページ。販売単位は調査日時点のもの。
