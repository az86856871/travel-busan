// 把每日景點與 OpenStreetMap 底圖資料（tools/map-data/dayN.json）畫成一張靜態的可愛風格 SVG 地圖。
// 不需要網路、沒有互動；build-timetable.js 會把結果直接嵌進時間表網頁。
const fs = require('fs');
const path = require('path');
const { viewport, pointsOf } = require('./map-geom.js');
// 畫面大小可依每張圖調整，renderMap 開頭會呼叫 setDims 設定
let W = 800, H = 520, PERIM, CORNERS;
function setDims(w, h) {
  W = w; H = h; PERIM = 2 * (W + H);
  CORNERS = [[0, [0, 0]], [W, [W, 0]], [W + H, [W, H]], [2 * W + H, [0, H]]];
}
setDims(800, 520);

const COLORS = { s: '#e8703a', f: '#1f3b73', b: '#2f7a3f', t: '#6a3d9a', h: '#e0457b' };
const LEGEND = [['s', '景點'], ['f', '美食'], ['b', '購物'], ['t', '車站・交通'], ['h', '西面（出發・終點）']];
const BASE = { land: '#f6f3ec', sea: '#bfe5f4', coast: '#86c5e0', park: '#d9edc6', roadCase: '#e3dccb', road: '#ffffff', hwy: '#ffe7b8', hwyCase: '#e9c98f', route: '#ff7a59' };
// 可愛版配色：def.cute 為 true 時使用
const CUTE = { land: '#fff6ea', sea: '#b4e4f6', coast: '#7fd0ea', park: '#cdeeb8', roadCase: '#f6e5cf', road: '#ffffff', hwy: '#ffe0e6', hwyCase: '#f8c6d0', route: '#ff6f91' };
const ROAD_W = { motorway: 5.5, trunk: 5, primary: 4, secondary: 3, tertiary: 2.4, residential: 1.8, unclassified: 1.8, pedestrian: 1.6, living_street: 1.6 };

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f1 = n => Math.round(n * 10) / 10;
const textW = (s, cjk, asc) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? cjk : asc), 0);

// ---------- 幾何工具 ----------
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > eps) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const pathD = pts => 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');

function clipSeg(a, b) { // Liang–Barsky：線段與 [0,W]×[0,H] 的交集
  let t0 = 0, t1 = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0]], [dx, W - a[0]], [-dy, a[1]], [dy, H - a[1]]]) {
    if (p === 0) { if (q < 0) return null; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
    else { if (r < t0) return null; if (r < t1) t1 = r; }
  }
  return { t0, t1 };
}

function clipLine(P) {
  const pieces = [];
  let cur = null;
  for (let i = 0; i < P.length - 1; i++) {
    const a = P[i], b = P[i + 1], c = clipSeg(a, b);
    if (!c) { if (cur) { pieces.push(cur); cur = null; } continue; }
    const at = t => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    if (!cur) cur = { pts: [at(c.t0)], sOut: c.t0 > 0 || i > 0, eOut: false };
    cur.pts.push(at(c.t1));
    if (c.t1 < 1) { cur.eOut = true; pieces.push(cur); cur = null; }
  }
  if (cur) pieces.push(cur);
  return pieces;
}

// ---------- 海岸線：串成長線、算出海面多邊形 ----------
function stitch(ways) {
  const byStart = new Map();
  ways.forEach((w, i) => byStart.set(w.nodes[0], i));
  const ends = new Set(ways.map(w => w.nodes[w.nodes.length - 1]));
  const used = new Set(), chains = [];
  function follow(i) {
    let pts = ways[i].geom.slice(), closed = false;
    used.add(i);
    let last = ways[i].nodes[ways[i].nodes.length - 1];
    const first = ways[i].nodes[0];
    for (;;) {
      if (last === first && pts.length > 2) { closed = true; break; }
      const j = byStart.get(last);
      if (j === undefined || used.has(j)) break;
      used.add(j);
      pts = pts.concat(ways[j].geom.slice(1));
      last = ways[j].nodes[ways[j].nodes.length - 1];
    }
    return { pts, closed };
  }
  ways.forEach((w, i) => { if (!ends.has(w.nodes[0]) && !used.has(i)) chains.push(follow(i)); });
  ways.forEach((w, i) => { if (!used.has(i)) chains.push(follow(i)); });
  return chains;
}

