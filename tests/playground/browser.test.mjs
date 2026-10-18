import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

// Install Playwright outside the site checkout and expose it through NODE_PATH.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = fileURLToPath(new URL('../../static/', import.meta.url));
const output = process.env.PLAYGROUND_TEST_OUTPUT || '/tmp/playground-qa';
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const target = resolve(root, `.${path}`);
    if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) throw new Error('path');
    const data = await readFile(target);
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })[extname(target)] || 'application/octet-stream');
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
await mkdir(output, { recursive: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const pageErrors = [];
const requests = [];
page.on('pageerror', error => pageErrors.push(error.message));
page.on('request', req => { if (req.url().startsWith('http')) requests.push({ url: req.url(), method: req.method(), body: req.postData() }); });
const waitReady = () => page.waitForFunction(() => !document.getElementById('print').disabled);

// Fixture ZIPs are authored in the browser to exercise the real import path.
async function fixture(options = {}) {
  return page.evaluate(async options => {
    const { zipSync, strToU8 } = await import('./vendor/fflate.js');
    const main = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const rels = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
    const string = (ref, value) => `<c r="${ref}" t="inlineStr"><is><t>${escape(value)}</t></is></c>`;
    const count = options.count ?? 2;
    const rows = [`<row r="3">${['名前', '価格', '写真', '備考'].map((value, index) => string(`${String.fromCharCode(66 + index)}3`, value)).join('')}</row>`];
    for (let i = 0; i < count; i++) {
      const row = i + 4;
      const name = i === 0 ? (options.name ?? '2.2Ω') : `部品${i + 1}`;
      const photo = options.rich && i === 0 ? `<c r="D${row}" t="e" vm="1"><v>#VALUE!</v></c>` : '';
      rows.push(`<row r="${row}">${string(`B${row}`, name)}<c r="C${row}"><v>${i === 0 ? 0 : 10}</v></c>${photo}${string(`E${row}`, options.note ?? '±5%')}</row>`);
    }
    const entries = {
      '_rels/.rels': `<Relationships xmlns="${rels}"><Relationship Id="rId1" Type="${r}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
      'xl/workbook.xml': `<workbook xmlns="${main}" xmlns:r="${r}"><sheets><sheet name="試験用" sheetId="1" r:id="sheet"/><sheet name="空のシート" sheetId="2" r:id="empty"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<Relationships xmlns="${rels}"><Relationship Id="sheet" Type="${r}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="empty" Type="${r}/worksheet" Target="worksheets/sheet2.xml"/>${options.rich ? `<Relationship Id="meta" Type="${r}/sheetMetadata" Target="metadata.xml"/><Relationship Id="values" Type="http://schemas.microsoft.com/office/2017/06/relationships/rdRichValue" Target="richData/rdrichvalue.xml"/><Relationship Id="struct" Type="http://schemas.microsoft.com/office/2017/06/relationships/rdRichValueStructure" Target="richData/rdrichvaluestructure.xml"/><Relationship Id="rels" Type="http://schemas.microsoft.com/office/2022/10/relationships/richValueRel" Target="richData/richValueRel.xml"/>` : ''}</Relationships>`,
      'xl/worksheets/sheet1.xml': `<worksheet xmlns="${main}" xmlns:r="${r}"><sheetData>${rows.join('')}</sheetData></worksheet>`,
      'xl/worksheets/sheet2.xml': `<worksheet xmlns="${main}"><sheetData/></worksheet>`,
    };
    if (options.rich) {
      // Non-zero future-metadata/rich-value indices ensure vm is not treated as the image index.
      entries['xl/metadata.xml'] = `<metadata xmlns="${main}" xmlns:xlrd="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"><metadataTypes><metadataType name="OTHER"/><metadataType name="XLRICHVALUE"/></metadataTypes><futureMetadata name="XLRICHVALUE"><bk><extLst><ext><xlrd:rvb i="1"/></ext></extLst></bk></futureMetadata><valueMetadata><bk><rc t="2" v="0"/></bk></valueMetadata></metadata>`;
      entries['xl/richData/rdrichvalue.xml'] = '<rvData xmlns="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"><rv s="0"><v>unused</v><v>0</v></rv><rv s="0"><v>0</v><v>0</v></rv></rvData>';
      entries['xl/richData/rdrichvaluestructure.xml'] = '<rvStructures xmlns="http://schemas.microsoft.com/office/spreadsheetml/2017/richdata"><s t="_localImage"><k n="_rvRel:LocalImageIdentifier" t="i"/><k n="CalcOrigin" t="i"/></s></rvStructures>';
      entries['xl/richData/richValueRel.xml'] = `<richValueRels xmlns="http://schemas.microsoft.com/office/spreadsheetml/2022/richvaluerel" xmlns:r="${r}"><rel r:id="photo"/></richValueRels>`;
      entries['xl/richData/_rels/richValueRel.xml.rels'] = `<Relationships xmlns="${rels}"><Relationship Id="photo" Type="${r}/image" Target="../media/photo.png"/></Relationships>`;
      entries['xl/media/photo.png'] = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j5WQAAAAASUVORK5CYII='), c => c.charCodeAt(0));
    }
    return [...zipSync(Object.fromEntries(Object.entries(entries).map(([path, value]) => [path, typeof value === 'string' ? strToU8(value) : value])))];
  }, options);
}
async function upload(options) {
  const bytes = await fixture(options);
  await page.locator('#file').setInputFiles({ name: 'fixture.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(bytes) });
}

try {
  await test('サンプル：画像付きExcelの取り込みと選択印刷', async () => {
    await page.goto(`${base}/playground/drawer-labels/`);
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex');
    await page.click('#sample'); await waitReady();
    assert.equal(await page.locator('#header-row').inputValue(), '3');
    assert.equal(await page.locator('#map-name').inputValue(), '1');
    assert.equal(await page.locator('#map-photo').inputValue(), '3');
    assert.equal(await page.locator('#print-root .label-card').count(), 6);
    assert.equal(await page.locator('#print-root img').count(), 6);
    assert.equal(await page.locator('#print-root .label-name').first().innerText(), '2.2Ω');
    await page.screenshot({ path: `${output}/desktop.png`, fullPage: true });
    await page.click('[data-view=cabinet]');
    assert.equal(await page.locator('.drawer').count(), 70);
    await page.locator('button.drawer').first().click(); await waitReady();
    assert.equal(await page.locator('#print-root .label-card').count(), 5);
    await page.click('#select-none');
    await page.waitForFunction(() => document.getElementById('print').disabled);
    assert.equal(await page.locator('#print-root .label-card').count(), 0);
    await page.click('#select-all'); await waitReady();
    await page.click('[data-view=table]');
    assert.equal(await page.locator('#records tr').count(), 6);
    await page.uncheck('#show-photo'); await waitReady();
    assert.equal(await page.locator('#print-root img').count(), 0);
    await page.check('#show-photo'); await waitReady();
  });
  await test('Excelのセル内画像：メタデータ参照と0円', async () => {
    await upload({ rich: true }); await waitReady();
    assert.equal(await page.locator('#print-root img').count(), 1);
    assert.equal(await page.locator('#print-root .label-price').first().innerText(), '¥0');
    await page.selectOption('#sheet', '1');
    await page.waitForFunction(() => document.getElementById('messages').textContent.includes('見出し行'));
    assert.equal(await page.locator('#print').isDisabled(), true);
    assert.equal(await page.locator('#print-root .label-card').count(), 0);
    await page.selectOption('#sheet', '0'); await waitReady();
  });
  await test('70枚を6ページに配置して印刷する', async () => {
    await upload({ count: 70 }); await waitReady();
    assert.equal(await page.locator('#print-root .sheet').count(), 6);
    assert.equal(await page.locator('#print-root .label-card').count(), 70);
    assert.equal(await page.locator('#print-root .label-id').last().innerText(), 'R14C05');
    await page.emulateMedia({ media: 'print' });
    const dimensions = await page.locator('#print-root .label-card').first().evaluate(el => { const box = el.getBoundingClientRect(); return [box.width * 25.4 / 96, box.height * 25.4 / 96]; });
    assert.ok(Math.abs(dimensions[0] - 116) < 0.1);
    assert.ok(Math.abs(dimensions[1] - 26) < 0.1);
    await page.pdf({ path: `${output}/70-labels.pdf`, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
    // Capture the actual print button preparation without opening a system dialog.
    await page.evaluate(() => { window.print = () => {}; });
    await page.click('#calibrate');
    assert.equal(await page.locator('#print-root .label-card').count(), 1);
    assert.equal(await page.locator('#print-root .calibration-line').count(), 1);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: `${output}/calibration.pdf`, preferCSSPageSize: true });
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    await waitReady();
  });
  await test('不正な入力、過大ラベル、収まらない文字は印刷を止める', async () => {
    await upload({ count: 71 });
    await page.waitForFunction(() => document.getElementById('messages').textContent.includes('70件'));
    assert.equal(await page.locator('#print').isDisabled(), true);
    await upload({ name: '長い名前'.repeat(500) });
    await page.waitForFunction(() => document.getElementById('messages').textContent.includes('文字が収まりません'));
    assert.equal(await page.locator('#print').isDisabled(), true);
    await page.locator('#file').setInputFiles({ name: 'broken.xlsx', mimeType: 'application/octet-stream', buffer: Buffer.from('not a ZIP') });
    await page.waitForFunction(() => document.getElementById('filename').textContent.includes('失敗'));
    assert.equal(await page.locator('#print-root .label-card').count(), 0);
    assert.equal(await page.locator('#print').isDisabled(), true);
    await upload({ count: 1 }); await waitReady();
    await page.fill('#width', '278');
    await page.waitForFunction(() => document.getElementById('messages').textContent.includes('収まりません'));
    assert.equal(await page.locator('#print').isDisabled(), true);
    await page.click('#reset-size'); await waitReady();
  });
  await test('HTMLを実行せず表示し、モバイルでも画面がはみ出さない', async () => {
    await upload({ name: '<img src=x onerror=alert(1)>', note: '1行目\n2行目' }); await waitReady();
    assert.equal(await page.locator('#print-root .label-name').first().textContent(), '<img src=x onerror=alert(1)>');
    assert.equal(await page.locator('#print-root img').count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('[data-view=paper]');
    await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(pageErrors, []);
    assert.ok(requests.every(req => req.url.startsWith(base) && req.method === 'GET' && !req.body));
  });
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
