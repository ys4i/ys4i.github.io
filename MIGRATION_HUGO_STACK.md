# Hugo Theme Stack への移行手順書（Portfolio / Projects中心）

このリポジトリは現状 Jekyll（`_config.yml` + `theme: minima`）で運用されています。指定テーマ「Hugo Theme Stack」は **Hugo 専用**のため、CSS差し替えではなく **Jekyll → Hugo へ移行**し、GitHub Pages を **GitHub Actions デプロイ**に切り替える必要があります。

---

## 0. ゴール（この手順書の完了条件）

- GitHub Pages の公開 URL（ユーザーサイト想定：`https://ys4i.github.io/`）が **Stack デザイン**で表示される
- トップページに **Projects 一覧**が表示される（ブログではなく作品一覧が主）
- `/projects/` に作品の一覧、`/projects/<slug>/` に各作品ページが存在する
- `/about/` に自己紹介、`/contact/` に連絡先が存在する
- GitHub Actions が成功し、`main` push で自動デプロイされる
- ローカルでも `hugo server` で確認できる

---

## 1. 事前準備（作業開始前）

### 1.1 作業ブランチと切り戻し

1. 作業用ブランチを作成
   - `git switch -c migration/hugo-stack`
2. 切り戻し用に現状へタグ付け（任意）
   - `git tag jekyll-minima-last`
3. 変更を小さく刻む（推奨）
   - 「Hugoでビルドできる状態」→「Projects表示」→「About移行」→「Actionsで公開」→「旧ファイル整理」

### 1.2 ローカル環境（必須）

- 必須ツール
  - **Hugo Extended**（Stack は SCSS を `toCSS` でビルドするため）
    - 確認：`hugo version`
    - 出力に `extended` が含まれること（例：`hugo vX.Y.Z+extended ...`）
  - **git**（テーマを submodule で導入する想定のため）
- 推奨
  - ローカルの Hugo バージョンを GitHub Actions の `hugo-version` と揃える（差分調査がラク）
  - `hugo server -D` でローカルプレビューできること（SCSS が通る＝Extended の確認にもなる）

（参考）例：Arch Linux
- `sudo pacman -S hugo`

---

### 1.3 退避してクリーン構築（任意：一から作り直したい場合）

「現状（Jekyll/minima）を確実に残しつつ、Hugo/Stack をクリーンに作り直す」ための手順です。  
推奨は **`git worktree` で別ディレクトリに新環境を作る**方法です（今の作業ツリーを壊しません）。

#### 方法A（推奨）：`git worktree` で別作業ディレクトリに再構築

1. 現行をクリーンにする
   - `git status` で変更が無い状態にする（必要なら commit / stash）
2. 退避ブランチ・タグを作る（切り戻し用）
   - `git switch main`
   - `git pull --ff-only`（任意：最新化）
   - `git branch backup/jekyll-minima-$(date +%Y%m%d)`
   - `git tag backup-jekyll-minima-$(date +%Y%m%d)`
   - `git push origin backup/jekyll-minima-$(date +%Y%m%d) --tags`
3. 追加の保険（ローカルに完全バックアップ。任意だが推奨）
   - `git bundle create ../ys4i.github.io-backup-$(date +%Y%m%d).bundle --all`
4. クリーン構築用の worktree を作成（別ディレクトリに新ブランチをチェックアウト）
   - `git worktree add -b rebuild/hugo-stack ../ys4i-hugo main`
   - `cd ../ys4i-hugo`
5. 既存ファイルを削除（この worktree 側だけで実行）
   - tracked を全削除：`git rm -r -- .`
   - untracked が残る場合のみ（危険・必要時だけ）：`git clean -fdx`
6. Hugo サイトを初期化
   - `hugo new site . --force`
7. テーマ導入（Submodule）
   - `git submodule add https://github.com/CaiJimmy/hugo-theme-stack.git themes/hugo-theme-stack`
   - `git submodule update --init --recursive`