function tOf(p) { // 邊界上的點，順時針量到的位置
  const e = 1e-3;
  if (p[1] < e) return p[0];
  if (p[0] > W - e) return W + p[1];
  if (p[1] > H - e) return W + H + (W - p[0]);
  return 2 * W + H + (H - p[1]);
}

function buildSea(coastWays, project) {
  const pieces = [], islands = [], lines = [];
  for (const ch of stitch(coastWays)) {
    const P = ch.pts.map(([la, lo]) => project(la, lo));
    let ps = clipLine(P);
    if (ch.closed && ps.length >= 2 && !ps[0].sOut && !ps[ps.length - 1].eOut) {
      const first = ps.shift(), last = ps.pop();
      ps.push({ pts: last.pts.concat(first.pts.slice(1)), sOut: last.sOut, eOut: first.eOut });
    }
    for (const p of ps) {
      if (p.sOut && p.eOut) pieces.push(p);
      else if (!p.sOut && !p.eOut && ch.closed) {
        let area = 0;
        for (let i = 0; i < p.pts.length - 1; i++) area += p.pts[i][0] * p.pts[i + 1][1] - p.pts[i + 1][0] * p.pts[i][1];
        if (area < 0) islands.push(p.pts); // 視覺上逆時針＝島（陸地在左）
      }
      lines.push(p.pts);
    }
  }
  const starts = pieces.map(p => tOf(p.pts[0])), endsT = pieces.map(p => tOf(p.pts[p.pts.length - 1]));
  const used = new Set(), loops = [];
  for (let i = 0; i < pieces.length; i++) {
    if (used.has(i)) continue;
    const loop = [];
    let k = i;
    while (!used.has(k)) {
      used.add(k);
      loop.push(...pieces[k].pts);
      let best = -1, bd = Infinity;
      for (let j = 0; j < pieces.length; j++) {
        const d = (starts[j] - endsT[k] + PERIM) % PERIM;
        if (d < bd) { bd = d; best = j; }
      }
      CORNERS.map(([t, pt]) => [(t - endsT[k] + PERIM) % PERIM, pt])
        .filter(([d]) => d > 0 && d < bd).sort((a, b) => a[0] - b[0]).forEach(([, pt]) => loop.push(pt));
      k = best;
    }
    loops.push(loop);
  }
  return { loops, islands, lines };
}

// ---------- 圖釘與標籤 ----------
function pinSvg(p, i, proj, k, big) {
  const [x, y] = proj(p.lat, p.lon), col = COLORS[p.type], cy = y - 26;
  const label = (p.emoji ? p.emoji + ' ' : '') + p.name;
  const w = textW(label, 14.5, 8) + 18, h = 22;
  let rx, ry;
  switch (p.dir || 'r') {
    case 'l': rx = x - 17 - w; ry = cy - h / 2; break;
    case 't': rx = x - w / 2; ry = cy - 15 - h; break;
    case 'b': rx = x - w / 2; ry = y + 5; break;
    default: rx = x + 17; ry = cy - h / 2;
  }
  rx += p.dx || 0; ry += p.dy || 0;
  // 整組圖釘是以圖釘尖端為中心放大 k 倍，所以要用放大後的位置判斷有沒有超出畫面
  const sl = x + (rx - x) * k, sr = x + (rx + w - x) * k, st = y + (ry - y) * k, sb = y + (ry + h - y) * k;
  if (sl < 4) rx += (4 - sl) / k; else if (sr > W - 4) rx -= (sr - (W - 4)) / k;
  if (st < 4) ry += (4 - st) / k; else if (sb > H - 4) ry -= (sb - (H - 4)) / k;
  return `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k}) translate(${f1(-x)} ${f1(-y)})">`
    + `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9" ry="3" fill="#000" opacity=".18"/>`
    + `<rect x="${f1(rx)}" y="${f1(ry)}" width="${f1(w)}" height="${h}" rx="11" fill="#fff" stroke="${col}" stroke-width="1.6"${p.est ? ' stroke-dasharray="4 3"' : ''}/>`
    + `<text x="${f1(rx + w / 2)}" y="${f1(ry + 15.5)}" text-anchor="middle" font-size="14" font-weight="700" fill="${col}">${esc(label)}</text>`
    + `<path d="M${f1(x)} ${f1(y)}C${f1(x - 4)} ${f1(y - 9)} ${f1(x - 13)} ${f1(y - 15)} ${f1(x - 13)} ${f1(cy)}A13 13 0 1 1 ${f1(x + 13)} ${f1(cy)}C${f1(x + 13)} ${f1(y - 15)} ${f1(x + 4)} ${f1(y - 9)} ${f1(x)} ${f1(y)}Z" fill="${col}" stroke="#fff" stroke-width="2"/>`
    + `<circle cx="${f1(x)}" cy="${f1(cy)}" r="${big ? 10 : 8.5}" fill="#fff"/>`
    + `<text x="${f1(x)}" y="${f1(cy + (big ? 5.5 : 4.5))}" text-anchor="middle" font-size="${big ? 15 : 12.5}" font-weight="800" fill="${col}">${p.num || i + 1}</text></g>`;
}

