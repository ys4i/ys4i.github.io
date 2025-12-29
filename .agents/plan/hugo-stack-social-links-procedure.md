# 作業手順書: Hugo(Theme Stack)に BOOTH / Twitter / Instagram をアイコンで追加

## 0. 目的
- サイドバー（GitHub アイコンが表示される位置）に **BOOTH / Twitter / Instagram** のリンクを **アイコン**で追加する。

---

## 1. 前提
- 対象サイトは **Hugo Theme Stack**（または hugo-theme-stack-starter）。
- Social アイコンは `menu.social`（アイコンのみのメニュー）で定義する。
- `params.icon: <name>` を指定すると、テーマは基本的に `assets/icons/<name>.svg` を参照する。
- **テーマ配下 `themes/...` は編集しない**。追加する場合は **サイト側（プロジェクト直下）の `assets/icons/`** に置く。

---

## 2. 成果物（Deliverables）
1. `assets/icons/booth.svg`（BOOTH アイコン）
2. （不足時のみ）`assets/icons/brand-twitter.svg` / `assets/icons/brand-instagram.svg`
3. 設定ファイル（例: `config/_default/menu.*` or `config/_default/menus.*`）の `menu.social` に3項目を追加
4. ローカル `hugo server` で表示確認済み

---

## 3. 手順

### 3.1 `menu.social` の定義ファイルを特定
- 典型パス例：
  - `config/_default/menu.yaml`
  - `config/_default/menus.toml`
  - `config/_default/config.yaml`
- リポジトリ内検索で以下を探す：
  - `menu:`
  - `social:`
  - `menu.social`

---

### 3.2 BOOTH アイコンを取得（指定の Box リンク）
- BOOTH のアイコンは以下から取得すること：
  - https://pixiv1.app.box.com/s/yj9ymvhbnpcbj22vfkkzctugzv46cnos/file/1954332587470

#### 3.2.1 取得後の配置
1. プロジェクト直下に `assets/icons/` が無ければ作成
2. 取得したアイコンを **`booth.svg`** として配置：
   - `assets/icons/booth.svg`

> 注意  
> - 取得物が SVG でない（PNG 等）場合でも、最終的に `assets/icons/booth.svg` に揃えること。  
>   可能なら公式提供の SVG を優先し、やむを得ない場合のみ SVG 化（ベクタライズ or 埋め込み）する。

---

### 3.3 Twitter / Instagram アイコンの準備（同梱確認→不足なら追加）
1. まず、テーマが同梱しているか確認（確認のみ。編集しない）：
   - `themes/hugo-theme-stack/assets/icons/brand-twitter.svg`
   - `themes/hugo-theme-stack/assets/icons/brand-instagram.svg`

2. **無い場合**、Tabler Icons などから SVG を取得し、サイト側へ配置：
   - `assets/icons/brand-twitter.svg`
   - `assets/icons/brand-instagram.svg`

> 補足（任意）  
> - 「Twitter」ではなく「X」のロゴにしたい場合は `brand-x.svg` を用意し、`icon: brand-x` に変更する。

---

### 3.4 `menu.social` にリンク3件を追加
- 既存の GitHub 等は保持したまま、追記する。
- `weight` は並び順（小さいほど上）。
- `newTab: true` 推奨（外部リンクを新規タブにする）。

#### YAML 例（`menu.yaml` / `menus.yaml` の場合）
```yaml
menu:
  social:
    # 既存: github 等があればここに残す

    - identifier: twitter
      name: Twitter
      url: https://twitter.com/<your_id>
      weight: 20
      params:
        icon: brand-twitter
        newTab: true

    - identifier: instagram
      name: Instagram
      url: https://instagram.com/<your_id>
      weight: 30
      params:
        icon: brand-instagram
        newTab: true

    - identifier: booth
      name: BOOTH
      url: https://booth.pm/ja/items/xxxxxxxx
      weight: 40
      params:
        icon: booth
        newTab: true
```

#### TOML 例（`menus.toml` の場合）
```toml
[[social]]
identifier = "twitter"
name = "Twitter"
url = "https://twitter.com/<your_id>"
weight = 20

  [social.params]
  icon = "brand-twitter"
  newTab = true

[[social]]
identifier = "instagram"
name = "Instagram"
url = "https://instagram.com/<your_id>"
weight = 30

  [social.params]
  icon = "brand-instagram"
  newTab = true

[[social]]
identifier = "booth"
name = "BOOTH"
url = "https://booth.pm/ja/items/xxxxxxxx"
weight = 40

  [social.params]
  icon = "booth"
  newTab = true
```

> 注意  
> - Stack の設定ファイル構成はスターターの流儀で異なるため、既存の形式に合わせて追記すること。  
> - `icon` 名（例: `booth`）と SVG ファイル名（例: `booth.svg`）を一致させること。

---

### 3.5 動作確認
1. ローカルで起動：
   - `hugo server`
2. サイドバーに **Twitter / Instagram / BOOTH** のアイコンが表示されること
3. 各アイコンをクリックして正しい URL に遷移すること
4. 可能なら以下も確認：
   - 新規タブで開く（`newTab` を true にしている場合）
   - ダークテーマでも視認性が崩れない

---

### 3.6 コミット
- 変更点を含めてコミット：
  - `assets/icons/booth.svg`
  - （必要なら）`assets/icons/brand-twitter.svg`, `assets/icons/brand-instagram.svg`
  - 設定ファイルの `menu.social` 追記

---

## 4. 受け入れ基準（Done）
- [ ] `assets/icons/booth.svg` が存在する
- [ ] （必要なら）`assets/icons/brand-twitter.svg`, `assets/icons/brand-instagram.svg` が存在する
- [ ] `menu.social` に twitter / instagram / booth が定義され、`params.icon` が各 SVG と一致している
- [ ] ローカル表示で 3 アイコンが表示され、クリックで各サービスへ遷移する

---

## 5. トラブルシュート（頻出）
- アイコンが出ない：
  - `icon:` と SVG ファイル名が一致しているか
  - SVG の配置が `assets/icons/` か（`static/` や `themes/` 直編集になっていないか）
  - `menu.social` が本当に読み込まれているか（設定ファイルの形式/場所の誤り）
