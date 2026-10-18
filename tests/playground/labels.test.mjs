import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE_PRESETS, detectHeader, buildLabels, drawerAt, pageLayout, priceText } from '../../static/playground/drawer-labels/labels.js';
import { resolvePart, columnIndex } from '../../static/playground/drawer-labels/xlsx.js';

const row = (number, values) => ({ number, cells: new Map(values.map((value, col) => [col, { value: String(value ?? ''), ref: `${String.fromCharCode(65 + col)}${number}` }])) });
const mapping = { name: 0, price: 1, photo: 2, note: 3, drawer: -1 };
const sheet = (...rows) => ({ rows: [row(3, ['名前', '価格', '写真', '備考']), ...rows], pictures: [] });

test('見出しの開始行と順序を判別する', () => {
  assert.deepEqual(detectHeader([row(1, ['部品一覧']), row(3, ['', '備考', '写真', '名前', '価格'])]), {
    row: 3, mapping: { name: 3, price: 4, photo: 2, note: 1, drawer: -1 },
  });
});
test('70個の位置とA4の配置境界', () => {
  assert.equal(drawerAt(0), 'R01C01');
  assert.equal(drawerAt(69), 'R14C05');
  assert.deepEqual(pageLayout(116, 26), { columns: 2, rows: 6, capacity: 12 });
  const front = SIZE_PRESETS.find(preset => preset.id === 'front');
  assert.deepEqual(pageLayout(front.width, front.height), { columns: 2, rows: 3, capacity: 6 });
  assert.deepEqual(pageLayout(277, 190), { columns: 1, rows: 1, capacity: 1 });
  for (const dims of [[0, 26], [116, NaN], [278, 26], [116, 191]]) assert.throws(() => pageLayout(...dims));
});
test('空白行を飛ばし、0円と改行を保持する', () => {
  const result = buildLabels(sheet(row(4, ['2.2Ω', 0, '', '1/4W\n±5%']), row(5, ['', '', '', '']), row(6, ['100Ω', 10])), 3, mapping);
  assert.deepEqual(result.errors, []);
  assert.equal(result.records.length, 2);
  assert.equal(result.records[0].price, '0');
  assert.equal(result.records[0].note, '1/4W\n±5%');
  assert.equal(result.records[1].drawer, 'R01C02');
});
test('指定位置を検証し、位置順に並べる', () => {
  const input = sheet(row(4, ['100Ω', 10, '', '', 'R14C05']), row(5, ['2.2Ω', 10, '', '', 'r01c01']));
  const result = buildLabels(input, 3, { ...mapping, drawer: 4 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.records[0].name, '2.2Ω');
  input.rows.push(row(6, ['1kΩ', 10, '', '', 'R01C01']));
  assert.match(buildLabels(input, 3, { ...mapping, drawer: 4 }).errors.join(), /重複/);
  input.rows[3].cells.get(4).value = 'R15C01';
  assert.match(buildLabels(input, 3, { ...mapping, drawer: 4 }).errors.join(), /R01C01〜R14C05/);
});
test('71件、空の名前、重複列、欠落見出しを拒否する', () => {
  assert.match(buildLabels(sheet(...Array.from({ length: 71 }, (_, i) => row(i + 4, [`部品${i}`]))), 3, mapping).errors.join(), /70件/);
  assert.match(buildLabels(sheet(row(4, ['', 10])), 3, mapping).errors.join(), /名前が空/);
  assert.match(buildLabels(sheet(row(4, ['部品'])), 3, { ...mapping, price: 0 }).errors.join(), /別々の列/);
  assert.match(buildLabels(sheet(row(4, ['部品'])), 2, mapping).errors.join(), /見出し行/);
});
test('画像を行・列で対応させ、外部参照と複数画像を黙って落とさない', () => {
  const input = sheet(row(4, ['2.2Ω', 10]), row(5, ['10Ω', 20]));
  input.pictures = [{ row: 5, col: 2, src: 'blob:test' }];
  assert.equal(buildLabels(input, 3, mapping).records[1].photo, 'blob:test');
  input.pictures.push({ row: 5, col: 2, error: '外部リンク画像' });
  assert.match(buildLabels(input, 3, mapping).errors.join(), /複数/);
  assert.match(buildLabels(input, 3, mapping).errors.join(), /外部リンク/);
  input.pictures = [{ row: 6, col: 2, src: 'blob:orphan' }];
  assert.match(buildLabels(input, 3, mapping).errors.join(), /対応しない写真/);
});
test('IMAGE関数、エラーセル、キャッシュのない数式を報告する', () => {
  const input = sheet(row(4, ['2.2Ω', '', '']));
  input.rows[1].cells.get(2).formula = 'IMAGE("https://example.com/test.png")';
  input.rows[1].cells.get(1).formula = 'A1*2';
  assert.match(buildLabels(input, 3, mapping).errors.join(), /計算結果がありません/);
  assert.match(buildLabels(input, 3, mapping).errors.join(), /埋め込んで/);
  input.rows[1].cells.get(0).type = 'e';
  assert.match(buildLabels(input, 3, mapping).errors.join(), /エラー値/);
});
test('価格の単位と文字列を保持する', () => {
  assert.equal(priceText('0', '¥'), '¥0');
  assert.equal(priceText('1234.5', '¥'), '¥1,234.5');
  assert.equal(priceText('10円 / 個', '¥'), '10円 / 個');
  assert.equal(priceText('10', ''), '10');
  assert.equal(priceText('', '¥'), '');
});
test('OOXMLのパスとセル参照', () => {
  assert.equal(resolvePart('xl/worksheets/sheet1.xml', '../drawings/drawing1.xml'), 'xl/drawings/drawing1.xml');
  assert.equal(resolvePart('xl/workbook.xml', '/xl/worksheets/sheet1.xml'), 'xl/worksheets/sheet1.xml');
  assert.throws(() => resolvePart('xl/workbook.xml', '../../secret'));
  assert.throws(() => resolvePart('xl/workbook.xml', 'https://example.com/pic'));
  assert.equal(columnIndex('B3'), 1);
  assert.equal(columnIndex('AA14'), 26);
  assert.throws(() => columnIndex('A0'));
});
