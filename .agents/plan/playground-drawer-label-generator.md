# Playground 引き出し用POPジェネレータ

更新日：2026-10-18（日本時間）

状態：画像付きExcel（.xlsx）版を実装済み。mainへのプッシュ後、既存のGitHub Actionsで公開する。

## 目的と構成

HOZAN B-415の各引き出しに付ける見出しカードを、画像付きのExcel表から生成する。HTML・CSS・JavaScriptだけで処理し、既存のHugo + GitHub Pagesで配信する。

- `/playground/`：実験ツールの一覧。
- `/playground/drawer-labels/`：Excelの取り込み、棚の配置確認、ラベル印刷。
- `static/playground/` に配置し、既存のHugoビルドでそのまま公開先へコピーする。
- 既存のテーマ、メニュー、作品一覧、デプロイworkflowは変更しない。
- HTMLに `noindex` を指定。Hugoのコンテンツに登録しないため、標準のRSS・サイトマップ・検索インデックスの列挙対象にしない。
- URLを知っている人は閲覧できる。認証付きの非公開ページではない。

## 対象と初期寸法

モノタロウ注文コード68550395はHOZAN B-415。5列×14段、70引き出し。純正見出しカードB-118-1の寸法は26×116mm。

ラベルの初期寸法は横116×縦26mm。印刷時の文字の内側余白は2mm。紙を裁断してカード押えへ差し込む使い方を起点とする。寸法は画面で変更できる。貼付または差し込みの収まりは実物で確認する。

## Excel入力

添付された表の例に合わせ、次の列を取り込む。表の開始行・開始列は固定せず、シート選択・見出し行の指定・列の対応変更に対応する。

| 列 | 内容 |
| --- | --- |
| 名前 | 必須。部品名・定数・型番など |
| 価格 | 任意。0も保持する。円記号の表示を切り替え可能 |
| 写真 | 任意。ブック内の埋め込み画像 |
| 備考 | 任意。定格・パッケージなど |
| 引き出し | 任意。R01C01〜R14C05で位置を指定 |

引き出し列がなければ、表の上から順に、棚の上段左端から右へ割り当てる。空白行は飛ばす。最大70件。1行を1枚として扱い、印刷時は引き出し位置順に並べる。

画像の取り込み：

- 通常の挿入画像：oneCellAnchor / twoCellAnchorの開始セルを基準に写真の行・列を判定する。画像の左上を、名前と同じ行の写真セルの内側に置く。
- Excelのセル内画像：value metadata → rich value → 埋め込み画像の参照を解決する。
- PNG・JPEG・GIF・WebPに対応。縦横比を保ってラベル内に収める。
- 通常画像のトリミングは再現せず元画像全体を使い、取り込み時に通知する。
- 行に対応しない絶対位置画像、写真列の外の画像は通知する。
- 1セルの複数画像、未解決の画像、IMAGE関数やURLによる画像参照はエラー表示する。

.xlsxのみ、入力30MBまで、展開後100MBまで。暗号化ファイル、旧.xls形式、マクロ実行、数式の再計算は対象外。数式はExcelが保存したキャッシュ値を使う。数値は保存値を使い、Excelの任意の表示書式は再現しない。

## 画面と印刷

