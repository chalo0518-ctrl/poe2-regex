# 流亡 2 / 流放之路 2 正則工具

按遊玩階段分成兩個模組。終局換界石依市集終局篩選（階級／效用／稀有度／掉落率／經驗／群大小／復活／金幣）產生倉庫正則；碑牌為編年史風格詞綴正則。開荒章節／商店已有各章預設裝備正則，流派仍為佔位，盾牌實驗頁可用。

界面預設 **繁中**，可切 **EN**。詞綴效果與匹配字串來自 poe2db `/tw` + `/us`。此倉庫不含簡中（zh-Hans）界面、匹配模式或 `/cn` 資料路徑；簡中會另開平行專案。

## 語言覆蓋

| 層 | 繁中 (zh-Hant) | English |
|---|---|---|
| 界面 chrome | 預設 | 可切換 |
| 詞綴效果 / 匹配 | poe2db `/tw` → `textZh` / `matchZh` | poe2db `/us` → `textEn` / `match` |
| 商店預設 | 既有 `/tw` 核對 | 既有 `/us` 核對 |
| 數值範圍正則 | `placement: before`（如 `+35%火焰抗性`） | `placement: before` |

不會編造簡中詞綴，也不會把繁中機器轉成簡中。

## 本地执行

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

更新凍結資料（poe2db.tw 公開 `ModsView`：`/tw` 繁中、`/us` EN；RePoE 僅作 EN match 後備）：

```bash
pnpm fetch-data
pnpm fetch-data:check
```

寫入 `packages/data/generated/{shields,tags,meta,waystones,tablets}.json`。完整來源、失敗碼、GitHub Actions 排程與 egress 說明見 [docs/data-update.md](docs/data-update.md)。CI 用 `pnpm fetch-data:fixtures`（精簡真實 HTML，不會覆寫正式 generated）。

排程：`.github/workflows/update-data.yml` 每週一嘗試 live scrape；若 GitHub runner 連不到 poe2db.tw（exit 2）會略過並請在可出站的機器上跑 `pnpm fetch-data`。不需要 repository secrets。


## 資訊架構與路由

| 路徑 | 畫面 |
|---|---|
| `/` | 首頁：開荒／新手、終局兩張卡片 |
| `/early` | 開荒模組（導向章節地圖） |
| `/early/chapters` | 章節商店預設正則（第一章…第五章；尚無獨立地圖節點） |
| `/early/vendor` | 商店裝備篩選，套用該章預設，可改是／或／否 |
| `/early/builds` | 流派推薦裝備佔位 |
| `/early/shields` | 實驗：盾牌詞綴（編年史風格） |
| `/endgame` | 終局模組（導向換界石） |
| `/endgame/waystones` | **換界石** 依市集終局篩選 Min/Max 產生正則 |
| `/endgame/tablets` | **碑牌** 先選種類再出詞綴正則 |
| `/campaign` | 別名，導向 `/early` |

頂部導覽：開荒／新手 \| 終局。

## 開荒：章節商店預設

`/early/chapters` 與 `/early/vendor` 共用 `packages/data` 的章節預設（資料驅動，不寫死在頁面元件裡）。清單詞綴的 `match` / `matchZh` 與現有正則引擎相同。

| 章節 | 預設包含 |
|---|---|
| 第一章 | 最大生命、移動速度 |
| 第二章 | ＋火／冰／電抗 |
| 第三章 | ＋全元素抗性 |
| 第四章 | ＋混沌抗性 |
| 第五章 | 同第四章（對應間章階段；非獨立地圖表） |

能力值、能量護盾、施法速度、生命回復、魔力在清單中可自行勾選，不列入通用預設。地圖／城鎮商店節點尚未建模，故沒有「每張地圖一組」正則。

## 終局：換界石

`/endgame/waystones` 不再切低／中／高階詞綴池。畫面對齊市集 **ENDGAME FILTERS**（trade2 `map_filters`）：每軸 Min/Max，空白則忽略。已填的軸以 AND 組合成倉庫正則，對**物品上的總數值**，預設繁中匹配，可切 EN match。

