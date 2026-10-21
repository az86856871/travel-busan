# 釜山 4天3夜 行程網頁

輕鬆順路的釜山 4 天 3 夜行程，分成兩個航班版本，另有 5 天 4 夜（易斯達）版本，並附每日時間表與釜山 PASS 省錢計算。純 HTML，不需要安裝任何東西。

## 怎麼看

- 開啟 GitHub Pages 的網址，或直接用瀏覽器打開 `index.html`。
- 首頁可選擇航班版本，進入行程或每日時間表；內頁左上角有「← 回首頁」。
- 首頁下方「🎫 釜山 PASS」可進入省錢計算頁：勾選想去的景點（A 組在左、B 組在右），自動比較 24H／48H／BIG3／BIG5 與單買正價。

## 檔案說明

| 檔案 | 說明 |
|---|---|
| `index.html` | 入口頁，連到行程、時間表與 PASS 省錢計算 |
| `itinerary-hua.html` | 行程：中華航空版 |
| `itinerary-lcc.html` | 行程：廉價航空版 |
| `timetable.html` | 每日時間表（兩個版本合併，點選切換） |
| `timetable-hua.html` | 每日時間表：中華航空版 |
| `timetable-lcc.html` | 每日時間表：廉價航空版 |
| `itinerary-5d.html` | 行程：5 天 4 夜（易斯達版） |
| `timetable-5d.html` | 每日時間表：5 天 4 夜（易斯達版） |
| `pass-calculator.html` | 釜山 PASS 省錢計算（單人成人價，比較 24H／48H／BIG3／BIG5 與單買） |
| `md/VISIT_BUSAN_PASS_景點區域與價格.md` | PASS 景點（A、B 組）的區域與官網價格 |
| `timetable/day1-hua.md` … `day4-lcc.md` | 4 天 3 夜時間表的原始內容（Markdown） |
| `timetable/day1-5d.md` … `day5-5d.md` | 5 天 4 夜時間表的原始內容（Markdown） |
| `tools/build-timetable.js` | 把 md 轉成時間表網頁的腳本 |

## 更新時間表

時間表網頁是由 `timetable/` 裡的 md 檔轉出來的，**直接改 md 不會自動更新網頁**，需要重新產生 `timetable.html` 與 `timetable-hua.html`、`timetable-lcc.html`、`timetable-5d.html`。

需要先安裝 [Node.js](https://nodejs.org/)，在專案根目錄執行：

```
node tools/build-timetable.js
```

## 備註

- 行程與時間表的時間為推算值，營業時間與班次請出發前再確認。
- PASS 計算頁的景點價格取自 [VISIT BUSAN PASS 官網](https://www.visitbusanpass.com/attractions/)（查詢日 2026-10-21），官網可能調整，實際以官網及現場為準。景點價格寫在 `pass-calculator.html` 的 `DATA` 陣列，要更新價格改那裡。
