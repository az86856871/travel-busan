# 釜山 5 天 4 夜(易斯達版)Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 新增獨立的 5 天 4 夜(易斯達版)行程網頁與每日時間表,並從首頁連入,不改動現有 4 天 3 夜版本。

**Architecture:** 純靜態 HTML。時間表由 `timetable/day{1-5}-5d.md` 經 `tools/build-timetable.js` 轉成 `timetable-5d.html`;行程頁 `itinerary-5d.html` 由 `itinerary-lcc.html` 複製後改寫。設計見 `docs/plans/2026-10-19-busan-5d4n-design.md`。

**Tech Stack:** HTML/CSS/vanilla JS、Node.js(只用來跑 build 腳本)。

> 本專案**不是 git 倉庫**,所以計畫裡沒有 commit 步驟;改為在動手前備份會被改到的檔案(Task 0)。若之後 `git init`,每個 Task 結尾即為適合 commit 的點。

---

### Task 0: 備份與基準

**Files:**
- Create: `C:\Users\vicky.huang\workspaces\BUSAN\.backup\`(複製 `index.html`、`README.md`、`tools\build-timetable.js`、`timetable.html`、`timetable-hua.html`、`timetable-lcc.html`)

**Step 1:** 備份

```powershell
New-Item -ItemType Directory -Force .backup | Out-Null
Copy-Item index.html,README.md,tools\build-timetable.js,timetable.html,timetable-hua.html,timetable-lcc.html .backup\
```

**Step 2:** 確認 `.gitignore` 是否需要排除 `.backup`(只是提醒,現在沒有 git,可略過)。

---

### Task 1: 查證新景點與班次(內容品質關卡)

**Files:** 無(結果寫進 Task 3 的 `day4-5d.md`)

需用 WebSearch 查證,**不憑記憶寫**:
1. 松島海上纜車:營業時間、首班時間(要在 Day 4 12:00 前搭到)。
2. 影島:太宗台(交通、入園時間、遊覽列車、天氣封閉規則)、白淺灘文化村(交通、營業時間)。
3. 海底貝殼王國(松島)到影島的交通方式與時間。
4. 4/25(日)易斯達 PUS→TPE 實際班次是否為 22:10/22:00(使用者說「一樣」,仍以訂票頁為準,查不到就維持假設並標註)。

**Step 1:** 用 WebSearch(mode `standard`,不足再 `extended`)查上述四項。
**Step 2:** 把結果整理成每項「時間/交通/來源」三行,存到 scratchpad 暫存,Task 3 引用。查不到的一律標「待查證」。

---

### Task 2: 讓 build 腳本支援 5 天版

**Files:**
- Modify: `tools/build-timetable.js`

目前腳本把「4天3夜」、`[1,2,3,4]`、`d[1-4]` 寫死。改成可設定天數與標題,但**既有三個輸出頁內容不變**。

**Step 1:** 改 `VERSIONS` 與讀檔(約第 10–13、58–63 行)

```js
const VERSIONS = [
  { id: 'lcc', name: '廉價航空版', days: 4, label: '釜山 4天3夜' },
  { id: 'hua', name: '中華航空版', days: 4, label: '釜山 4天3夜' },
];
const V5 = { id: '5d', name: '易斯達版', days: 5, label: '釜山 5天4夜' };