8. 以降は本手順書に沿って構築
   - `hugo.yaml` 作成（「4. Hugo 設定ファイル作成」）
   - `content/` 作成（「5. コンテンツ移行」）
   - `assets/scss/custom.scss` 作成（「6. 画像配置と CSS 移行」）
   - `.github/workflows/pages-hugo.yml` 作成（「7. GitHub Actions で GitHub Pages にデプロイ」）
9. ローカル起動で確認
   - `hugo server -D`

#### 方法B（代替）：別ディレクトリに clone して再構築

`git worktree` を使わない場合は、別ディレクトリに clone して新ブランチで作業します。

1. 退避ブランチ・タグ作成は「方法A」の手順2と同じ
2. 別ディレクトリに clone
   - `cd ..`
   - `git clone https://github.com/ys4i/ys4i.github.io.git ys4i-hugo`
   - `cd ys4i-hugo`
3. 新ブランチを作成
   - `git switch -c rebuild/hugo-stack`
4. 以降の「削除 → Hugo 初期化 → テーマ導入」は「方法A」の手順5〜9と同じ

Notes:
- 「方法A/方法B」とも、最終的に `rebuild/hugo-stack` を PR して `main` にマージし、GitHub Pages を Actions に切り替えます（「7. GitHub Actions...」「7.1 Pages の設定」）。

## 2. 最終的なディレクトリ構成（推奨）

移行後の目安（最小構成）です。

```
.
├── hugo.yaml
├── content/
│   ├── page/
│   │   ├── about/index.md
│   │   └── contact/index.md
│   └── projects/
│       ├── _index.md
│       ├── ysp-01/
│       │   ├── index.md
│       │   └── cover.webp
│       └── e-lamp/
│           ├── index.md
│           └── cover.webp
├── static/
│   └── assets/
│       └── images/
│           └── about/
│               └── YSP-01.webp
├── assets/
│   └── scss/
│       └── custom.scss
└── .github/
    └── workflows/
        └── pages-hugo.yml
```

- `content/projects/<slug>/index.md` は **Page Bundle**（同階層に画像を置く）にすると、Stack の画像処理（リサイズ等）が効いて便利です。
- 既存の `assets/images/about/...` は、パス互換を保つため `static/assets/images/about/...` に置くのがラクです（URL が `/assets/images/...` のまま使える）。

---

## 3. テーマ導入（Submodule 推奨）

> 方針：更新容易・Actions でも扱いやすいので submodule を推奨

1. テーマを submodule として追加
   - `git submodule add https://github.com/CaiJimmy/hugo-theme-stack.git themes/hugo-theme-stack`
2. submodule 初期化
   - `git submodule update --init --recursive`

（補足）submodule が嫌なら、テーマを `themes/` に通常 clone してもOK。ただし更新追従が手作業になります。

---

## 4. Hugo 設定ファイル作成（`hugo.yaml`）

### 4.1 方針（Portfolio向けの要点）

- トップに Projects を出す：`params.mainSections: [projects]`
- 日本語 UI：`DefaultContentLanguage: ja` + `hasCJKLanguage: true`
- HTML 埋め込み（iframe等）を許可：`markup.goldmark.renderer.unsafe: true`
- 読了時間は不要：`params.article.readingTime: false`
- コメントは不要：`params.comments.enabled: false`
- 右サイドバーは最初は無し（必要なら後で追加）：`params.widgets.homepage: []`

### 4.2 `hugo.yaml` のたたき台（最小）

`themes/hugo-theme-stack/exampleSite/hugo.yaml` を参考にしつつ、まずは以下の最小構成で起動できる状態を作ります。