| 篩選 | 市集 id | 倉庫對照（繁中 / EN） | 編年史詞綴效果（waystones.json） |
|---|---|---|---|
| **換界石階級** | `map_tier` | `階級` / `Tier`（物品名 `換界石（階級 N）`） | 無。這是物品地圖階級 1–16，不是舊的低／中／高詞綴池 |
| **怪物效用** | `map_magic_monsters` | `怪物效用` / `Monster Effectiveness` | `更多效用` / `more Effectiveness` |
| **怪物稀有度** | `map_rare_monsters` | `怪物稀有度` / `Monster Rarity` | 詞綴行是 `更多魔法和稀有怪物`、`更多怪物詞綴機率`、`增加N%稀有怪物的數量`，**沒有**寫「怪物稀有度」四字；poe2db 詞條名為怪物稀有度 |
| **換界石掉落率** | `map_bonus` | `掉落率` / `Drop Chance` | `更多換界石` / `more Waystones found in Area`（幾乎每條前綴都有 10–25% 單條骰值；正則仍對總數值標頭） |
| **換界石經驗** | `map_experience` | `經驗獲得` / `Experience gain` | **前綴／後綴池沒有。** poe2db 換界石頁的獨特地圖有 `增加(200—400)%經驗獲得` |
| **換界石怪物群大小** | `map_packsize` | `怪物群大小` / `Pack Size` | `更多怪物群大小` / `more Pack size`（與效用分開） |
| **物品稀有度** | `map_iir` | `物品稀有度` / `Item Rarity` | `更多稀有度` / `more Rarity of Items` |
| **換界石復活** | `map_revives` | `可用的復活` / `Revives Available` | **不是骰出的詞綴**；詞綴數量會減少復活次數（poe2db「可用的復活」） |
| **換界石金幣** | `map_gold` | `金幣的掉落` / `Gold found in this Area` | **前綴／後綴池沒有。** 獨特地圖有 `增加(500—1000)%本區域中金幣的掉落量` |

**物品數量**沒有做成篩選：市集 `map_filters` 沒有此軸；凍結詞綴也沒有「物品數量／Quantity of Items found」效果行。0.5.0 起物品掉落數量是怪物效用的衍生加成。若要篩數量，請用怪物效用。

低／中／高階仍分別刮自 poe2db，僅供對詞綴效果分類，畫面不會再選。

凍結數量（資料來源，非畫面分頁）：

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

種類內每列用「是／或／否」取捨詞綴；「是」彼此 AND，「或」合成一組 OR 再與「是」AND，「否」走既有 `!` 排除。未選的列不寫入正則。

## 實驗：盾牌詞綴

`/early/shields` 對齊 [編年史 ModifiersCalc](https://poe2db.tw/tw/Shields_str#ModifiersCalc)，僅力量塔盾／力敏／力智／輕盾。

1. 點標籤：第一次包含（紫）、第二次排除、第三次還原；多個包含為聯集。
2. 每列右側選 **是**（AND 包含）／**或**（OR 包含）／**否**（排除）。未選＝不寫入。是項 AND，「或」項合成 `(或1|或2)` 再與是項 AND，排除項用既有 `!` 群組。
3. 底部即時正則、長度／250、複製。預設繁中匹配，可切 EN。

## 部署

靜態站。GitHub Pages（專案站，`base` = `/poe2-regex/`）：

- 倉庫：https://github.com/chalo0518-ctrl/poe2-regex
- 網站：https://chalo0518-ctrl.github.io/poe2-regex/

`main` 推送後由 `.github/workflows/pages.yml` 建置 `apps/web/dist` 並部署。SPA 深連結靠 `404.html`（`index.html` 複本）。本地 `pnpm dev` 仍用 `base` `/`（`http://127.0.0.1:43127/`）；只有 `GITHUB_PAGES=true pnpm build` 才會切到 `/poe2-regex/`。

Vercel：Build `pnpm build`，Output `apps/web/dist`，Install `pnpm install`。`vercel.json` 已設 SPA rewrite。