for (const v of [...VERSIONS, V5]) {
  v.days = Array.from({ length: v.days }, (_, k) => k + 1).map(n => ({
    n,
    ...convert(fs.readFileSync(path.join(ROOT, 'timetable', `day${n}-${v.id}.md`), 'utf8')),
  }));
}
```

> 注意:`v.days` 原本是數字,被覆寫成陣列;`Array.from({length: v.days})` 在覆寫前執行,順序正確。

**Step 2:** `page()` 改用 `versions[0].label` 與實際天數(約第 133–148 行)

```js
const label = versions[0].label;
const count = versions[0].days.length;
const titleText = multi ? `${label} 每日時間表` : `${label} 每日時間表（${versions[0].name}）`;
const h1 = multi ? `${label}・每日時間表` : `${label}・每日時間表（${versions[0].name}）`;
// nav:
`${Array.from({ length: count }, (_, k) => k + 1).map(n => `<a href="#d${n}"${n === 1 ? ' class="on"' : ''}>Day ${n}</a>`).join('')}`
```

**Step 3:** 腳本 `SCRIPT` 內兩處 regex 由 `d[1-4]` 改 `d[1-9]`(約第 127 行)。

**Step 4:** 輸出部分加入第 5 天版

```js
write('timetable-5d.html', page({ versions: [V5], backHref: 'index.html' }));
```

**Step 5:** 驗證既有輸出沒壞(此時 `day*-5d.md` 還沒建,先建空殼讓腳本能跑,或在 Task 3 之後再跑此驗證)。

---

### Task 3: 撰寫五天時間表 md

**Files:** Create `timetable/day1-5d.md` … `day5-5d.md`,格式同現有(`# 標題`、`> 備註`、三欄表格、`## 注意事項`)。

**Day 1(`day1-5d.md`)**:複製 `day1-lcc.md`,標題改為「Day 1 時間表（易斯達版・抵達釜山・南浦洞）」,日期註明 4/21(三),其餘不動。

**Day 2(`day2-5d.md`)**:複製 `day2-lcc.md`,標題「Day 2 時間表（易斯達版・海雲台・Centum City）」,已建立,見 `timetable/day2-5d.md`。與 `day2-lcc.md` 的差別:15:00 先到 Centum City 看 Museum 1,再逛新世界、汗蒸幕(館內用餐,約 18:00–21:00)、The Bay 101,約 23:15 回西面。Day 3(`day3-5d.md`)沒有汗蒸幕,烤肉與西面逛街維持在遊艇之後;Day 4 晚餐自選。

**Day 3(`day3-5d.md`)**:複製 `day3-lcc.md`,標題「Day 3 時間表（易斯達版・機張・日落遊艇）」,日期 4/23(五)。注意事項裡「Day 4 的西面逛街挪到這裡」改成「西面逛街在 Day 5」。

**Day 4(`day4-5d.md`)** 新寫:標題「Day 4 時間表（易斯達版・松島與影島）」。備註:**Busan Pass 在 Day 4 12:00 到期,松島纜車必須在 12:00 前搭乘**。

| 時間 | 行程 | 備註 |
|---|---|---|
| 約 8:00 | 從西面出發 | 1 號線往南浦/松島方向,約 1 小時 |
| 9:00–10:30 | 松島海上纜車 | Pass 免費;營業時間見 Task 1 查證結果 |
| 10:30–11:15 | 松島龍宮雲橋 | 樓梯較多,可不安排 |
| 11:30–13:00 | 海底貝殼王國・釜山烤貝(午餐) | |
| 13:15–13:50 | 前往影島大橋(南浦洞側) | Uber |
| 14:00–14:15 | 影島大橋開橋 | 每週六;已查證,4 月場次待確認 |
| 14:30–17:00 | 白淺灘文化村與咖啡 | 太宗台不排 |
| 約 17:30 | 回西面 | |
| 18:30–20:00 | 晚餐(自選) | 烤肉在 Day 3;松亭三代豬肉湯飯留到 Day 5 |

**Day 5(`day5-5d.md`)** 新寫:標題「Day 5 時間表（易斯達版・西面・返程）」。備註:返程假設與 4/24 相同(易斯達 22:10 或 22:00,約 19:30 到機場、約 17:45 離開西面),班次待訂票確認。

| 時間 | 行程 | 備註 |
|---|---|---|
| 睡到自然醒 | 慢慢起床 | |
| 約 11:00 前 | 退房、行李寄放飯店 | 退房時間依飯店規定 |
| 11:30–13:00 | 西面早午餐・咖啡 | |
| 13:00–16:00 | 西面逛街 | Butter shop、大創、OLIVE YOUNG、ADER ERROR、Musinsa Standard、西面地下街 |
| 16:00–17:15 | 松亭三代豬肉湯飯(晚餐) | |
| 約 17:30 | 回飯店拿行李 | |
| 約 17:45 | 前往機場 | 約 19:30 到機場 |

