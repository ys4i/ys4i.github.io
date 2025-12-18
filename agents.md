# Agents 用メモ（`<username>.github.io`）

## 目的と利用方針
- Portfolio Site の handover メモと同じ内容を、エージェント作業向けに整理したドキュメント。
- Agents は英語で思考し、日本語で応答すること。
- プレースホルダ `<username>` はそのまま残す。

## リポジトリ概要
- 目的
  - 技術系就職活動で提出可能なポートフォリオサイトとして利用する。
  - 自身の HW/SW プロダクト、写真、GitHub リポジトリを一覧・整理して提示する。
- ホスティング
  - GitHub Pages（ユーザーサイト）
  - URL: `https://<username>.github.io/`
- 技術スタック
  - 静的サイト
  - GitHub Pages 標準の Jekyll テーマ（`minima`）を利用

## 現状
- リポジトリルートに `_config.yml` を作成済み（`theme: minima` ほか基本項目設定済み）。
- `index.md` をトップページとして利用中（簡単な自己紹介と代表作数件を Markdown で記載）。
- `projects` / `about` / `contact` は未整備またはドラフト段階。
- README は GitHub 上での説明用として簡易記述。

## 想定サイト構成
- `/`（トップ）：キャッチコピー、3〜4 行の自己紹介、代表作（3〜6 件）のカード表示。
- `/projects`：プロダクト一覧（サムネイル画像、概要文、リポジトリ／記事リンク）。
- `/about`：学歴・専攻・興味分野、スキルセット（言語／ツール／得意領域）。
- `/contact`：メールアドレス、その他連絡先。

## コンテンツ記載ポリシー（就活向け）
- 各プロダクトは以下のフォーマットを基本とする：
  - プロダクト名
  - 概要（何のため、誰のため）
  - 自分の担当（例：回路設計、ファームウェア、筐体設計など）
  - 技術スタック（MCU 名、使用言語、EDA ツール、プロトコルなど）
  - 成果・スケール（製作台数、利用者、イベントでの使用実績など）
  - GitHub リポジトリ／発表スライド／記事へのリンク
  - 写真 1〜数枚（`assets/images/...` に配置）

## 画像運用ルール
- 画像置き場は `assets/images/` に統一する（サイトのルートから参照しやすく、用途別に整理できる）。
- ディレクトリ構成（例）：
  - `assets/images/projects/<project-slug>/...`（プロダクト写真）
  - `assets/images/about/...`（プロフィール/自己紹介用）
  - `assets/images/posts/...`（ブログ用を増やす場合）
- 命名規則：`kebab-case` + 必要なら連番（例：`e-lamp-01.webp`）。スペース/日本語/大文字は避ける。
- 形式の目安：
  - 写真：`webp`（容量優先）
  - スクリーンショット/図：`png`
  - ベクタ図：`svg`（必要なときのみ）
- サイズ/容量の目安：長辺 1600px 程度、1枚 500KB 以下（サムネは 200KB 以下を目安に圧縮・リサイズ）。
- 運用方針：ユーザーが画像を挿入したら、`webp` に変換して参照先を差し替える（元ファイルは残す）。
- 変換コマンド例（ImageMagick）：

```bash
# 例: JPEG -> WebP（向き補正・メタデータ除去・長辺1600px・品質82）
magick assets/images/about/YSP-01.jpeg -auto-orient -strip -resize '1600x1600>' -quality 82 \
  assets/images/about/YSP-01.webp
```

- 参照方法：Markdown 内では `{{ "/assets/images/..." | relative_url }}` を使い、`baseurl` の変更に耐えるようにする。
  - 例：`![Alt text]({{ "/assets/images/projects/e-lamp/e-lamp-01.webp" | relative_url }})`
- アクセシビリティ：画像には必ず内容が分かる `alt` テキストを付ける。

## 開発環境メモ
- 想定 OS：Linux（開発者本人は Arch Linux + zsh を利用）。
- ローカルプレビュー例（必須ではない）：

```bash
bundle install
bundle exec jekyll serve
```

## タスクリスト
- [ ] `projects` ページを作成し、全プロダクトをフォーマット準拠で掲載する。
- [ ] `about` ページに学歴・興味分野・スキルセットを整理して記載する。
- [ ] `contact` ページにメールアドレスなどの連絡先を掲載する。
- [ ] プロダクト写真を `assets/images/...` に配置し、各ページから参照する。

## 更新履歴
- 2025-11-20: `agents.md` 初版作成（handover メモをエージェント向けに整理）。
- 2025-12-18: 画像運用ルールを追記（配置先/命名/形式/参照方法/変換コマンドの統一）。
