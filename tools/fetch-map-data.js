// 向 OpenStreetMap（Overpass API）抓每日小地圖需要的海岸線、道路與公園，存到 tools/map-data/dayN.json。
// 只需要在景點座標有改動時執行一次：node tools/fetch-map-data.js；平常 build 不需要網路。
const fs = require('fs');
const path = require('path');
const { viewport, pointsOf } = require('./map-geom.js');
const MAPS = require('./maps-5d-alt.js');

const OUT = path.join(__dirname, 'map-data');
fs.mkdirSync(OUT, { recursive: true });
const onlyDay = (process.argv.find(a => a.startsWith('--day=')) || '').slice(6);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const r5 = n => Math.round(n * 1e5) / 1e5;

async function overpass(query) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'busan-trip-planner/1.0' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (res.ok) return res.json();
    console.log('  retry', res.status);
    await sleep(15000);
  }
  throw new Error('Overpass failed');
}

(async () => {
  for (const [day, defs] of Object.entries(MAPS)) for (let idx = 0; idx < defs.length; idx++) {
    const def = defs[idx];
    const vp = viewport(pointsOf(def.pins), { w: def.w || 800, h: def.h || 520, ...(def.pad || {}), ...(def.minX ? { minX: def.minX, minY: def.minY } : {}) });
    const { s, w, n, e } = vp.bbox;
    const box = `${s.toFixed(5)},${w.toFixed(5)},${n.toFixed(5)},${e.toFixed(5)}`;
    let classes = vp.widthKm < 6 ? 'motorway|trunk|primary|secondary|tertiary' : 'motorway|trunk|primary';
    if (def.detail) classes += '|residential|unclassified|pedestrian|living_street';
    if (onlyDay && String(onlyDay) !== day) continue;
    const file = path.join(OUT, `day${day}-${idx}.json`);
    if (fs.existsSync(file) && !process.argv.includes('--force')) { console.log('day', day, idx, 'exists, skip'); continue; }
    // 範圍很大（跨區）的天數不抓公園與森林，避免資料量過大逾時
    const greens = vp.widthKm < 6
      ? `way["leisure"="park"](${box});way["landuse"="forest"](${box});way["natural"="wood"](${box});` : '';
    const q = `[out:json][timeout:120];(
      way["natural"="coastline"](${box});
      way["highway"~"^(${classes})$"](${box});
      ${greens}
    );out geom;`;
    console.log('day', day, idx, 'width km', vp.widthKm.toFixed(1));
    const j = await overpass(q);
    const data = { coast: [], roads: [], greens: [] };
    for (const el of j.elements) {
      if (el.type !== 'way' || !el.geometry) continue;
      const geom = el.geometry.map(g => [r5(g.lat), r5(g.lon)]);
      const t = el.tags || {};
      if (t.natural === 'coastline') data.coast.push({ nodes: el.nodes, geom });
      else if (t.highway) data.roads.push({ cls: t.highway, geom });
      else data.greens.push({ geom });
    }
    fs.writeFileSync(file, JSON.stringify(data));
    console.log('  coast', data.coast.length, 'roads', data.roads.length, 'greens', data.greens.length);
    await sleep(3000);
  }
})();