**Step 驗證:**

```powershell
node tools\build-timetable.js
```
Expected:輸出 `wrote timetable.html`、`wrote timetable-hua.html`、`wrote timetable-lcc.html`、`wrote timetable-5d.html`,無錯誤。

---

### Task 4: 驗證時間表輸出

**Step 1:** 既有頁面沒被改壞

```powershell
foreach ($f in 'timetable.html','timetable-hua.html','timetable-lcc.html') {
  fc.exe /b ".backup\$f" $f | Select-Object -First 3
}
```
Expected:只有 JS regex 那一行(`d[1-4]`→`d[1-9]`)的差異。若有其他差異,回頭修 Task 2。

**Step 2:** 新頁面檢查

```powershell
Select-String -Path timetable-5d.html -Pattern '釜山 5天4夜','Day 5','data-d="d5"' | Measure-Object
```
Expected:三個關鍵字都找得到,且 `Day 4` 之後有 `Day 5` 分頁。用瀏覽器打開 `timetable-5d.html`,點 Day 1–5 切換、手機寬度確認表格不破版。

---

### Task 5: 建立 `itinerary-5d.html`

**Files:** Create `itinerary-5d.html`(複製 `itinerary-lcc.html` 後修改)

**Step 1:** `Copy-Item itinerary-lcc.html itinerary-5d.html`

**Step 2:** 逐項修改
- `<title>`、`.big` 標題:「釜山 5天4夜」,`.ver`:「易斯達版」。
- tagline 陣列最後一句改「5 天 4 夜,…」。
- facts:Pass 那格改為「Day 2 中午啟用,用到 Day 4 中午」(其實原文一致,保留即可);飯店那格不變。
- 航班區塊:移除台灣虎航按鈕與方案 3、移除 `.air` 篩選按鈕列;兩個易斯達方案保留,**回程日期改 4/25(日)**,**移除 `$10,709`、`$11,697` 價格**(那是 4/21–4/24 的票價,5 天版價格未知);保留去程 4/21 時間。加註「回程班次日期待訂票確認」。
- nav 加 `<a href="#d5">Day 5</a>`,結尾 script 的 `^d[1-4]$` 改 `^d[1-5]$`。
- **Day 1、Day 3**:原樣保留。
- **Day 2**:順序為 Museum 1 → 新世界逛街 → 汗蒸幕 → The Bay 101,晚餐不另排(汗蒸幕內用餐);route 同步調整。
- **Day 3**:遊艇保留二選一(方案 A Diamond Bay 18:30/19:30 場、方案 B Yacht Holic 下午場),之後接烤肉與西面逛街;沒有汗蒸幕。方案 B 的場次時間為假設,頁面上要標註「以預約頁面為準」。
- **Day 4**:晚上改在南浦:南浦洞逛街 → 晚餐 → 南浦洞夜逛 → 回西面;以 `timetable/day4-5d.md` 為準。
- **Day 4**:標題改「凌空纜車與影島海岸」;route 改:西面出發 ➔ 松島海上纜車 ➔ 松島龍宮雲橋 ➔ 海底貝殼王國(午餐) ➔ 影島(太宗台・白淺灘文化村) ➔ 回西面晚餐;刪除田浦咖啡街、松亭三代豬肉湯飯、西面逛街、快樂返程卡;新增影島兩張 `card`(內容依 Task 1 查證,查不到的標「待查證」,不寫營業時間)與一張晚餐 `eat` 卡。
- **Day 5**(新增 `<section class="day" id="d5">`,放在 Day 4 之後):