- Excelを選択またはドラッグ＆ドロップ。
- 画像付きサンプル.xlsxを同梱し、「サンプルで試す」とダウンロードに対応。
- 印刷用紙、5列×14段の棚、取り込み一覧の3表示。
- 棚または一覧から印刷対象を選択。選択したラベルだけを用紙に詰めて配置。
- POPには引き出し番号を表示・印刷しない。棚と取り込み一覧では位置確認用に使用する。
- 幅・高さ・文字サイズ、写真・価格の表示を変更可能。
- Excel不要の「汎用テンプレート」では枠と¥だけを印刷。初期12枚、1〜500枚を指定でき、サイズ変更・複数ページ印刷・試し刷りも共通で利用する。
- 文字が収まる範囲で8ptまで自動調整し、それでも収まらない場合は印刷を止める。
- 入力エラー、画像エラー、位置重複・範囲外、件数超過などもエラーとして表示する。
- A4横、用紙余白10mm、列間6mm、段間4mm。標準サイズは2列×6段で12枚/ページ、70枚で6ページ。
- 寸法変更時は1ページの収容数を再計算する。
- 印刷/PDF保存はブラウザの印刷ダイアログを使用。
- 試し刷りではラベル1枚と100mmの校正線を出力する。
- 倍率100%・実際のサイズ、ヘッダーとフッターOFFでの印刷を案内する。

## ファイル

```text
static/playground/
├── index.html
├── playground.css
└── drawer-labels/
    ├── index.html
    ├── app.js
    ├── xlsx.js
    ├── labels.js
    ├── styles.css
    ├── sample.xlsx
    └── vendor/
        ├── fflate.js
        ├── fflate-LICENSE.txt
        └── README.md

tests/playground/
├── labels.test.mjs
├── browser.test.mjs
└── README.md
```

xlsxはZIP内のXMLと画像を読み込む方式。ZIP展開にfflate 0.8.3（MIT）をローカル同梱する。外部CDN、外部API、外部フォント、解析タグは使わない。入力データはメモリ内で扱い、サーバーやブラウザストレージへ保存しない。ブックの切り替え時に画像のObject URLを解放する。セル文字列はHTMLとして解釈しない。

## GitHub Pagesでの可否

GitHub PagesはHTML・CSS・JavaScriptを配信できるため、ブラウザ内で完結する今回の構成を配信できる。サーバー、DB、追加のビルド工程は不要。GitHub Pagesの用途制限を確認した範囲で、今回の個人用の非商用ツールは適合すると判断する。商用SaaSなどへの用途変更時は利用条件を再確認する。

既存公開先は `https://ys4i.jp/`。`https://ys4i.github.io/` からの301転送を調査時に確認した。アセットやページ間リンクは相対パスにし、ドメインを実装へ固定しない。

## 確認結果と残る確認

実施済み：

- Hugo Extended 0.128.0による静的ビルド。
- ロジックテスト9件：見出し判別、位置割り当て、件数・重複・必須値、画像対応、数式エラー、価格、OOXMLの参照解決、用紙配置。
- Chromiumによるブラウザテスト6件：汎用テンプレート、POPの番号非表示、サンプル画像6枚、セル内画像のメタデータ参照、シート変更、選択印刷、表示設定、70件、エラー時停止、HTML風文字列、モバイル表示。
- 印刷PDFを解析し、70枚が6ページ（12/12/12/12/12/10枚）、校正出力が1ページであることを確認。
- ブラウザ上で116×26mmのラベル寸法を確認。
- ブラウザ検証中に同一オリジンのGET以外のHTTP通信がないことを確認。
- サンプルExcelとデスクトップ・モバイルの画面を目視確認。

未実施：

- ユーザーの実際の.xlsxファイルでの照合。添付されたのは表の画像で、実ファイルは未受領。
- Microsoft Excel実機によるサンプル編集・再保存の検証。
- Firefox・Edgeでの印刷確認。
- 実際のプリンターでの寸法計測と、引き出しへの差し込み確認。
- GitHub Pagesへの公開後のURL確認。

## 参照資料

- [モノタロウ：対象商品](https://www.monotaro.com/p/6855/0395/)
- [HOZAN公式：B-415と交換部品・カード寸法](https://www.hozan.co.jp/corp/g/g1415/)
- [GitHub Pagesの仕組み](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pagesの制限](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Microsoft：Excelのセル内画像](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/aac1e2a6-7072-4e66-b1de-f20b8bf63318)
- [fflate](https://github.com/101arrowz/fflate)
- [Google：noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
