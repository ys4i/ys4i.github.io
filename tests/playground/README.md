# Playgroundの確認

アプリ自体にNode.jsやnpmのビルド工程は不要です。Hugoが`static/playground/`を配信します。

## ローカル表示

サイト全体はリポジトリの手順に従って`hugo server`を起動します。ツールだけなら次のコマンドでも確認できます。

```sh
python3 -m http.server 1313 --bind 127.0.0.1 --directory static
```

`http://127.0.0.1:1313/playground/drawer-labels/`で「サンプルで試す」を選びます。写真6枚を埋め込んだサンプル.xlsxもダウンロードできます。価格は架空のサンプル値です。

「汎用テンプレート」を選ぶと、Excelなしで手書き用の枠を印刷できます。「¥を入れる」で枠だけ／枠と¥を切り替えます。この設定はExcel版の価格の円記号にも適用します。枚数は1〜500枚で指定し、サイズ変更や試し刷りも利用できます。POPには引き出し番号を印刷しません。

「サイズの種類」には、見出しカード116×26mmと、取っ手がある前面用の120×55mmを用意しています。前面用は[B-118のメーカー外形寸法](https://www.hozan.co.jp/corp/g/g1118/)124×63mmより余裕を持たせた貼付用サイズです。取っ手や凹凸との干渉は試し刷りで確認してください。手動で寸法を変えると「カスタム」になります。

用紙はA4縦・A4横・自動から選択できます。周囲10mmの余白を確保し、寸法を変えずに90度回転を組み合わせて、直線裁断で取れる枚数を最大化します。ラベル間隔は0mm、共通の境界は1本の切断線として描きます。

120×55mmはA4縦で7枚（横向き5枚＋90度回転2枚）です。印刷範囲190×277mmの面積をラベル面積で割った上限も7枚なので、この条件では最適です。汎用テンプレートの「1ページ分を最大枚数で作る」で枚数を自動設定できます。見出しカード116×26mmは15枚/ページになります。配置と用紙方向はプレビューとPDFで同じです。印刷倍率100%を使用してください。

## テスト

Node.js 20以降でロジックのテストを実行できます。

```sh
node --test tests/playground/labels.test.mjs
```

ブラウザテストには開発用のPlaywrightとChromiumが必要です。サイトの依存関係を増やさずに実行する場合：

```sh
npm install --prefix /tmp/playground-test-deps playwright
/tmp/playground-test-deps/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/playground-test-deps/node_modules node --test tests/playground/browser.test.mjs
```

ブラウザテストは一時HTTPサーバーを起動して終了時に停止します。画面PNGと印刷検証用PDFは`/tmp/playground-qa/`へ出力します。保存先は`PLAYGROUND_TEST_OUTPUT`で変更できます。取り込みの境界条件を検証するため、テスト内で最小限のOOXMLパッケージを生成します。セル内画像の検証は、vm・futureMetadata・rich value・画像の参照を経由する構成です。

実際のプリンターでは「1枚＋100mmの線を試し刷り」を使い、倍率100%での寸法と実物への収まりを確認してください。

## 公開用のアセットとキャッシュの確認

公開時はHugoの後に、Python標準ライブラリだけを使うパッケージ処理を実行します。GitHub Actionsにも同じ処理を追加しています。

```sh
hugo --minify --destination /tmp/playground-release-build
python3 scripts/package-playground.py --public-dir /tmp/playground-release-build
python3 -B -m unittest discover -s tests/playground -p 'test_*.py'
NODE_PATH=/tmp/playground-test-deps/node_modules PLAYGROUND_STATIC_ROOT=/tmp/playground-release-build node --test tests/playground/labels.test.mjs tests/playground/browser.test.mjs
```

HTML・JS・CSS・サンプルの内容から版を計算し、`assets/<内容ハッシュ>/`に依存モジュールとCSS・サンプルをまとめます。HTMLもその版のURLを参照します。内部モジュールは相対インポートなので同じ版のディレクトリから読み込みます。新しいHTMLに古いJSやCSSが混ざる問題を防ぐため、公開用HTMLの参照先だけでなくモジュール全体を版ごとに分離しています。

公開用ブラウザテストでは古いURLから壊れたJSが返る状態を作り、そのURLを使わずにサイズ候補・印刷が動くことを確認します。パッケージのテストでは、子モジュールの変更で版が変わることと、全インポート先の存在を確認します。
