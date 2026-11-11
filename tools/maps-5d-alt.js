// 5 天 4 夜備案（timetable-5d-alt.html）每日位置示意圖的資料。每天一張圖。
// pins 的 type：s 景點、f 美食、b 購物、t 車站／交通；dir：名稱標籤在圖釘的哪一側（r 右、l 左、t 上、b 下）；
// num：圖釘上的編號（對應當天行程順序，同一個選項可重複）；est：true 代表位置是估計（標籤會用虛線框）。
// 地點靠太近時用群組圖釘：{ items: [...], dir } 會在實際位置畫小圓點，旁邊用一張卡片列出各點。
// offmap：離這張圖太遠、放不進畫面的地點，貼在畫面邊緣標出方向與大約距離（x、y 是畫面比例，side 為 r 時靠右）。
// landmarks：附近的顯眼地標，只當位置參考（灰色小圖示，沒有編號）。
// 座標多半來自 OpenStreetMap，查不到的用 est 標示；地圖只是示意，實際位置請以 Google Maps 為準。
// 改了座標後，先執行 node tools/fetch-map-data.js --force 重抓底圖資料，再執行 node tools/build-timetable.js。
const BASE = { cute: true, noRoute: true, detail: true, ui: 1.2, maxWidth: 640, w: 800, h: 640, pad: { padX: 130, padTop: 120, padBottom: 110 } };
const HOME = (extra) => ({ name: `西面（${extra}）`, emoji: '🏨', type: 'h', num: '西' });