```html
<!-- Day 5 -->
<section class="day" id="d5">
  <div class="day-head"><span class="no">DAY 5</span>
    <h2>西面慢活與快樂返程</h2>
    <p class="teaser">最後一天不趕行程,睡到自然醒,在西面逛街、喝咖啡,帶著滿滿的戰利品回家。</p></div>
  <div class="route">慢慢起床 ➔ 退房寄放行李 ➔ 西面早午餐・咖啡 ➔ 西面逛街 ➔ <a href="https://maps.app.goo.gl/mkaGLdB2H6eVKb2h6" target="_blank" rel="noopener">松亭三代豬肉湯飯</a>(晚餐) ➔ 拿行李 ➔ 快樂返程</div>

  <div class="period">🌤️ 上午</div>
  <div class="card"><h3>慢慢起床・退房</h3><p>睡到自然醒,退房後把行李寄放在飯店,輕裝逛街。</p></div>
  <div class="card eat"><h3>西面早午餐・咖啡</h3><p>在西面挑一間喜歡的店吃早午餐、喝杯咖啡,為旅程留一段悠閒的尾聲。</p></div>

  <div class="period">🛍️ 下午</div>
  <div class="card"><h3>西面逛街</h3><p>輕鬆逛逛 <b>Butter shop</b>、<b>大創</b>、<b>OLIVE YOUNG</b> 藥妝、<b>ADER ERROR</b>、<b>Musinsa Standard</b> 服飾,也可以散步逛逛<b>西面地下街</b>。</p></div>

  <div class="period">🍜 晚餐與返程</div>
  <div class="card eat"><h3>松亭三代豬肉湯飯 <span class="tag metro">西面</span></h3><p>最後一餐來碗熱騰騰的豬肉湯飯,暖胃又滿足。<br><small>※ 航班約 22:00–22:10,晚餐在前往機場前先吃。</small></p></div>
  <div class="card"><h3>快樂返程</h3><p>回飯店拿行李,約 17:45 前往機場。期待下次再見,釜山!</p></div>
</section>
```

**Step 3:** 驗證

```powershell
Select-String -Path itinerary-5d.html -Pattern 'id="d5"','href="#d5"','d\[1-5\]','4/25','台灣虎航','\$10,709'
```
Expected:`d5`、`#d5`、`d[1-5]`、`4/25` 都找得到;`台灣虎航`、`$10,709` 找不到。瀏覽器開啟點 Day 1–5 檢查。

---

### Task 6: 首頁與 README

**Files:**
- Modify: `index.html`(在「📖 行程」`.pick` 區塊加一張 5 天版卡片;「🕐 每日時間表」加一張)
- Modify: `README.md`(檔案表新增 `itinerary-5d.html`、`timetable-5d.html`、`timetable/day*-5d.md`;標題下加一句說明還有 5 天 4 夜版本)

**Step 1:** `index.html` 行程區塊新增

```html
<a class="item" href="itinerary-5d.html"><b>易斯達 5天4夜版<i>行程</i></b><span>多一天更輕鬆:南浦洞、海雲台、機張雪蟹與日落遊艇、松島纜車與影島海岸,最後一天逛西面慢慢返程。</span></a>
```
時間表區塊新增

```html
<a class="item" href="timetable-5d.html"><b>5天4夜時間表<i>易斯達版</i></b><span>Day 1 到 Day 5 每日時間表。</span></a>
```

**Step 2:** `README.md` 更新後,`node tools/build-timetable.js` 指令說明加上「也會產生 `timetable-5d.html`」。

**Step 3:** 驗證:開 `index.html`,確認兩個新連結可點、其他四個舊連結仍正常。

---

### Task 7: 最終驗證(完成前必做)

- [ ] `node tools\build-timetable.js` 無錯誤
- [ ] Task 4 的 `fc` 比對只剩 regex 一行差異
- [ ] 五個頁面皆可打開:`index.html`、`itinerary-5d.html`、`timetable-5d.html`,以及原有的行程與時間表
- [ ] 手機寬度(約 375px)下 `timetable-5d.html` 與 `itinerary-5d.html` 不破版
- [ ] 所有「待查證」項目都已處理或在頁面上標註
- [ ] 刪除 `.backup\`(或交給使用者決定)
