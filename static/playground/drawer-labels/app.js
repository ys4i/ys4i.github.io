import { openWorkbook } from './xlsx.js';
import { FIELDS, SIZE_PRESETS, detectHeader, buildLabels, drawerAt, pageLayout, priceText } from './labels.js';

const $ = id => document.getElementById(id);
const fieldNames = { name: '名前', price: '価格', photo: '写真', note: '備考', drawer: '引き出し' };
const state = { book: null, sheet: null, records: [], errors: [], warnings: [], selected: new Set(), mode: 'excel', view: 'paper', busy: false, ready: false, revision: 0 };
let importId = 0;
let lastPrintMode = 'all';

function node(tag, className, content) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content != null) el.textContent = content;
  return el;
}
function columnName(index) {
  let name = '';
  for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name;
}
function showMessages(errors = [], warnings = []) {
  $('messages').replaceChildren();
  for (const [messages, kind, title] of [[errors, 'error', '確認してください'], [warnings, '', '取り込み時のお知らせ']]) {
    if (!messages.length) continue;
    const box = node('div', `message ${kind}`);
    if (kind) box.setAttribute('role', 'alert');
    box.append(node('strong', '', title));
    const list = node('ul');
    messages.forEach(message => list.append(node('li', '', message)));
    box.append(list);
    $('messages').append(box);
  }
}
function busy(value) {
  state.busy = value;
  $('file').disabled = value;
  $('sample').disabled = value;
  document.querySelectorAll('input[name=source]').forEach(input => { input.disabled = value; });
  $('print').disabled = true;
  $('calibrate').disabled = true;
  document.body.classList.add('print-blocked');
  $('dropzone').setAttribute('aria-busy', String(value));
}

async function loadFile(file) {
  const id = ++importId;
  state.revision++;
  busy(true);
  state.ready = false;
  state.book?.dispose();
  state.book = null;
  state.sheet = null;
  state.records = [];
  state.selected.clear();
  state.errors = [];
  state.warnings = [];
  $('print-root').replaceChildren();
  $('paper-preview').replaceChildren();
  $('records').replaceChildren();
  $('cabinet').replaceChildren();
  $('import-options').hidden = true;
  $('filename').textContent = `${file.name} を読み込み中…`;
  $('counts').textContent = '読み込み中…';
  showMessages();
  updateView();
  let book;
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error('.xlsx形式のExcelファイルを選んでください。');
    book = await openWorkbook(file);
    if (id !== importId) { book.dispose(); return; }
    state.book = book;
    $('sheet').replaceChildren(...book.sheets.map((sheet, index) => new Option(sheet.name, index)));
    $('import-options').hidden = false;
    $('filename').textContent = file.name;
    readSheet();
  } catch (error) {
    book?.dispose();
    if (id !== importId) return;
    state.book = null;
    state.errors = [error.message];
    $('import-options').hidden = true;
    $('filename').textContent = '読み込みに失敗しました。別のファイルを選べます。';
    render();
  } finally {
    if (id === importId) busy(false);
  }
}

function readSheet() {
  try {
    state.sheet = state.book.readSheet(Number($('sheet').value));
    const header = detectHeader(state.sheet.rows);
    $('header-row').value = header.row;
    createMapping(header.mapping);
    rebuild();
  } catch (error) {
    state.sheet = null;
    state.records = [];
    state.errors = [error.message];
    state.warnings = [];
    render();
  }
}
function createMapping(mapping) {
  const header = state.sheet.rows.find(row => row.number === Number($('header-row').value));
  const cols = [...new Set(state.sheet.rows.flatMap(row => [...row.cells.keys()]).concat(state.sheet.pictures.map(pic => pic.col)))].sort((a, b) => a - b);
  $('mapping').replaceChildren();
  for (const field of FIELDS) {
    const label = node('label', 'field', fieldNames[field] + (field === 'name' ? '（必須）' : ''));
    const select = node('select');
    select.id = `map-${field}`;
    select.append(new Option('使わない', -1));
    for (const col of cols) select.append(new Option(`${columnName(col)}：${header?.cells.get(col)?.value || '（見出しなし）'}`, col));
    select.value = String(mapping[field]);
    if (select.selectedIndex < 0) select.value = '-1';
    select.addEventListener('change', rebuild);
    label.append(select);
    $('mapping').append(label);
  }
}
function rebuild() {
  if (!state.sheet) return;
  const mapping = Object.fromEntries(FIELDS.map(field => [field, Number($(`map-${field}`).value)]));
  const result = buildLabels(state.sheet, Number($('header-row').value), mapping);
  state.records = result.records.slice(0, 70);
  state.errors = result.errors;
  state.warnings = [...state.sheet.warnings];
  const outside = state.sheet.pictures.filter(pic => pic.row > Number($('header-row').value) && pic.col !== mapping.photo);
  if (outside.length && mapping.photo >= 0) state.warnings.push(`写真列の外に画像が${outside.length}枚あります。この画像は取り込みません。必要な写真は、左上を写真列の同じ行のセル内に置いてください。`);
  state.selected = new Set(state.records.map(record => record.drawer));
  render();
}