```yaml
baseurl: https://ys4i.github.io/
languageCode: ja-jp
title: ys4i portfolio
theme: hugo-theme-stack

DefaultContentLanguage: ja
hasCJKLanguage: true

pagination:
  pagerSize: 12

permalinks:
  page: /:slug/

params:
  mainSections:
    - projects

  sidebar:
    subtitle: 電気電子 × ソフトウェアで IoT を形にするエンジニア
    avatar:
      enabled: false

  article:
    toc: true
    readingTime: false

  comments:
    enabled: false

  widgets:
    homepage: []
    page:
      - type: toc

menu:
  social:
    - identifier: github
      name: GitHub
      url: https://github.com/ys4i
      params:
        icon: brand-github

markup:
  goldmark:
    renderer:
      unsafe: true
```

Notes:
- `baseurl` はユーザーサイトなら `https://<username>.github.io/`。プロジェクトページ（`https://<username>.github.io/<repo>/`）の場合はここが変わります。
- 右サイドバーを活用する場合は、後から `params.widgets.homepage` に `search` 等を追加できます。

---

## 5. コンテンツ移行（Jekyll → Hugo）

### 5.1 Projects セクション作成

1. `content/projects/_index.md` を作成（Projects 一覧ページ）
   - 目的：`/projects/` のリストページを作り、メニューにも出す
2. 作品ごとに `content/projects/<slug>/index.md` を作成（各作品ページ）
   - 画像は同ディレクトリに置く（例：`cover.webp`）
   - Front matter の `image: cover.webp` でカード画像が出る

`content/projects/_index.md` 例：

```markdown
---
title: Projects
description: 作品とリポジトリの一覧
menu:
  main:
    weight: -100
    params:
      icon: layout-grid
---
```

各プロジェクト `content/projects/ysp-01/index.md` 例（雛形）：

```markdown
---
title: YSP-01
description: 音と光で魅せるワイヤレススピーカー
image: cover.webp
date: 2023-01-01
categories: [Hardware, Firmware]
tags: [ESP32, Audio, IoT]
---

## 概要
- 何のための作品か、誰向けか

## 自分の担当
- 回路設計 / FW / 筐体 など

## 技術スタック
- MCU / 言語 / ツール / プロトコル

## リンク
- GitHub: https://github.com/...
- 紹介記事: https://...
```

Tips:
- 「日付が要らない」場合、Stack は `.Date` が入ると表示します。最初は気にせず入れて、後で「日付非表示」にしたくなったら theme override で対応できます。

### 5.2 About ページ移行（`about.md` を移す）

1. 既存 `about.md` の内容を `content/page/about/index.md` に移植
2. Jekyll 固有の front matter を Hugo 用に置換
   - 削除：`layout: page` / `permalink: /about/`
   - 追加：`menu.main`（メニューに出す）、`title`, `description`
3. Liquid 記法を除去
   - 置換例：`{{ '/assets/images/about/YSP-01.webp' | relative_url }}` → `/assets/images/about/YSP-01.webp`

`content/page/about/index.md` の front matter 例：

```yaml
---
title: About
description: プロフィールとスキルセット
menu:
  main:
    weight: -90
    params:
      icon: user
---
```

### 5.3 Contact ページ新規作成

1. `content/page/contact/index.md` を作成
2. 連絡先（Email/GitHub/Twitter）を記載
3. メニューに出す（任意）

例：

```markdown
---
title: Contact
description: 連絡先
menu:
  main:
    weight: -80
    params:
      icon: mail
---

- Email: yasushitech@gmail.com
- GitHub: https://github.com/ys4i
- Twitter: https://twitter.com/yasushi_tech
```

---

## 6. 画像配置と CSS 移行

### 6.1 既存画像の移動

既存：`assets/images/about/...`（Jekyll用）

推奨：Hugo の `static/` に移す（ビルド不要・そのまま配信される）

1. `static/assets/images/about/` を作る
2. 画像を移動（またはコピー）
   - `assets/images/about/YSP-01.webp` → `static/assets/images/about/YSP-01.webp`

この方針なら、Markdown/HTML 内の参照は `/assets/images/about/...` で統一できます。

### 6.2 SCSS（`assets/main.scss` → `assets/scss/custom.scss`）

