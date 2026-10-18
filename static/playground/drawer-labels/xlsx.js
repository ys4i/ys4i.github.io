import { unzipSync, strFromU8 } from './vendor/fflate.js';

const MAX_FILE = 30 * 1024 * 1024;
const MAX_EXPANDED = 100 * 1024 * 1024;
const descendants = (node, name) => [...node.getElementsByTagNameNS('*', name)];
const children = (node, name) => [...node.children].filter(el => el.localName === name);
const first = (node, name) => descendants(node, name)[0];
const text = (node, name) => first(node, name)?.textContent ?? '';
const relationId = node => [...node.attributes].find(a => a.localName === 'id')?.value;
const richText = node => descendants(node, 't').filter(el => el.parentNode.localName !== 'rPh').map(el => el.textContent).join('');

export function resolvePart(base, target) {
  const decoded = decodeURIComponent(target);
  if (/^[a-z][a-z\d+.-]*:/i.test(decoded) || decoded.includes('\\')) throw new Error('外部参照は読み込みません。画像はExcel内に埋め込んでください。');
  const parts = decoded.startsWith('/') ? [] : base.split('/').slice(0, -1);
  for (const part of decoded.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) throw new Error('Excel内の参照先が不正です。');
      parts.pop();
    } else parts.push(part);
  }
  return parts.join('/');
}