module.exports = {
  1: [{
    ...BASE,
    title: '🌈 Day 1 南浦洞散步地圖',
    offmap: [
      { name: '甘川文化村', emoji: '🎨', type: 's', num: 1, y: 0.5, note: '◀ 往西約 3 公里' },
      { ...HOME('出發・回到這裡'), x: 0.66, y: 0.1, note: '▲ 往北約 6 公里' },
    ],
    pins: [
      { name: '札嘎其市場', emoji: '🐟', num: 2, type: 'f', lat: 35.0957, lon: 129.0251, dir: 'b' },
      { name: '新東亞市場（二選一）', emoji: '🐟', num: 2, type: 'f', lat: 35.0963, lon: 129.0266, dir: 'r', est: true },
      { name: '國際市場', emoji: '🛍️', num: 3, type: 'b', lat: 35.1006, lon: 129.0280, dir: 'l' },
      { name: 'BIFF 廣場', emoji: '🍢', num: 4, type: 's', lat: 35.0988, lon: 129.0290, dir: 'b' },
      { name: 'KPOP FRIENDS', emoji: '🎤', num: 5, type: 'b', lat: 35.0984, lon: 129.0309, dir: 't', est: true },
      { name: '樂天百貨光復店', emoji: '🏬', num: 6, type: 'b', lat: 35.0979, lon: 129.0364, dir: 't' },
      { name: '富平罐頭市場', emoji: '🥫', num: 7, type: 'f', lat: 35.1014, lon: 129.0257, dir: 't' },
      { name: '南浦站', emoji: '🚇', num: 8, type: 't', lat: 35.0979, lon: 129.0349, dir: 'b' },
    ],
    landmarks: [
      { name: '釜山塔', emoji: '🗼', lat: 35.1013, lon: 129.0322 },
      { name: '影島大橋', emoji: '🌉', lat: 35.0956, lon: 129.0365 },
    ],
    deco: [['☁️', 0.3, 0.14, 34], ['☁️', 0.7, 0.1, 30], ['✨', 0.12, 0.3, 22], ['🌸', 0.14, 0.7, 24], ['🌳', 0.07, 0.3], ['⛵', 0.85, 0.85], ['🐟', 0.93, 0.7, 22], ['🌊', 0.7, 0.92, 24]],
  }],

  2: [{
    ...BASE,
    h: 760, detail: false,
    title: '🌈 Day 2 海雲台＆機張路線圖',
    offmap: [
      { ...HOME('出發・回程'), y: 0.55, note: '◀ 往西約 12 公里' },
      { name: '機張市場', emoji: '🦀', type: 'f', num: 10, x: 0.6, y: 0.07, note: '▲ 往北約 5 公里' },
    ],
    pins: [
      { name: '尾浦站（天空膠囊）', emoji: '🚃', num: 1, type: 't', lat: 35.1581, lon: 129.1729, dir: 't' },
      {
        dir: 'r', dx: 50, dy: -20, type: 's', items: [
          { name: '青沙浦平交道', emoji: '🚃', num: 2, type: 's', lat: 35.1609, lon: 129.1903, est: true },
          { name: 'Orb Coffee Salon', emoji: '☕', num: 3, type: 'f', lat: 35.1619, lon: 129.1928, est: true },
          { name: '青沙浦天空步道', emoji: '🌉', num: 4, type: 's', lat: 35.1642, lon: 129.1961 },
          { name: '午餐（青沙浦）', emoji: '🦪', num: 5, type: 'f', lat: 35.1604, lon: 129.1920, est: true },
          { name: '海岸列車（青沙浦站）', emoji: '🚋', num: 6, type: 't', lat: 35.1613, lon: 129.1914 },
        ],
      },
      { name: '松亭站', emoji: '🚉', num: 7, type: 't', lat: 35.1877, lon: 129.2021, dir: 'l' },
      { name: '海東龍宮寺', emoji: '🛕', num: 8, type: 's', lat: 35.1884, lon: 129.2230, dir: 'r' },
      { name: 'Skyline Luge', emoji: '🛷', num: 9, type: 's', lat: 35.1941, lon: 129.2191, dir: 'l' },
    ],
    landmarks: [
      { name: '海雲台海水浴場', emoji: '🏖️', lat: 35.1578, lon: 129.1581 },
      { name: '青沙浦雙燈塔', emoji: '🗼', lat: 35.1596, lon: 129.1921, dx: -34, dy: 28 },
      { name: '松亭海水浴場', emoji: '🏖️', lat: 35.1805, lon: 129.2033, dx: 24 },
    ],
    deco: [['☁️', 0.3, 0.1, 34], ['✨', 0.12, 0.3, 22], ['🌳', 0.1, 0.2], ['⛵', 0.93, 0.78], ['🐟', 0.9, 0.55, 22], ['🌊', 0.75, 0.9, 24]],
  }],

  3: [{
    ...BASE,
    title: '🌈 Day 3 海雲台＆廣安里路線圖',
    offmap: [{ ...HOME('出發・回程'), y: 0.3, note: '◀ 往西約 5–9 公里' }],
    pins: [
      { name: '海理團路', emoji: '☕', num: 1, type: 's', lat: 35.1630, lon: 129.1630, dir: 'b' },
      { name: 'SPA LAND 汗蒸幕', emoji: '♨️', num: 2, type: 's', lat: 35.1688, lon: 129.1296, dir: 't' },
      { name: '廣安里', emoji: '🌉', num: 3, type: 's', lat: 35.1509, lon: 129.1168, dir: 'b' },
      { name: 'Yacht Holic（出發地待確認）', emoji: '⛵', num: 4, type: 's', lat: 35.1569, lon: 129.1415, dir: 'l', est: true },
      {
        dir: 'b', dy: 38, type: 's', items: [
          { name: 'The Bay 101 夜景', emoji: '🌃', num: 5, type: 's', lat: 35.1566, lon: 129.1521 },
          { name: '晚餐（Bay 101 附近）', emoji: '🍽️', num: 6, type: 'f', lat: 35.1578, lon: 129.1498, est: true },
          { name: '冬柏站', emoji: '🚇', num: 7, type: 't', lat: 35.1612, lon: 129.1481 },
        ],
      },
    ],
    landmarks: [
      { name: '廣安大橋', emoji: '🌉', lat: 35.1457, lon: 129.1284 },
      { name: '海雲台海水浴場', emoji: '🏖️', lat: 35.1578, lon: 129.1581 },
      { name: '冬柏島', emoji: '🏛️', lat: 35.1524, lon: 129.1514, dx: 125, dy: 30 },
    ],
    deco: [['☁️', 0.3, 0.1, 34], ['☁️', 0.75, 0.15, 30], ['✨', 0.55, 0.25, 22], ['🌳', 0.1, 0.55], ['⛵', 0.5, 0.9], ['🐟', 0.85, 0.85, 22]],
  }],

  4: [{
    ...BASE,
    title: '🌈 Day 4 松島＆影島路線圖',
    offmap: [
      { ...HOME('出發・回飯店'), x: 0.66, y: 0.09, note: '▲ 往北約 8–9 公里' },
      { name: '西面晚餐（三選一）', emoji: '🥩', type: 'f', num: 6, x: 0.27, y: 0.2, note: '83 獬豸（優先）・味贊王西面店・明倫進士排骨' },
    ],
    pins: [
      {
        dir: 't', dy: -34, type: 's', items: [
          { name: '松島海上纜車', emoji: '🚡', num: 1, type: 's', lat: 35.0763, lon: 129.0235 },
          { name: '松島龍宮雲橋（可不排）', emoji: '🌉', num: 2, type: 's', lat: 35.0745, lon: 129.0183, est: true },
          { name: '海底貝殼王國（午餐）', emoji: '🦪', num: 3, type: 'f', lat: 35.0770, lon: 129.0228, est: true },
        ],
      },
      { name: '白淺灘文化村（下午茶）', emoji: '🌈', num: 5, type: 's', lat: 35.0778, lon: 129.0453, dir: 'b' },
      { name: 'ARTE MUSEUM', emoji: '🎨', num: 4, type: 's', lat: 35.0865, lon: 129.0759, dir: 'l' },
      {
        dir: 'r', dy: 14, type: 'f', items: [
          { name: '味贊王 富平店（可預約）', emoji: '🥩', num: 6, type: 'f', lat: 35.1010, lon: 129.0262, est: true },
          { name: '烤肉男子 南浦店（備案）', emoji: '🥩', num: 6, type: 'f', lat: 35.0983, lon: 129.0300, est: true },
        ],
      },
    ],
    landmarks: [
      { name: '釜山塔', emoji: '🗼', lat: 35.1013, lon: 129.0322 },
      { name: '影島大橋', emoji: '🌉', lat: 35.0956, lon: 129.0365, dx: 60, dy: 30 },
      { name: '太宗台', emoji: '🌲', lat: 35.0585, lon: 129.0877 },
      { name: '松島海水浴場', emoji: '🏖️', lat: 35.0755, lon: 129.0173, dy: 26 },
      { name: '國立海洋博物館', emoji: '🐋', lat: 35.0786, lon: 129.0803 },
      { name: '南港大橋', emoji: '🌉', lat: 35.0804, lon: 129.0328 },
      { name: '釜山港大橋', emoji: '🌉', lat: 35.1051, lon: 129.0640 },
    ],
    deco: [['☁️', 0.2, 0.2, 34], ['☁️', 0.8, 0.28, 30], ['✨', 0.45, 0.3, 22], ['⛵', 0.5, 0.78], ['🐟', 0.15, 0.85, 22], ['🌊', 0.8, 0.9, 24]],
  }],

  5: [{
    ...BASE,
    minX: 500, minY: 350,
    title: '🌈 Day 5 西面逛街',
    offmap: [{ name: '金海國際機場', emoji: '✈️', type: 't', num: 4, y: 0.76, note: '◀ 往西約 11 公里' }],
    pins: [
      { name: '西面站（出發・終點）', emoji: '🏨', num: '西', type: 'h', lat: 35.1573, lon: 129.0595, dir: 't' },
      { name: '早午餐・咖啡（西面）', emoji: '☕', num: 1, type: 'f', lat: 35.1568, lon: 129.0590, dir: 'r', est: true },
      { name: '西面地下街', emoji: '🛍️', num: 2, type: 'b', lat: 35.1555, lon: 129.0591, dir: 'b' },
      { name: '大創 西面店', emoji: '🧺', num: 2, type: 'b', lat: 35.1557, lon: 129.0615, dir: 'r' },
      { name: 'OLIVE YOUNG・ADER ERROR・Musinsa Standard・Butter shop', emoji: '👗', num: 2, type: 'b', lat: 35.1580, lon: 129.0608, dir: 't', est: true },
      { name: '松亭三代豬肉湯飯', emoji: '🍲', num: 3, type: 'f', lat: 35.1560, lon: 129.0572, dir: 'b', est: true },
    ],
    landmarks: [{ name: '樂天百貨', emoji: '🏬', lat: 35.1578, lon: 129.0566 }],
    deco: [['☁️', 0.35, 0.1, 34], ['☁️', 0.75, 0.15, 30], ['✨', 0.2, 0.3, 22], ['🌸', 0.15, 0.6, 24], ['🌳', 0.85, 0.8]],
  }],
};
