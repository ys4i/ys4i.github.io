// Exact dynamic programming over straight-cut (guillotine) layouts.
// Normal coordinates are sums of label sides, in tenths of a millimetre.
const cache = new Map();

export function pageLayout(width, height, orientation = 'auto') {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 20 || height < 12) throw new Error('ラベルは幅20mm以上・高さ12mm以上にしてください。');
  const w = Math.round(width * 10), h = Math.round(height * 10);
  if (Math.abs(w - width * 10) > 1e-6 || Math.abs(h - height * 10) > 1e-6) throw new Error('幅・高さは0.1mm単位で指定してください。');
  if (!['auto', 'portrait', 'landscape'].includes(orientation)) throw new Error('用紙の向きを選んでください。');
  const key = `${w}/${h}/${orientation}`;
  if (cache.has(key)) return cache.get(key);
  const points = new Set([0]);
  for (let a = 0; a * w <= 2770; a++) for (let b = 0; a * w + b * h <= 2770; b++) points.add(a * w + b * h);
  const sizes = [...points].sort((a, b) => a - b);
  const snap = value => {
    let lo = 0, hi = sizes.length;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (sizes[mid] <= value) lo = mid; else hi = mid; }
    return sizes[lo];
  };
  const memo = new Map();
  const empty = { count: 0, rotations: 0, cuts: 0, usedWidth: 0, usedHeight: 0, kind: 'empty' };
  const better = (a, b) => a.count > b.count || (a.count === b.count && (a.cuts < b.cuts || (a.cuts === b.cuts && (a.rotations < b.rotations || (a.rotations === b.rotations && a.usedWidth * a.usedHeight < b.usedWidth * b.usedHeight)))));
  function solve(rawW, rawH) {
    const W = snap(rawW), H = snap(rawH), id = `${W}/${H}`;
    if (!W || !H) return empty;
    if (memo.has(id)) return memo.get(id);
    let best = empty;
    for (const rotated of [false, true]) {
      const cw = rotated ? h : w, ch = rotated ? w : h;
      const cols = Math.floor(W / cw), rows = Math.floor(H / ch), count = cols * rows;
      if (!count) continue;
      const grid = { count, rotations: rotated ? count : 0, cuts: cols + rows - 2, kind: 'grid', cols, rows, rotated, usedWidth: cols * cw, usedHeight: rows * ch };
      if (better(grid, best)) best = grid;
    }
    // A full grid meeting the area bound needs no subdivision.
    if (best.count && !best.rotations && best.count === Math.floor(W * H / (w * h))) { memo.set(id, best); return best; }
    for (const axis of ['x', 'y']) {
      const length = axis === 'x' ? W : H;
      for (const cut of sizes) {
        if (!cut) continue;
        if (cut > length / 2) break;
        const a = axis === 'x' ? solve(cut, H) : solve(W, cut);
        if (!a.count) continue;
        const b = axis === 'x' ? solve(W - cut, H) : solve(W, H - cut);
        if (!b.count) continue;
        const candidate = {
          kind: 'split', axis, a, b, count: a.count + b.count, rotations: a.rotations + b.rotations, cuts: a.cuts + b.cuts + 1,
          usedWidth: axis === 'x' ? a.usedWidth + b.usedWidth : Math.max(a.usedWidth, b.usedWidth),
          usedHeight: axis === 'y' ? a.usedHeight + b.usedHeight : Math.max(a.usedHeight, b.usedHeight),
        };
        if (better(candidate, best)) best = candidate;
      }
    }
    memo.set(id, best);
    return best;
  }
  function positions(tree, x = 0, y = 0) {
    if (tree.kind === 'empty') return [];
    if (tree.kind === 'split') return [
      ...positions(tree.a, x, y),
      ...positions(tree.b, x + (tree.axis === 'x' ? tree.a.usedWidth : 0), y + (tree.axis === 'y' ? tree.a.usedHeight : 0)),
    ];
    const cw = tree.rotated ? h : w, ch = tree.rotated ? w : h;
    return Array.from({ length: tree.count }, (_, i) => ({ x: (x + (i % tree.cols) * cw) / 10, y: (y + Math.floor(i / tree.cols) * ch) / 10, width: cw / 10, height: ch / 10, rotated: tree.rotated }));
  }
  let chosen;
  for (const direction of orientation === 'auto' ? ['landscape', 'portrait'] : [orientation]) {
    const pageWidth = direction === 'portrait' ? 210 : 297, pageHeight = direction === 'portrait' ? 297 : 210;
    const usableWidth = pageWidth - 20, usableHeight = pageHeight - 20;
    const tree = solve(usableWidth * 10, usableHeight * 10);
    if (!chosen || better(tree, chosen.tree)) chosen = { tree, orientation: direction, pageWidth, pageHeight, usableWidth, usableHeight };
  }
  if (!chosen.tree.count) throw new Error('ラベルがA4の印刷範囲（周囲10mmの余白）に収まりません。');
  const { tree, ...paper } = chosen;
  const result = { ...paper, capacity: tree.count, rotations: tree.rotations, positions: positions(tree), areaUpperBound: Math.floor((paper.usableWidth * 10) * (paper.usableHeight * 10) / (w * h)) };
  if (cache.size > 40) cache.clear();
  cache.set(key, result);
  return result;
}

// Merge touching collinear edges: every shared cutting line is drawn once.
export function cutLines(positions) {
  const groups = new Map();
  function add(axis, fixed, start, end) {
    const key = `${axis}/${fixed.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, { axis, fixed, intervals: [] });
    groups.get(key).intervals.push([start, end]);
  }
  for (const p of positions) {
    add('x', p.y, p.x, p.x + p.width); add('x', p.y + p.height, p.x, p.x + p.width);
    add('y', p.x, p.y, p.y + p.height); add('y', p.x + p.width, p.y, p.y + p.height);
  }
  const lines = [];
  for (const { axis, fixed, intervals } of groups.values()) {
    const merged = [];
    for (const interval of intervals.sort((a, b) => a[0] - b[0])) {
      const last = merged.at(-1);
      if (last && interval[0] <= last[1] + 1e-6) last[1] = Math.max(last[1], interval[1]); else merged.push([...interval]);
    }
    for (const [start, end] of merged) lines.push(axis === 'x' ? { x1: start, y1: fixed, x2: end, y2: fixed } : { x1: fixed, y1: start, x2: fixed, y2: end });
  }
  return lines;
}
