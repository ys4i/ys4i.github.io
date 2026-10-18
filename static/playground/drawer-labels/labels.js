export const FIELDS = ['name', 'price', 'photo', 'note', 'drawer'];
export const SIZE_PRESETS = [
  { id: 'card', name: '見出しカード', width: 116, height: 26, note: 'B-118-1の純正カード寸法です。' },
  { id: 'front', name: '前面（取っ手側）', width: 120, height: 55, note: '前面の外形124×63mmより小さくした貼付用サイズです。取っ手や凹凸との干渉は試し刷りで確認してください。' },
];
const aliases = {
  name: ['名前', '名称', '品名', '部品名', 'name'], price: ['価格', '単価', 'price'],
  photo: ['写真', '画像', 'photo', 'image'], note: ['備考', 'メモ', 'note'],
  drawer: ['引き出し', '引き出し番号', '位置', 'drawer'],
};
const normalized = value => value.normalize('NFKC').trim().toLowerCase();
export const drawerAt = index => `R${String(Math.floor(index / 5) + 1).padStart(2, '0')}C${String(index % 5 + 1).padStart(2, '0')}`;

export function detectHeader(rows) {
  for (const row of rows.slice(0, 50)) {
    const mapping = Object.fromEntries(FIELDS.map(field => [field, -1]));
    for (const [col, cell] of row.cells) {
      for (const field of FIELDS) if (aliases[field].includes(normalized(cell.value))) mapping[field] = col;
    }
    if (mapping.name >= 0) return { row: row.number, mapping };
  }
  return { row: rows[0]?.number ?? 1, mapping: { name: 0, price: 1, photo: 2, note: 3, drawer: -1 } };
}

export function buildLabels(sheet, header, mapping) {
  const errors = [];
  const records = [];
  const seen = new Set();
  const activeCols = FIELDS.map(field => mapping[field]).filter(col => col >= 0);
  if (mapping.name < 0) errors.push('「名前」の列を選んでください。');
  if (new Set(activeCols).size !== activeCols.length) errors.push('各項目には別々の列を選んでください。');
  const validHeader = sheet.rows.some(row => row.number === header);
  if (!validHeader) errors.push('見出し行がシート内に見つかりません。');
  if (errors.length) return { records, errors };
  for (const row of sheet.rows.filter(row => row.number > header)) {
    const cell = field => row.cells.get(mapping[field]);
    const get = field => cell(field)?.value.trim() ?? '';
    const photos = sheet.pictures.filter(pic => pic.row === row.number && pic.col === mapping.photo);
    const hasValues = ['name', 'price', 'note', 'drawer'].some(field => get(field));
    if (!hasValues && !photos.length && !get('photo') && !cell('photo')?.formula) continue;
    const prefix = `${row.number}行目：`;
    if (!get('name')) errors.push(`${prefix}名前が空です。`);
    for (const field of ['name', 'price', 'note', 'drawer']) {
      if (cell(field)?.type === 'e') errors.push(`${prefix}${cell(field).ref}がExcelのエラー値です。Excelで修正してください。`);
      if (cell(field)?.formula && !get(field)) errors.push(`${prefix}${cell(field).ref}の計算結果がありません。Excelで再計算して保存してください。`);
    }
    const drawer = mapping.drawer >= 0 ? get('drawer').toUpperCase() : drawerAt(records.length);
    if (!/^R(0[1-9]|1[0-4])C0[1-5]$/.test(drawer)) errors.push(`${prefix}引き出し番号はR01C01〜R14C05にしてください。`);
    if (seen.has(drawer)) errors.push(`${prefix}引き出し番号${drawer}が重複しています。`);
    seen.add(drawer);
    if (photos.length > 1) errors.push(`${prefix}写真が複数あります。写真セルには1枚だけ配置してください。`);
    for (const photo of photos) if (photo.error) errors.push(`${prefix}${photo.error}`);
    if (!photos.length && (get('photo') || cell('photo')?.formula)) errors.push(`${prefix}写真を取り込めません。URL・IMAGE関数ではなく、Excel内に画像を埋め込んでください。`);
    records.push({ drawer, name: get('name'), price: get('price'), note: get('note'), photo: photos[0]?.src ?? '', row: row.number });
  }
  if (!records.length) errors.push('見出し行の下にデータがありません。');
  if (records.length > 70) errors.push('1台分は70件までです。シートを分けてください。');
  records.sort((a, b) => a.drawer.localeCompare(b.drawer));
  const unmatched = sheet.pictures.filter(pic => pic.col === mapping.photo && pic.row > header && !records.some(record => record.row === pic.row));
  if (unmatched.length) errors.push('表の行に対応しない写真があります。写真の左上を、名前と同じ行の写真セル内に置いてください。');
  return { records, errors };
}

export function pageLayout(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 20 || height < 12) throw new Error('ラベルは幅20mm以上・高さ12mm以上にしてください。');
  const columns = Math.floor((277 + 6) / (width + 6));
  const rows = Math.floor((190 + 4) / (height + 4));
  if (columns < 1 || rows < 1) throw new Error('ラベルがA4横の印刷範囲（277×190mm）に収まりません。');
  return { columns, rows, capacity: columns * rows };
}

export function priceText(value, unit) {
  if (!value) return '';
  if (!unit) return value;
  const number = Number(value.replaceAll(',', ''));
  return Number.isFinite(number) ? `${unit}${number.toLocaleString('ja-JP', { maximumFractionDigits: 8 })}` : value;
}
