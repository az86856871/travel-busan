// 每日小地圖的畫面範圍與投影（fetch-map-data.js 與 render-map.js 共用）。
// 依景點座標算出比例，讓所有景點剛好落在 800×520 的畫面內，並回傳要向 OpenStreetMap 要資料的經緯度範圍。
const DEFAULTS = { w: 800, h: 520, padX: 120, padTop: 100, padBottom: 90, minX: 900, minY: 600 };
const M_LAT = 110574, M_LON = 111320;

function viewport(pins, opts = {}) {
  const { w: W, h: H, padX: PAD_X, padTop: PAD_TOP, padBottom: PAD_BOTTOM, minX: MIN_X, minY: MIN_Y } = { ...DEFAULTS, ...opts };
  const lats = pins.map(p => p.lat), lons = pins.map(p => p.lon);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lon0 = (Math.min(...lons) + Math.max(...lons)) / 2;
  const kx = M_LON * Math.cos(lat0 * Math.PI / 180);
  const mx = lon => (lon - lon0) * kx;
  const my = lat => (lat - lat0) * M_LAT;
  const xs = pins.map(p => mx(p.lon)), ys = pins.map(p => my(p.lat));
  const spanX = Math.max(Math.max(...xs) - Math.min(...xs), MIN_X);
  const spanY = Math.max(Math.max(...ys) - Math.min(...ys), MIN_Y);
  const s = Math.min((W - 2 * PAD_X) / spanX, (H - PAD_TOP - PAD_BOTTOM) / spanY); // 每公尺幾個畫素
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const yc = (PAD_TOP + H - PAD_BOTTOM) / 2;
  const project = (lat, lon) => [W / 2 + (mx(lon) - cx) * s, yc - (my(lat) - cy) * s];
  const invLon = x => lon0 + ((x - W / 2) / s + cx) / kx;
  const invLat = y => lat0 + ((yc - y) / s + cy) / M_LAT;
  const margin = 0.08;
  const bbox = {
    w: invLon(-W * margin), e: invLon(W * (1 + margin)),
    n: invLat(-H * margin), s: invLat(H * (1 + margin)),
  };
  return { W, H, s, project, bbox, widthKm: (bbox.e - bbox.w) * kx / 1000 };
}

// 地圖上所有要放進畫面的點（群組圖釘 items 也算）
const pointsOf = pins => pins.flatMap(p => p.items || [p]);

module.exports = { viewport, pointsOf };
