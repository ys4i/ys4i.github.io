# assets/ts/main.ts の経緯と理由

## なぜプロジェクト側に main.ts を置いているか
Hugo の資産解決はプロジェクト側の `assets/` が優先されます。
テーマ側（`themes/hugo-theme-stack/assets/ts/main.ts`）を直接編集すると、
テーマ更新時に上書きされるため、変更が消えるリスクがあります。

そのため、このプロジェクトでは **同じパスの `assets/ts/main.ts` を用意して上書き** しています。
こうすることで、テーマ更新の影響を受けずに挙動を調整できます。

## 変更の経緯
- Projects タイルの背景グラデーションは JS で inline style が付与されるため、CSS だけでの調整が効きません。
- 透明度を弱めるため、JS 側の透明度（alpha）を調整する必要がありました。
- 直接テーマを編集せず、プロジェクト側に `assets/ts/main.ts` をコピーして上書きする方針にしました。

## 今後の更新方針
テーマ更新後は、以下のファイルを比較して差分を取り込みます。
- `themes/hugo-theme-stack/assets/ts/main.ts`
- `assets/ts/main.ts`

この運用で、上流の改善を取り込みつつ、プロジェクト独自の調整を維持します。