// 群組圖釘：地點靠得太近時，在實際位置畫小圓點，旁邊用一張清單卡片列出各點（編號與名稱）
function clusterSvg(p, proj, k) {
  const pts = p.items.map(it => proj(it.lat, it.lon));
  const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length, cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
  const lines = p.items.map(it => (it.est ? '≈ ' : '') + (it.emoji ? it.emoji + ' ' : '') + it.name);
  const w = Math.max(...lines.map(l => textW(l, 13.5, 7.5))) + 46, h = 12 + lines.length * 24;
  let x, y, ax, ay; // 卡片左上角與連線接點
  switch (p.dir || 'r') {
    case 'l': x = cx - 34 - w; y = cy - h / 2; ax = x + w; ay = cy; break;
    case 't': x = cx - w / 2; y = cy - 30 - h; ax = cx; ay = y + h; break;
    case 'b': x = cx - w / 2; y = cy + 30; ax = cx; ay = y; break;
    default: x = cx + 34; y = cy - h / 2; ax = x; ay = cy;
  }
  x += p.dx || 0; y += p.dy || 0;
  { const sl = cx + (x - cx) * k, sr = cx + (x + w - cx) * k, st = cy + (y - cy) * k, sb = cy + (y + h - cy) * k;
    if (sl < 4) x += (4 - sl) / k; else if (sr > W - 4) x -= (sr - (W - 4)) / k;
    if (st < 4) y += (4 - st) / k; else if (sb > H - 4) y -= (sb - (H - 4)) / k; }
  let s = `<g transform="translate(${f1(cx)} ${f1(cy)}) scale(${k}) translate(${f1(-cx)} ${f1(-cy)})">`;
  s += `<path d="M${f1(cx)} ${f1(cy)}L${f1(ax)} ${f1(ay)}" stroke="#9fb3c1" stroke-width="2" stroke-linecap="round"/>`;
  s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="14" fill="#fff" stroke="${COLORS[p.type || 's']}" stroke-width="1.6"/>`;
  p.items.forEach((it, i) => {
    const col = COLORS[it.type], ty = y + 18 + i * 24;
    s += `<circle cx="${f1(x + 18)}" cy="${f1(ty - 4)}" r="9.5" fill="${col}"/><text x="${f1(x + 18)}" y="${f1(ty + 1)}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#fff">${it.num}</text>`;
    s += `<text x="${f1(x + 34)}" y="${f1(ty + 1)}" font-size="13.5" font-weight="700" fill="${col}">${esc(lines[i])}</text>`;
  });
  // 群組內每個點畫成帶編號的小圓圈；靠太近的圓圈會稍微撥開，並用細線連回真正的位置
  const bd = pts.map(q => [q[0], q[1]]), R = 9.5;
  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < bd.length; i++) for (let j = i + 1; j < bd.length; j++) {
      let dx = bd[j][0] - bd[i][0], dy = bd[j][1] - bd[i][1], d = Math.hypot(dx, dy);
      if (d < 2 * R + 2) {
        if (d < 0.01) { dx = 1; dy = 0.3 * (j - i); d = Math.hypot(dx, dy); }
        const push = (2 * R + 2 - d) / 2;
        bd[i][0] -= dx / d * push; bd[i][1] -= dy / d * push; bd[j][0] += dx / d * push; bd[j][1] += dy / d * push;
      }
    }
  }
  pts.forEach((q, i) => {
    const col = COLORS[p.items[i].type];
    s += `<line x1="${f1(q[0])}" y1="${f1(q[1])}" x2="${f1(bd[i][0])}" y2="${f1(bd[i][1])}" stroke="${col}" stroke-width="1.5"/>`
      + `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="2.5" fill="${col}"/>`;
  });
  bd.forEach((q, i) => {
    const col = COLORS[p.items[i].type];
    s += `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="${R}" fill="${col}" stroke="#fff" stroke-width="2"/><text x="${f1(q[0])}" y="${f1(q[1] + 4.2)}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${p.items[i].num}</text>`;
  });
  return s + '</g>';
}

