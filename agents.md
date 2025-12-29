# Agents 用メモ（`<username>.github.io` / Hugo + Stack）

## 目的と利用方針
- Portfolio Site の handover メモを、Hugo 移行後の現状に合わせて整理したドキュメント。
- Agents は英語で思考し、日本語で応答すること。
- プレースホルダ `<username>` はそのまま残す。
- エージェントは `.agents/profile_review_checklist.md` を基に /profile を添削・校正し、ユーザーを支援すること。

## リポジトリ概要
- 目的
  - 自身の作品を広く知ってもらう広報
  - 技術系就職活動で提出可能なポートフォリオサイトとして利用する。
  - 自身の HW/SW プロダクト、写真、GitHub リポジトリを一覧・整理して提示する。
- ホスティング
  - GitHub Pages（ユーザーサイト）
  - URL: `https://<username>.github.io/`
- 技術スタック
  - 静的サイト（Hugo + hugo-theme-stack）
  - GitHub Actions でビルドして Pages にデプロイ
  - ローカルは Docker で Hugo を実行

## サイト方針（要件）
- 優先順位
  - Profile → Projects → Contact
  - ブログは現時点で不要
- メニュー順
  - Profile / Projects / Contact
- Projects カードの必須項目
  - `title` / `description` / `image` / `tags`

## 現状
- Hugo 初期化済み（`hugo.yaml` がルートに存在）。
- テーマは submodule（`themes/hugo-theme-stack`）。
- コンテンツ骨組みは `content/` 配下に作成済み（`page` / `projects`）。
- 旧 Jekyll データは移植済みのため **削除方針**。

## 想定サイト構成
- `/`（トップ）
  - Stack のホームとして Projects 一覧が出る（`params.mainSections: [projects]`）。
- `/profile`
  - Profile ページ（最優先ページ）。
- `/projects`
  - プロジェクト一覧（カード表示）。
- `/projects/<slug>/`
  - 各プロジェクトの詳細ページ（Page Bundle）。
- `/contact`
  - 連絡先。

## コンテンツ記載ポリシー（就活向け）
- /profile は **`.agents/profile_review_checklist.md` を最優先**で遵守する。詳細な指針・チェックは必ず参照する。
- /profile は「概要 + 代表実績 + 次アクション導線（Projects/Contact）」に絞り、詳細は /projects に分離する。
- /projects（詳細）は以下の型を基本とする：
  - プロダクト名
  - 概要（何を／誰のため）
  - 自分の担当（例：回路設計、ファームウェア、筐体設計など）
  - 技術スタック（必要最小限の列挙）
  - 成果（数値 or 事実）
  - 主要導線 1つ（個別ページ／GitHub／動画 などから1つ）
  - 写真 1〜数枚

## 整列表記（Markdown 表を使わない）
- ユーザーが「Markdown 表を使わないで整列」などと依頼した場合にこの作業を提案、実施
- ラベルと値を揃えたい場合は `<dl class="profile-grid">` を使う。
- `dt` にラベル、`dd` に値を入れて 1 ペア 1 行にする。
- URL などは `<a class="link">` で包み、Hugo のリンクホバーと同じ挙動に揃える。
  - 外部リンクは `target="_blank" rel="noopener"` を付ける。
- スタイルは `assets/scss/custom.scss` に以下を追加（既にあれば流用）。

```scss
.profile-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.25rem 1rem;
  margin: 0;
}

.profile-grid dt {
  font-weight: 600;
}

.profile-grid dd {
  margin: 0;
}
```

## 画像運用ルール
- 画像置き場の原則
  - Projects: **Page Bundle に同梱**（例：`content/projects/<slug>/cover.webp`）
  - Profile: **Page Bundle に同梱**（例：`content/page/profile/cover.webp`）
  - 共通画像: `static/assets/images/about/` に配置
- 命名規則
  - `kebab-case` + 必要なら連番（例：`e-lamp-01.webp`）
  - スペース/日本語/大文字は避ける
- 形式の目安
  - 写真: `webp`（容量優先）
  - スクリーンショット/図: `png`
  - ベクタ図: `svg`（必要なときのみ）
- サイズ/容量の目安
  - 長辺 1600px 程度、1枚 500KB 以下（カード用途は 200KB 以下目標）
- 参照方法
  - Projects のカバー: front matter の `image: cover.webp`
  - About 内の画像: `/assets/images/about/...` を直接参照
- アクセシビリティ
  - 画像には内容が分かる `alt` テキストを付与

## 開発環境メモ
- 想定 OS：Linux（開発者本人は Arch Linux + zsh を利用）。
- ローカルプレビュー（Docker）
  - `docker compose up`
  - `http://localhost:1313/` で確認
- fast render が反映されにくい場合
  - `docker-compose.yml` の `command` に `--disableFastRender` を追加

## タスクリスト
- [x] Projects の各カードに `image` と `tags` を必須で揃える。
- [x] Projects の詳細に「担当/技術スタック/成果」を追記する。
- [x] Contact の記載を確認する。
- [x] 旧 Jekyll データを削除する（`Jekyll_data/` など）。

## 更新履歴
- 2025-12-22: Hugo + Stack 移行版として作成。
- 2025-12-30: タスクリストの進捗更新、Profile/画像運用ルールの整合を反映。
