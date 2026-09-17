# 流放之路 2 正則工具

依遊玩階段分成兩個模組。終局換界石與碑牌已填入編年史風格詞綴正則；開荒章節商店／流派仍為佔位，盾牌實驗頁可用。

## 本地執行

需要 Node 20+ 與 [pnpm](https://pnpm.io/)。

```bash
pnpm install
pnpm dev
```

瀏覽器開啟 <http://127.0.0.1:43127/> 。

```bash
pnpm test
pnpm build
```

更新凍結資料（poe2db.tw 公開 `ModsView`，另抓 `/us` 做 EN 匹配；RePoE 僅作 match 後備）：

```bash
pnpm fetch-data
```

寫入 `packages/data/generated/{shields,tags,meta,waystones,tablets}.json`。

## 資訊架構與路由

| 路徑 | 畫面 |
|---|---|
| `/` | 首頁：開荒／新手、終局兩張卡片 |
| `/early` | 開荒模組（導向章節地圖） |
| `/early/chapters` | 章節地圖（第一章…第五章佔位） |
| `/early/vendor` | 商店裝備篩選佔位；連到盾牌實驗 |
| `/early/builds` | 流派推薦裝備佔位 |
| `/early/shields` | 實驗：盾牌詞綴（編年史風格） |
| `/endgame` | 終局模組（導向換界石） |
| `/endgame/waystones` | **換界石** 低／中／高階詞綴正則 |
| `/endgame/tablets` | **碑牌** 先選種類再出詞綴正則 |
| `/campaign` | 別名，導向 `/early` |

頂部導覽：開荒／新手 \| 終局。

## 終局：換界石

`/endgame/waystones` 對齊：

- [低階](https://poe2db.tw/tw/Waystones_low_tier#ModifiersCalc)
- [中階](https://poe2db.tw/tw/Waystones_mid_tier#ModifiersCalc)
- [高階](https://poe2db.tw/tw/Waystones_top_tier#ModifiersCalc)

三個階級是獨立詞綴池（不是合併後再篩）。操作與盾牌實驗相同：標籤三態 → 前後綴兩欄 → 正則／250／複製。預設繁中匹配，可切 EN match。

凍結數量：

| 階級 | 詞綴組 | 階層 |
|---|---:|---:|
| 低階 | 32 | 34 |
| 中階 | 24 | 26 |
| 高階 | 25 | 27 |

低階略過 3 筆 poe2db `str` 空白、無法匹配的 raw 列。

## 終局：碑牌

`/endgame/tablets` **必須先選碑牌種類**。清單只載入該種類頁面的 `ModsView`，不會把八種碑牌聯集後假裝過濾。

| 種類 | 頁面 | 詞綴組 | 階層 |
|---|---|---:|---:|
| 裂痕碑牌 | [Breach_Tablet](https://poe2db.tw/tw/Breach_Tablet#ModifiersCalc) | 29 | 31 |
| 探險碑牌 | Expedition_Tablet | 35 | 37 |
| 譫妄碑牌 | Delirium_Tablet | 31 | 33 |
| 祭祀碑牌 | Ritual_Tablet | 31 | 33 |
| 輻照碑牌 | Irradiated_Tablet | 22 | 24 |
| 總督碑牌 | Overseer_Tablet | 30 | 32 |
| 深淵碑牌 | Abyss_Tablet | 31 | 33 |
| 神廟碑牌 | Temple_Tablet | 28 | 31 |

種類內可再用 harvest 標籤二次篩選。

## 實驗：盾牌詞綴

`/early/shields` 對齊 [編年史 ModifiersCalc](https://poe2db.tw/tw/Shields_str#ModifiersCalc)，僅力量塔盾／力敏／力智／輕盾。

1. 點標籤：第一次包含（紫）、第二次排除、第三次還原；多個包含為聯集。
2. 點詞綴列切換正則包含／排除；可填數值範圍。
3. 底部即時正則、長度／250、複製。預設繁中匹配。

## 部署

靜態站。GitHub Pages（專案站，`base` = `/poe2-regex/`）：

- 倉庫：https://github.com/chalo0518-ctrl/poe2-regex
- 網站：https://chalo0518-ctrl.github.io/poe2-regex/

`main` 推送後由 `.github/workflows/pages.yml` 建置 `apps/web/dist` 並部署。SPA 深連結靠 `404.html`（`index.html` 複本）。本地 `pnpm dev` 仍用 `base` `/`（`http://127.0.0.1:43127/`）；只有 `GITHUB_PAGES=true pnpm build` 才會切到 `/poe2-regex/`。

Vercel：Build `pnpm build`，Output `apps/web/dist`，Install `pnpm install`。`vercel.json` 已設 SPA rewrite。