// ---------- 組圖 ----------
function renderMap(day, idx, def, dataDir) {
  const C = def.cute ? CUTE : BASE;
  const k = def.ui || 1; // 圖釘、標題、圖例的放大倍率（圖縮小顯示時用來保持文字大小）
  const file = path.join(dataDir, `day${day}-${idx}.json`);
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { coast: [], roads: [], greens: [] };
  setDims(def.w || 800, def.h || 520);
  const vp = viewport(pointsOf(def.pins), { w: W, h: H, ...(def.pad || {}), ...(def.minX ? { minX: def.minX, minY: def.minY } : {}) }), proj = vp.project;
  const inView = P => P.some(p => p[0] > -20 && p[0] < W + 20 && p[1] > -20 && p[1] < H + 20)
    || (Math.min(...P.map(p => p[0])) < W && Math.max(...P.map(p => p[0])) > 0 && Math.min(...P.map(p => p[1])) < H && Math.max(...P.map(p => p[1])) > 0);

  let s = `<svg class="cmap" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(def.title)}" font-family="'Noto Sans TC','PingFang TC','Microsoft JhengHei','Heiti TC',sans-serif">`;
  s += `<defs><clipPath id="c${day}-${idx}"><rect width="${W}" height="${H}" rx="18"/></clipPath></defs><g clip-path="url(#c${day}-${idx})">`;
  s += `<rect width="${W}" height="${H}" fill="${C.land}"/>`;

  // 公園、森林
  let g = '';
  for (const gr of data.greens) {
    const P = gr.geom.map(([la, lo]) => proj(la, lo));
    let area = 0;
    for (let i = 0; i < P.length - 1; i++) area += P[i][0] * P[i + 1][1] - P[i + 1][0] * P[i][1];
    if (Math.abs(area / 2) < 500 || !inView(P)) continue;
    g += pathD(simplify(P, 0.8)) + 'Z';
  }
  if (g) s += `<path d="${g}" fill="${C.park}"/>`;

  // 海
  const sea = buildSea(data.coast, proj);
  let d = '';
  sea.loops.forEach(l => { d += pathD(simplify(l, 0.7)) + 'Z'; });
  sea.islands.forEach(l => { d += pathD(simplify(l, 0.7)) + 'Z'; });
  if (d) s += `<path d="${d}" fill="${C.sea}" fill-rule="evenodd"/>`;
  let cl = '';
  sea.lines.forEach(l => { cl += pathD(simplify(l, 0.7)); });
  if (cl) s += `<path d="${cl}" fill="none" stroke="${C.coast}" stroke-width="2" stroke-linejoin="round"/>`;

  // 道路（外框 → 內線）
  const byCls = {};
  for (const r of data.roads) {
    const P = r.geom.map(([la, lo]) => proj(la, lo));
    if (!inView(P)) continue;
    (byCls[r.cls] = byCls[r.cls] || []).push(pathD(simplify(P, 0.7)));
  }
  const order = ['living_street', 'pedestrian', 'unclassified', 'residential', 'tertiary', 'secondary', 'primary', 'trunk', 'motorway'];
  const known = order.filter(c => byCls[c]);
  for (const c of known) s += `<path d="${byCls[c].join('')}" fill="none" stroke="${c === 'motorway' || c === 'trunk' ? C.hwyCase : C.roadCase}" stroke-width="${ROAD_W[c] + 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
  for (const c of known) s += `<path d="${byCls[c].join('')}" fill="none" stroke="${c === 'motorway' || c === 'trunk' ? C.hwy : C.road}" stroke-width="${ROAD_W[c]}" stroke-linecap="round" stroke-linejoin="round"/>`;

  // 點綴圖示
  for (const [emo, fx, fy, sz] of def.deco || []) s += `<text x="${f1(fx * W)}" y="${f1(fy * H)}" font-size="${f1((sz || 28) * k)}" text-anchor="middle">${emo}</text>`;

  // 附近的顯眼地標（只當位置參考，沒有編號）
  for (const lm of def.landmarks || []) {
    const [px0, py0] = proj(lm.lat, lm.lon), lx0 = px0 + (lm.dx || 0), ly0 = py0 + (lm.dy || 0);
    if (lx0 < 8 || lx0 > W - 8 || ly0 < 30 || ly0 > H - 30) continue;
    s += `<g transform="translate(${f1(lx0)} ${f1(ly0)}) scale(${k})"><text x="0" y="6" font-size="20" text-anchor="middle">${lm.emoji}</text>`
      + `<text x="0" y="24" font-size="11.5" font-weight="700" text-anchor="middle" fill="#7b8a96" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(lm.name)}</text></g>`;
  }

  // 路線（點線，依序連接）
  const tips = pointsOf(def.pins).map(p => proj(p.lat, p.lon));
  const line = tips.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L');
  if (!def.noRoute) { // noRoute：不畫連線，只靠圖釘上的數字表示順序
    s += `<path d="M${line}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="0.1 11" opacity=".9"/>`;
    s += `<path d="M${line}" fill="none" stroke="${C.route}" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 11"/>`;
  }

  // 圖釘
  def.pins.forEach((p, i) => { s += p.items ? clusterSvg(p, proj, k) : pinSvg(p, i, proj, k, def.noRoute); });

  // 圖外景點：貼在畫面邊緣，標出方向與大約距離
  for (const o of def.offmap || []) {
    const oy = o.y != null ? o.y * H : proj(o.lat, def.pins[0].lon)[1], col = COLORS[o.type];
    const label = (o.emoji ? o.emoji + ' ' : '') + o.name, w = Math.max(textW(label, 14.5, 8), textW(o.note, 11.5, 6.5)) + 52;
    const sw = w * k; // 縮放後的寬度
    const ox = o.side === 'r' ? W - 8 - sw : (o.x != null ? Math.max(8, Math.min(W - 8 - sw, o.x * W - sw / 2)) : 8);
    s += `<g transform="translate(${f1(ox)} ${f1(oy)}) scale(${k})"><rect x="0" y="-21" width="${f1(w)}" height="42" rx="21" fill="#fff" stroke="${col}" stroke-width="1.6"/>`
      + `<circle cx="21" cy="0" r="14" fill="${col}"/><text x="21" y="6" text-anchor="middle" font-size="16" font-weight="800" fill="#fff">${o.num}</text>`
      + `<text x="42" y="-2" font-size="14" font-weight="700" fill="${col}">${esc(label)}</text><text x="42" y="14" font-size="11.5" fill="#6b7b88">${esc(o.note)}</text></g>`;
  }
  // 標題、指北、圖例
  const tw = textW(def.title, 17, 10) + 30;
  s += `<g transform="translate(12 12) scale(${k})"><rect width="${f1(tw)}" height="34" rx="17" fill="${C.route}"/><text x="${f1(tw / 2)}" y="23" text-anchor="middle" font-size="17" font-weight="800" fill="#fff">${esc(def.title)}</text></g>`;
  s += `<g transform="translate(${W - 12} 12) scale(${k})"><circle cx="-22" cy="26" r="19" fill="#fff" opacity=".92"/><path d="M-22 10L-16 28L-22 24L-28 28Z" fill="${C.route}"/><text x="-22" y="42" text-anchor="middle" font-size="10" font-weight="800" fill="#5d6f7e">N</text></g>`;
  let lx = 12;
  const lg = LEGEND.map(([t, name]) => { const x = lx; lx += 22 + textW(name, 13, 7) + 16; return `<circle cx="${x + 5}" cy="-15" r="5.5" fill="${COLORS[t]}"/><text x="${x + 15}" y="-10.5" font-size="13" fill="#4a5a68">${name}</text>`; }).join('');
  s += `<g transform="translate(10 ${H - 10}) scale(${k})"><rect x="0" y="-32" width="${f1(lx - 6)}" height="30" rx="9" fill="#fff" opacity=".92" stroke="#9fb3c1" stroke-dasharray="4 3"/>${lg}</g>`;
  s += `</g><rect width="${W}" height="${H}" rx="18" fill="none" stroke="#fff" stroke-width="3"/></svg>`;
  return s;
}

module.exports = { renderMap };