export function columnIndex(ref) {
  const match = /^([A-Z]+)[1-9]\d*$/.exec(ref);
  if (!match) throw new Error(`セル参照が不正です：${ref}`);
  return [...match[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

function imageType(bytes) {
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (strFromU8(bytes.slice(0, 6)).startsWith('GIF8')) return 'image/gif';
  if (strFromU8(bytes.slice(0, 4)) === 'RIFF' && strFromU8(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export async function openWorkbook(file) {
  if (file.size > MAX_FILE) throw new Error('ファイルは30MB以下にしてください。');
  let files;
  let expanded = 0;
  let count = 0;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter(entry) {
      if (++count > 3000) throw new Error('Excel内のファイル数が多すぎます。');
      expanded += entry.originalSize;
      if (expanded > MAX_EXPANDED || entry.originalSize > 20 * 1024 * 1024) throw new Error('展開後のExcelが大きすぎます。画像を縮小してください。');
      return /\.(xml|rels|png|jpe?g|gif|webp|bmp|emf|wmf|svg)$/i.test(entry.name);
    } });
  } catch (error) {
    throw new Error(`Excelを開けません。暗号化されていない.xlsxファイルを選んでください。${error.message ? `（${error.message}）` : ''}`);
  }
  const cache = new Map();
  function xml(path, required = false) {
    if (cache.has(path)) return cache.get(path);
    const data = files[path];
    if (!data) {
      if (required) throw new Error(`Excelの必要なデータが見つかりません：${path}`);
      return null;
    }
    const source = strFromU8(data);
    if (/<!DOCTYPE/i.test(source)) throw new Error('このExcelのXML形式には対応していません。');
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    if (descendants(doc, 'parsererror').length) throw new Error(`Excel内のXMLを読めません：${path}`);
    cache.set(path, doc);
    return doc;
  }
  function relationships(path) {
    const slash = path.lastIndexOf('/');
    const relPath = `${path.slice(0, slash + 1)}_rels/${path.slice(slash + 1)}.rels`;
    const doc = xml(relPath);
    return new Map(doc ? descendants(doc, 'Relationship').map(el => [el.getAttribute('Id'), {
      type: el.getAttribute('Type'),
      external: el.getAttribute('TargetMode') === 'External',
      target: el.getAttribute('TargetMode') === 'External' ? null : resolvePart(path, el.getAttribute('Target')),
    }]) : []);
  }
  const roots = xml('_rels/.rels', true);
  const root = descendants(roots, 'Relationship').find(el => el.getAttribute('Type').endsWith('/officeDocument'));
  if (!root || root.getAttribute('TargetMode') === 'External') throw new Error('Excelブックのデータが見つかりません。');
  const workbookPath = resolvePart('', root.getAttribute('Target'));
  const workbook = xml(workbookPath, true);
  const workbookRels = relationships(workbookPath);
  const partByType = suffix => [...workbookRels.values()].find(rel => rel.type.endsWith(suffix) && !rel.external)?.target;
  const stringsDoc = xml(partByType('/sharedStrings'));
  const strings = stringsDoc ? descendants(stringsDoc, 'si').map(richText) : [];
  const sheets = descendants(workbook, 'sheet').map(el => ({
    name: el.getAttribute('name'), path: workbookRels.get(relationId(el))?.target,
  })).filter(sheet => sheet.path && /worksheet/.test([...workbookRels.values()].find(rel => rel.target === sheet.path)?.type));
  if (!sheets.length) throw new Error('読み込めるワークシートがありません。');

  // Cell images: vm -> valueMetadata -> XLRICHVALUE -> rich value -> image relationship.
  const metadataPath = partByType('/sheetMetadata');
  const metadata = xml(metadataPath);
  const metadataRels = metadataPath ? relationships(metadataPath) : new Map();
  const richPart = suffix => partByType(suffix) ?? [...metadataRels.values()].find(rel => rel.type.endsWith(suffix) && !rel.external)?.target;
  const richPath = richPart('/rdRichValue') ?? richPart('/richValue');
  const richDoc = xml(richPath);
  const structureDoc = xml(richPart('/rdRichValueStructure') ?? richPart('/richValueStructure'));
  const relsPath = richPart('/richValueRel');
  const relsDoc = xml(relsPath);
  const richRels = relsPath ? relationships(relsPath) : new Map();
  const richValues = richDoc ? descendants(richDoc, 'rv') : [];
  const structures = structureDoc ? descendants(structureDoc, 's') : [];
  const richRelList = relsDoc ? descendants(relsDoc, 'rel') : [];
  function cellImage(vm) {
    if (!metadata || !vm) return null;
    const values = first(metadata, 'valueMetadata');
    const block = values && children(values, 'bk')[Number(vm) - 1];
    const types = first(metadata, 'metadataTypes');
    for (const rc of block ? descendants(block, 'rc') : []) {
      const name = types && children(types, 'metadataType')[Number(rc.getAttribute('t')) - 1]?.getAttribute('name');
      if (name !== 'XLRICHVALUE') continue;
      const future = descendants(metadata, 'futureMetadata').find(el => el.getAttribute('name') === name);
      const futureBlock = future && children(future, 'bk')[Number(rc.getAttribute('v'))];
      const index = futureBlock && first(futureBlock, 'rvb')?.getAttribute('i');
      const value = index != null && richValues[Number(index)];
      const structure = value && structures[Number(value.getAttribute('s'))];
      if (!structure || structure.getAttribute('t') !== '_localImage') continue;
      const key = children(structure, 'k').findIndex(el => el.getAttribute('n') === '_rvRel:LocalImageIdentifier');
      if (key < 0) continue;
      const relIndex = children(value, 'v')[key]?.textContent;
      const rel = relIndex != null && richRelList[Number(relIndex)];
      return rel ? richRels.get(relationId(rel)) : null;
    }
    return null;
  }

  const urls = new Map();
  function image(rel) {
    if (!rel || rel.external || !rel.target) return { error: '外部リンク画像は使えません。画像をExcel内に埋め込んでください。' };
    if (urls.has(rel.target)) return { src: urls.get(rel.target) };
    const data = files[rel.target];
    if (!data) return { error: '埋め込み画像のデータが見つかりません。' };
    const type = imageType(data);
    if (!type) return { error: '写真はPNG・JPEG・GIF・WebPにしてください。' };
    const src = URL.createObjectURL(new Blob([data], { type }));
    urls.set(rel.target, src);
    return { src };
  }

  function readSheet(index) {
    const sheet = sheets[index];
    if (!sheet) throw new Error('シートを選んでください。');
    const doc = xml(sheet.path, true);
    const rows = [];
    const pictures = [];
    for (const row of descendants(doc, 'row')) {
      if (rows.length >= 5000) throw new Error('表は5,000行以内にしてください。');
      const cells = new Map();
      for (const cell of children(row, 'c')) {
        const ref = cell.getAttribute('r');
        const col = columnIndex(ref);
        const type = cell.getAttribute('t');
        const raw = text(cell, 'v');
        const value = type === 's' ? strings[Number(raw)] ?? '' : type === 'inlineStr' ? richText(cell) : type === 'b' ? (raw === '1' ? 'TRUE' : 'FALSE') : raw;
        cells.set(col, { value, type, formula: text(cell, 'f'), ref });
        const vm = cell.getAttribute('vm');
        if (vm) {
          const rel = cellImage(vm);
          if (rel) pictures.push({ row: Number(row.getAttribute('r')), col, ...image(rel) });
          else if (type === 'e') pictures.push({ row: Number(row.getAttribute('r')), col, error: 'セル内画像の参照を解決できません。「挿入 → 画像」で配置し直してください。' });
        }
      }
      rows.push({ number: Number(row.getAttribute('r')), cells });
    }
    const sheetRels = relationships(sheet.path);
    const warnings = [];
    for (const drawing of descendants(doc, 'drawing')) {
      const drawingPath = sheetRels.get(relationId(drawing))?.target;
      const drawingDoc = xml(drawingPath, true);
      const drawingRels = relationships(drawingPath);
      for (const anchor of drawingDoc.documentElement.children) {
        const pic = first(anchor, 'pic');
        if (!pic) continue;
        const from = first(anchor, 'from');
        if (!from) {
          warnings.push('行に結び付かない画像があります。写真セルの内側に画像の左上を置き、Excelで保存し直してください。');
          continue;
        }
        const blip = first(pic, 'blip');
        const id = blip && [...blip.attributes].find(a => a.localName === 'embed' || a.localName === 'link')?.value;
        pictures.push({ row: Number(text(from, 'row')) + 1, col: Number(text(from, 'col')), ...image(drawingRels.get(id)) });
        const blipFill = first(pic, 'blipFill');
        if (blipFill && first(blipFill, 'srcRect')) warnings.push('トリミングされた写真は元画像全体を使います。');
      }
    }
    return { rows, pictures, warnings: [...new Set(warnings)] };
  }
  return { sheets, readSheet, dispose() { for (const url of urls.values()) URL.revokeObjectURL(url); urls.clear(); } };
}