function updateSizeNote() {
  const preset = SIZE_PRESETS.find(preset => preset.id === $('size-preset').value);
  $('size-note').textContent = preset?.note ?? '貼り付ける場所に合わせ、幅と高さを指定してください。';
}
function syncSizePreset() {
  const preset = SIZE_PRESETS.find(preset => preset.width === Number($('width').value) && preset.height === Number($('height').value));
  $('size-preset').value = preset?.id ?? 'custom';
  updateSizeNote();
}
function settings() {
  const width = Number($('width').value);
  const height = Number($('height').value);
  const font = Number($('font-size').value);
  const layout = pageLayout(width, height);
  if (!Number.isFinite(font) || font < 8 || font > 28) throw new Error('文字サイズは8〜28ptにしてください。');
  const count = Number($('blank-count').value);
  if (state.mode === 'blank' && (!Number.isInteger(count) || count < 1 || count > 500)) throw new Error('印刷枚数は1〜500の整数にしてください。');
  return { width, height, font, layout, count, photo: $('show-photo').checked, price: $('show-price').checked, unit: $('unit').value };
}
function makeLabel(record, options) {
  const label = node('article', 'label-card');
  label.dataset.drawer = record.drawer;
  if (record.blank) {
    label.classList.add('template');
    const copy = node('div', 'label-copy');
    copy.append(node('div', 'label-price', '¥'));
    label.append(copy);
    return label;
  }
  if (options.photo && record.photo) {
    const img = node('img', 'label-photo');
    img.src = record.photo;
    img.alt = record.name;
    label.append(img);
  }
  const copy = node('div', 'label-copy');
  copy.append(node('div', 'label-name', record.name));
  if (options.price && record.price !== '') copy.append(node('div', 'label-price', priceText(record.price, options.unit)));
  if (record.note) copy.append(node('div', 'label-note', record.note));
  label.append(copy);
  return label;
}
function makePages(records, options) {
  const pages = [];
  for (let start = 0; start < records.length; start += options.layout.capacity) {
    const sheet = node('section', 'sheet');
    const grid = node('div', 'label-grid');
    for (const record of records.slice(start, start + options.layout.capacity)) grid.append(makeLabel(record, options));
    sheet.append(grid);
    pages.push(sheet);
  }
  return pages;
}
function updateView() {
  const blank = state.mode === 'blank';
  const hasRecords = blank || state.records.length > 0;
  $('blank-options').hidden = !blank;
  $('excel-input').hidden = blank;
  $('excel-display').hidden = blank;
  $('view-tabs').hidden = blank;
  $('empty').hidden = hasRecords;
  $('selection-bar').hidden = blank || !hasRecords;
  const activeView = blank ? 'paper' : state.view;
  for (const view of ['paper', 'cabinet', 'table']) $(`${view}-view`).hidden = !hasRecords || activeView !== view;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
}
function renderTable(options) {
  const rows = state.records.map(record => {
    const tr = node('tr');
    const td = node('td');
    const check = node('input');
    check.type = 'checkbox';
    check.checked = state.selected.has(record.drawer);
    check.setAttribute('aria-label', `${record.drawer} ${record.name}を印刷`);
    check.addEventListener('change', () => toggle(record.drawer));
    td.append(check);
    tr.append(td);
    const location = node('td', '', record.drawer);
    location.append(node('small', '', `Excel ${record.row}行目`));
    tr.append(location, node('td', '', record.name), node('td', '', priceText(record.price, options.unit)));
    const photo = node('td');
    if (record.photo) {
      const img = node('img'); img.src = record.photo; img.alt = record.name; photo.append(img);
    } else photo.append(node('span', 'muted', '—'));
    tr.append(photo, node('td', '', record.note));
    return tr;
  });
  $('records').replaceChildren(...rows);
}
function renderCabinet() {
  const lookup = new Map(state.records.map(record => [record.drawer, record]));
  const drawers = Array.from({ length: 70 }, (_, index) => {
    const id = drawerAt(index);
    const record = lookup.get(id);
    const item = node(record ? 'button' : 'div', `drawer${record ? '' : ' empty'}`);
    item.append(node('small', '', id));
    if (record) {
      item.type = 'button';
      item.setAttribute('aria-pressed', String(state.selected.has(id)));
      item.setAttribute('aria-label', `${id} ${record.name}の印刷選択`);
      item.append(node('strong', '', record.name));
      if (record.photo) { const img = node('img'); img.src = record.photo; img.alt = ''; item.append(img); }
      item.addEventListener('click', () => toggle(id));
    }
    return item;
  });
  $('cabinet').replaceChildren(...drawers);
}
function toggle(id) {
  const focus = document.activeElement?.getAttribute('aria-label');
  if (state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
  render();
  if (focus) [...document.querySelectorAll('button[aria-label],input[aria-label]')].find(el => el.getAttribute('aria-label') === focus)?.focus({ preventScroll: true });
}
function fitLabels(root, options) {
  const overflows = [];
  for (const label of root.querySelectorAll('.label-card')) {
    const copy = label.querySelector('.label-copy');
    const style = getComputedStyle(label);
    const available = label.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    let font = options.font;
    const overflowing = () => copy.scrollHeight > available + 1 || copy.scrollWidth > copy.clientWidth + 1;
    while (overflowing() && font > 8) { font -= .5; label.style.fontSize = `${Math.max(8, font)}pt`; }
    if (overflowing()) { label.classList.add('overflow'); overflows.push(label.dataset.drawer); }
  }
  return overflows;
}
async function waitImages(root) {
  return Promise.all([...root.querySelectorAll('img')].map(async img => {
    try { await img.decode(); return null; } catch { return img.alt || '写真'; }
  }));
}

async function render() {
  const revision = ++state.revision;
  state.ready = false;
  $('print').disabled = true;
  $('calibrate').disabled = true;
  document.body.classList.add('print-blocked');
  $('print-root').replaceChildren();
  $('paper-preview').replaceChildren();
  updateView();
  let options;
  const inputErrors = state.mode === 'excel' ? state.errors : [];
  const warnings = state.mode === 'excel' ? state.warnings : [];
  try { options = settings(); } catch (error) {
    showMessages([...inputErrors, error.message], warnings);
    $('counts').textContent = state.mode === 'blank' ? '枚数とサイズを確認してください' : '設定を確認してください';
    return;
  }
  for (const root of [document.documentElement]) {
    root.style.setProperty('--label-width', `${options.width}mm`);
    root.style.setProperty('--label-height', `${options.height}mm`);
    root.style.setProperty('--label-font', `${options.font}pt`);
    root.style.setProperty('--columns', options.layout.columns);
  }
  const selected = state.mode === 'blank'
    ? Array.from({ length: options.count }, (_, index) => ({ drawer: `blank-${index + 1}`, blank: true }))
    : state.records.filter(record => state.selected.has(record.drawer));
  $('counts').textContent = state.mode === 'blank' ? `汎用テンプレート ${options.count}枚` : state.records.length ? `${state.records.length}件 / 写真 ${state.records.filter(record => record.photo).length}枚` : 'Excelを読み込むと表示されます';
  $('selected-count').textContent = `${selected.length} / ${state.records.length} 件を印刷`;
  $('layout-info').textContent = `${options.layout.columns}列 × ${options.layout.rows}段 / ${options.layout.capacity}枚・ページ`;
  renderTable(options);
  renderCabinet();
  const pages = makePages(selected, options);
  pages.forEach((page, index) => {
    $('paper-preview').append(node('p', 'sheet-caption', `PAGE ${String(index + 1).padStart(2, '0')} / ${pages.length}　—　${options.width} × ${options.height} mm`));
    const viewport = node('div', 'paper-viewport');
    viewport.append(page);
    $('paper-preview').append(viewport);
  });
  if (!selected.length && state.records.length) $('paper-preview').append(node('div', 'message', '印刷対象を選んでください。「棚の配置」「取り込み一覧」から選択できます。'));
  // Keep measurement in a visible, unscaled copy even when the paper tab is closed.
  const measurement = node('div');
  measurement.style.cssText = 'position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';
  measurement.append(...pages.map(page => page.cloneNode(true)));
  document.body.append(measurement);
  const failed = await waitImages(measurement);
  if (document.fonts?.ready) await document.fonts.ready;
  if (revision !== state.revision) { measurement.remove(); return; }
  const overflows = fitLabels(measurement, options);
  const fittedPages = [...measurement.children];
  const previewPages = $('paper-preview').querySelectorAll('.sheet');
  fittedPages.forEach((page, index) => previewPages[index]?.replaceChildren(...[...page.children].map(child => child.cloneNode(true))));
  $('print-root').append(...fittedPages);
  measurement.remove();
  scalePreview();
  const errors = [...inputErrors];
  if (failed.some(Boolean)) errors.push('読み込めない写真があります。写真をPNGまたはJPEGに置き換えてExcelを保存し直してください。');
  if (overflows.length) errors.push(`${overflows.join('、')}：文字が収まりません。ラベルを大きくするか、Excelの文面を短くしてください。`);
  showMessages(errors, warnings);
  state.ready = selected.length > 0 && !errors.length;
  $('print').disabled = !state.ready;
  $('calibrate').disabled = !state.ready;
  document.body.classList.toggle('print-blocked', !state.ready);
}

function scalePreview() {
  for (const viewport of document.querySelectorAll('.paper-viewport')) {
    const sheet = viewport.firstElementChild;
    const scale = viewport.clientWidth / sheet.offsetWidth;
    sheet.style.transform = `scale(${scale})`;
    viewport.style.height = `${sheet.offsetHeight * scale}px`;
  }
}
function preparePrint(mode) {
  if (!state.ready) return;
  document.body.classList.remove('print-blocked');
  if (mode === 'calibration') {
    const label = $('print-root').querySelector('.label-card')?.cloneNode(true);
    const sheet = node('section', 'sheet calibration');
    sheet.append(node('h2', 'calibration-title', '引き出しPOP / 試し刷り'));
    if (label) sheet.append(label);
    sheet.append(node('p', 'calibration-note', '下の線は100mmです。倍率100%・実際のサイズで印刷し、定規で確認してください。'));
    sheet.append(node('div', 'calibration-line'));
    sheet.append(node('p', 'calibration-note', `ラベル：横${$('width').value} × 縦${$('height').value}mm。切り出して実物への収まりも確認してください。`));
    $('print-root').replaceChildren(sheet);
  }
  lastPrintMode = mode;
  window.print();
}

$('file').addEventListener('change', event => { const file = event.target.files[0]; if (file) loadFile(file); event.target.value = ''; });
for (const name of ['dragenter', 'dragover']) $('dropzone').addEventListener(name, event => { event.preventDefault(); $('dropzone').classList.add('dragging'); });
$('dropzone').addEventListener('dragleave', () => $('dropzone').classList.remove('dragging'));
$('dropzone').addEventListener('drop', event => {
  event.preventDefault(); $('dropzone').classList.remove('dragging');
  if (state.busy) return;
  if (event.dataTransfer.files.length !== 1) { showMessages(['Excelファイルを1つ選んでください。']); return; }
  loadFile(event.dataTransfer.files[0]);
});
$('sample').addEventListener('click', async () => {
  busy(true);
  try {
    const response = await fetch('./sample.xlsx');
    if (!response.ok) throw new Error('サンプルを取得できません。');
    await loadFile(new File([await response.blob()], 'sample.xlsx'));
  } catch (error) { showMessages([error.message]); } finally { busy(false); render(); }
});
$('sheet').addEventListener('change', readSheet);
$('header-row').addEventListener('change', () => {
  if (!state.sheet) return;
  const row = state.sheet.rows.find(item => item.number === Number($('header-row').value));
  if (row) createMapping(detectHeader([row]).mapping);
  rebuild();
});
for (const id of ['width', 'height']) $(id).addEventListener('input', () => { syncSizePreset(); render(); });
for (const id of ['font-size', 'unit', 'show-photo', 'show-price', 'blank-count']) $(id).addEventListener('input', render);
$('size-preset').replaceChildren(...SIZE_PRESETS.map(preset => new Option(`${preset.name} ${preset.width} × ${preset.height} mm`, preset.id)), new Option('カスタム', 'custom'));
$('size-preset').addEventListener('change', () => {
  const preset = SIZE_PRESETS.find(preset => preset.id === $('size-preset').value);
  if (preset) { $('width').value = preset.width; $('height').value = preset.height; }
  updateSizeNote();
  render();
});
document.querySelectorAll('input[name=source]').forEach(input => input.addEventListener('change', () => {
  state.mode = input.value;
  render();
}));
$('reset-size').addEventListener('click', () => {
  const standard = SIZE_PRESETS.find(preset => preset.id === 'card');
  $('width').value = standard.width;
  $('height').value = standard.height;
  $('font-size').value = 16;
  syncSizePreset();
  render();
});
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { state.view = button.dataset.view; updateView(); scalePreview(); }));
$('select-all').addEventListener('click', () => { state.selected = new Set(state.records.map(record => record.drawer)); render(); });
$('select-none').addEventListener('click', () => { state.selected.clear(); render(); });
$('print').addEventListener('click', () => preparePrint('all'));
$('calibrate').addEventListener('click', () => preparePrint('calibration'));
window.addEventListener('beforeprint', () => document.body.classList.toggle('print-blocked', !state.ready));
window.addEventListener('afterprint', () => { if (lastPrintMode === 'calibration') { lastPrintMode = 'all'; render(); } });
new ResizeObserver(scalePreview).observe(document.querySelector('.preview-area'));
window.addEventListener('beforeunload', () => state.book?.dispose());
syncSizePreset();
render();