Stack は `assets/scss/custom.scss` を読み込みます（テーマ側 `style.scss` が `custom.scss` を import）。

1. `assets/scss/custom.scss` を作成
2. 既存の `assets/main.scss` から以下を移植
   - 削除：先頭の `---` `---`（Jekyll front matter）
   - 削除：`@import "minima";`
   - 残す：`.media` / `.embed-16x9` などのクラス定義

（チェック）`about` 内の `<div class="media ...">` などの HTML が Hugo 側でも表示されること（`markup.goldmark.renderer.unsafe: true` が必須）。

---

## 7. GitHub Actions で GitHub Pages にデプロイ

### 7.1 Pages の設定（GitHub UI）

1. GitHub リポジトリ Settings → Pages
2. Source を **GitHub Actions** に設定

### 7.2 Workflow 追加（`.github/workflows/pages-hugo.yml`）

以下の要件を満たす workflow を追加します。

- `actions/checkout` で submodule も取得（Stack を submodule で入れた場合）
- Hugo Extended をセットアップ
- `hugo --minify` で `public/` を生成
- `actions/upload-pages-artifact` → `actions/deploy-pages`

雛形（そのまま使える想定）：

```yaml
name: Deploy Hugo site to Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch: {}

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: "0.150.0"
          extended: true

      - name: Build
        run: hugo --minify

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Notes:
- `hugo-version` は固定推奨（ローカルとの差分を減らすため）。
- user site の場合、通常 `baseurl` は `https://<username>.github.io/` でOK。

---

## 8. 動作確認（ローカル→Actions→本番）

### 8.1 ローカル

1. `hugo server` で起動
   - `hugo server -D`
2. 確認観点
   - トップに Projects が並ぶ（`params.mainSections` の効き）
   - `/projects/` の一覧が表示される
   - 各 project で `image` が表示される（`cover.webp` を置いた場合）
   - `/about/` の埋め込み iframe / 画像が表示される

### 8.2 GitHub Actions

1. `main` に push
2. Actions タブで workflow 成功を確認
3. Pages の URL で表示確認

---

## 9. 旧 Jekyll ファイルの扱い（最後にやる）

移行が安定するまでは「残しておく」でも動作します（Actions で Hugo ビルドするため）。

ただし運用を明確にするため、最終的には整理推奨：

- 削除/移動候補
  - `_config.yml`（Jekyll設定）
  - ルートの `index.md`（Hugo では通常使わない）
  - ルートの `about.md`（移植後は不要）
  - `assets/main.scss`（移植後は不要）

整理方針（例）：
- `legacy/jekyll/` に退避してから削除
- README に「Hugo + Stack に移行済み」を明記

---

## 10. よくあるハマりどころ（トラブルシュート）

- **SCSS がビルドできない**
  - Hugo が extended ではない可能性 → `hugo version` を確認
  - Actions の `extended: true` を確認
- **画像が出ない**
  - `image:` の値が Page Bundle 内にない（`index.md` と同階層に置く）
  - `static/` 配下に置く場合は `/assets/...` のパスが正しいか確認
- **iframe/HTML が表示されない**
  - `markup.goldmark.renderer.unsafe: true` を確認
- **トップに Projects が出ない**
  - `params.mainSections` が `projects` になっているか
  - `content/projects/...` に通常ページ（`index.md`）があるか
- **Actions でテーマが見つからない**
  - submodule を使っているのに checkout の `submodules: recursive` が無い

---

## 11. 追加改善（移行後にやると良い）

- Projects のテンプレ化
  - `archetypes/projects.md` を作って `hugo new projects/<slug>/index.md` で雛形生成
- 「Projects をカードで見せる」UIを強化
  - `description` と `image` を必須運用に
  - `tags` を整理して検索性を上げる
- トップに自己紹介を出す（任意）
  - Stack の `sidebar.subtitle` で最低限は可能
  - さらに必要なら `layouts/index.html` を site 側で override して、Projects リストの上に「キャッチコピー/自己紹介」ブロックを追加
