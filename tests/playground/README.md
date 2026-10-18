# Playgroundの確認

アプリ自体にNode.jsやnpmのビルド工程は不要です。Hugoが`static/playground/`を配信します。

## ローカル表示

サイト全体はリポジトリの手順に従って`hugo server`を起動します。ツールだけなら次のコマンドでも確認できます。

```sh
python3 -m http.server 1313 --bind 127.0.0.1 --directory static
```

`http://127.0.0.1:1313/playground/drawer-labels/`で「サンプルで試す」を選びます。写真6枚を埋め込んだサンプル.xlsxもダウンロードできます。価格は架空のサンプル値です。

「汎用テンプレート」を選ぶと、Excelなしで枠と¥だけを印刷できます。枚数は1〜500枚で指定し、サイズ変更や試し刷りも利用できます。POPには引き出し番号を印刷しません。

「サイズの種類」には、見出しカード116×26mmと、取っ手がある前面用の120×55mmを用意しています。前面用は[B-118のメーカー外形寸法](https://www.hozan.co.jp/corp/g/g1118/)124×63mmより余裕を持たせた貼付用サイズです。取っ手や凹凸との干渉は試し刷りで確認してください。手動で寸法を変えると「カスタム」になります。

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
