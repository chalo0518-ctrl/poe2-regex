# 流亡 2 / 流放之路 2 正則工具

按遊玩階段分成兩個模組。終局換界石依市集終局篩選（階級／效用／稀有度／掉落率／經驗／群大小／復活／金幣）產生倉庫正則；碑牌為編年史風格詞綴正則。開荒章節／商店已有各章預設裝備正則，流派仍為佔位；開荒裝備詞綴可切胸甲／頭盔／手套／鞋子／飾品／單手錘／盾牌。

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

寫入 `packages/data/generated/{shields,tags,meta,waystones,tablets,early-gear}.json`。完整來源、失敗碼、GitHub Actions 排程與 egress 說明見 [docs/data-update.md](docs/data-update.md)。CI 用 `pnpm fetch-data:fixtures`（精簡真實 HTML，不會覆寫正式 generated）。

排程：`.github/workflows/update-data.yml` 每週一嘗試 live scrape；若 GitHub runner 連不到 poe2db.tw（exit 2）會略過並請在可出站的機器上跑 `pnpm fetch-data`。不需要 repository secrets。


## 資訊架構與路由

| 路徑 | 畫面 |
|---|---|
| `/` | 首頁：開荒／新手、終局兩張卡片 |
| `/early` | 開荒模組（導向章節地圖） |
| `/early/chapters` | 章節商店預設正則（第一章…第五章；尚無獨立地圖節點） |
| `/early/vendor` | 商店裝備篩選，套用該章預設，可改是／或／否 |
| `/early/builds` | 流派推薦裝備佔位 |
| `/early/gear` | 開荒裝備詞綴：胸甲／頭盔／手套／鞋子／戒指／項鍊／腰帶／單手錘／盾牌 |
| `/early/shields` | 別名，導向 `/early/gear?slot=shield` |
| `/endgame` | 終局模組（導向換界石） |
| `/endgame/waystones` | **換界石** 依市集終局篩選 Min/Max 產生正則 |
| `/endgame/tablets` | **碑牌** 先選種類再出詞綴正則 |
| `/endgame/crafting` | **做裝** 選部位與目標詞綴，走決策樹，並依目前詞綴判定繼續／換底／降目標 |
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

`/endgame/waystones` 不再切低／中／高階詞綴池。畫面對齊市集 **ENDGAME FILTERS**（trade2 `map_filters`）：每軸 Min/Max，空白則忽略。已填的軸以 AND 組合成倉庫正則，對**物品上的總數值**，預設繁中匹配，可切 EN match。沒有可點的詞綴清單，也沒有危險標籤當主模型。

底部固定正則列一直看得到：即時正則、長度／250、複製、重置。已填的軸做成芯片，可單軸清除，或按「清空全部」。

「優化長度」預設關閉，關閉時數字寫法與精確下限相同。開啟後：

1. 先把代表「剛好一位數字」的 `\d` 寫成 `.`（少一個字元）。整數下限不變；`.` 也可能吃到非數字。
2. 若整段仍超過 250 字，才下修下限：三位數收到上一個整百，其餘收到上一個整十，然後停住，不會把下限收成「任意數字」。下修的軸標成 **優化**，並寫出 `輸入值→實際下限`，因為那會匹配低於你填的最小值。沒標優化的軸下限仍是你填的值。仍超過 250 字時，沿用原本的超長警告。

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

種類內每列用 **Y／O／N** 取捨詞綴（Y＝AND 包含，O＝OR 一組，N＝排除）。語意與開荒裝備的「是／或／否」相同，只是碑牌頁改成這三個字母。未選的列不寫入正則。點詞綴文字會選 Y，N 與 O 仍是列上的按鈕。清單上方可搜尋目前種類的詞綴（簡體查詢會折成繁體再比）。常見 min–max 直接顯示在列上；展開才看完整階層與每條 min／max。底部固定正則列有即時正則、長度／250、複製、重置、已選芯片（標 Y／O／N），以及「清空全部條件」。已選／排除筆數釘在這列旁邊。

## 終局：做裝

`/endgame/crafting` 幫你排做裝步驟，並依目前詞綴建議 **繼續**、**換底** 或 **降目標**。部位是一個下拉選單，分成防具（胸甲／頭盔／手套／鞋子／盾牌）、飾品（戒指／項鍊／腰帶）、武器（爪、匕首、單手劍、單手斧、單手錘、權杖、法杖、弓、十字弓、長杖、雙手劍、雙手斧、雙手錘、長矛、細杖、鏈錘、陷阱），不拆力量／敏捷／智慧。網址 `?slot=` 跟選單同步。`/early/gear` 的部位清單不變。目標在詞綴列勾選，並可選階級（階級決定物品等級檢查與倉庫正則的數字下限）。不能同時存在的依據是 poe2db `ModFamilyList` 的第一個家族名（`AffixFamily.family`）；預設前綴、後綴各最多 3 條，插槽增幅可以再提高後綴上限。破潰石鎖定在詞綴列標出，一次一條，標了就算已選目標並留在這件上。倉庫正則只是附帶。

上限寫在 `packages/data` 的 `CRAFTING_RULESET`（每件 1 條工藝詞綴、1 條褻瀆詞綴）。精髓與合金搶同一個工藝槽。重組器不在主路線（僅標準聯盟）。桌面版分成左右兩欄。左欄由上到下是增幅、詞綴分頁（目標詞綴／已有詞條）、「這件裝備」。分頁一次只顯示一邊。目標詞綴與已有詞條用同一套詞綴框、前綴／後綴捲動與互斥下沉。已有詞條勾的是這件已經有的詞綴，仍送進原本的決策。切換分頁不會清掉勾選、增幅或決策。右欄是決策樹：根在上，分支往下疊，不是左右展開的圖。金色標出這件目前該走的路。點任一節點，該步的做法與停手提醒開在那個節點下面。窄螢幕改成上下排列。長文說明仍對應：選底 → 升稀有 → 填邊 → 褻瀆 → 破裂／清理 → 收尾（品質、催化劑、插槽，瓦爾最後）。

非目標詞綴由工具依 poe2db 階級需求等級（`tier.level`，不是畫面上的 T 序）分成可削切或等級不低於目標。移除預兆依 poe2db：削切之兆加混沌石移除最低等級詞綴；左旋／右旋廢止之兆加無效石只移除前綴或後綴（抺除之兆改用混沌石，範圍相同）；光明之兆加無效石只移除褻瀆詞綴。大幅廢止之兆會一次移除兩條，有目標在場就不建議。poe2db 沒有黑暗廢止這張預兆。

詞綴清單前面有增幅插槽，預設兩孔，可以再加一孔。只列出會改詞綴數量或額外開放詞綴池的增幅（poe2db 物品頁）：瑟雷的凱旋讓後綴上限 +1；阿斯垂德的創造多 1 條工藝詞綴。索魯德的強權、沃拉娜的殘殺、烏特雷的星空、梅德偉的照料、克洛爾的狩獵、卡特拉的愁悵不混進一般詞綴清單。預設詞綴包在「預設詞綴」框裡，前綴與後綴各自捲動約四列。選了會開詞綴池的增幅時，框下面再加一框，標題是增幅名稱加「額外詞綴」，同樣分前綴與後綴、各自捲動。取消該增幅時，這一框和已勾的列一起消失。褻瀆詞綴（poe2db `desecrated`）另成一框，不跟預設或靈魂池混在一起。每一段裡還能勾的列在上，互斥或已滿而變暗的列沉到該段捲動區底部。孔數高過該部位一般上限時，決策會把多出來的增幅槽算進去，傾向留下這件，畫面上不另標旗標。點決策樹的任一節點會展開該步的做法與停手提醒。

褻瀆迴圈：目標側維持恰好 2 條，且 1 條是要留的破裂。揭示失敗時，優先用打得到該側的精髓或合金頂掉非破裂那格，再重新褻瀆，少花光明之兆。目標側已是 3 條，或工藝槽已是永久保留時，迴圈中斷，判定改為換底，或改用光明之兆清一輪。Absent／Portent 項鍊與 Dusk 戒指只是常見例子，不是每種基底都一樣。預算只作提醒，不估價格。

## 開荒：裝備詞綴

`/early/gear` 對齊編年史 ModifiersCalc。**只選部位**（胸甲／頭盔／手套／鞋子／戒指／項鍊／腰帶／單手錘／盾牌）；每個部位一份合併詞綴清單，畫面不會再出現力量塔盾／力敏／str／dex 等基底分頁。標籤仍可作次要篩選。每列右側選 **是**（AND）／**或**（OR）／**否**（排除）。未選＝不寫入。底部即時正則、長度／250、複製。預設繁中匹配，可切 EN。

| 部位 | poe2db 頁（`/tw` + `/us` `#ModifiersCalc`） |
|---|---|
| 胸甲 | [Body_Armours_str](https://poe2db.tw/tw/Body_Armours_str#ModifiersCalc)、`Body_Armours_dex`、`Body_Armours_int`、`Body_Armours_str_dex`、`Body_Armours_str_int`、`Body_Armours_dex_int` |
| 頭盔 | `Helmets_str`、`Helmets_dex`、`Helmets_int`、`Helmets_str_dex`、`Helmets_str_int`、`Helmets_dex_int` |
| 手套 | `Gloves_str`、`Gloves_dex`、`Gloves_int`、`Gloves_str_dex`、`Gloves_str_int`、`Gloves_dex_int` |
| 鞋子 | `Boots_str`、`Boots_dex`、`Boots_int`、`Boots_str_dex`、`Boots_str_int`、`Boots_dex_int` |
| 戒指 | [Rings](https://poe2db.tw/tw/Rings#ModifiersCalc) |
| 項鍊 | [Amulets](https://poe2db.tw/tw/Amulets#ModifiersCalc) |
| 腰帶 | [Belts](https://poe2db.tw/tw/Belts#ModifiersCalc) |
| 單手錘 | [One_Hand_Maces](https://poe2db.tw/tw/One_Hand_Maces#ModifiersCalc) |
| 盾牌 | 既有 [Shields_str](https://poe2db.tw/tw/Shields_str#ModifiersCalc)／`Shields_str_dex`／`Shields_str_int`／[Bucklers](https://poe2db.tw/tw/Bucklers#ModifiersCalc)（`shields.json`） |

法杖（Wands）未列入：poe2db 家族會把不同傷害類型混成一組，match 字串不可靠。章節推薦預設（task 2）尚未填入。

1. 點標籤：第一次包含（紫）、第二次排除、第三次還原；多個包含為聯集。
2. 每列右側選 **是**（AND 包含）／**或**（OR 包含）／**否**（排除）。未選＝不寫入。是項 AND，「或」項合成 `(或1|或2)` 再與是項 AND，排除項用既有 `!` 群組。
3. 底部即時正則、長度／250、複製。預設繁中匹配，可切 EN。

## 部署

靜態站。GitHub Pages（專案站）。正式站 `base` 是 `/poe2-regex/`。

- 倉庫：https://github.com/chalo0518-ctrl/poe2-regex
- 正式站 / Production：https://chalo0518-ctrl.github.io/poe2-regex/

`main` 推送後由 `.github/workflows/pages.yml` 建置 `apps/web/dist` 並部署。SPA 深連結靠 `404.html`（`index.html` 複本）。本地 `pnpm dev` 仍用 `base` `/`（`http://127.0.0.1:43127/`）。`GITHUB_PAGES=true pnpm build` 使用 `/poe2-regex/`。若設定 `PAGES_BASE`（絕對路徑），會覆寫上述 base；正式站工作流程不會設定它。

### PR 預覽 / Pull request previews

同一個倉庫的 pull request（fork 除外）每次推送會建置預覽，並在 PR 留言更新網址：

`https://chalo0518-ctrl.github.io/poe2-regex/pr-preview/pr-<編號>/`

做裝頁（例如 PR 13）：

`https://chalo0518-ctrl.github.io/poe2-regex/pr-preview/pr-13/endgame/crafting`

預覽的 Vite `base` 是 `/poe2-regex/pr-preview/pr-<編號>/`，靜態資源才載得起來。正式站維持 `/poe2-regex/`。PR 關閉後預覽目錄會刪掉，留言改為已移除。

GitHub Pages 只認網站根目錄的 `404.html`。直接打開預覽子路由時，正式站的 `404.html` 會轉到該 PR 的 `index.html?spa=...`，再把網址還原。Production keeps `/poe2-regex/`. A preview never publishes its assets onto that path.

`.github/workflows/preview-build.yml` 在 PR 上建置。`.github/workflows/preview-deploy.yml` 在 `main` 上把預覽放進同一個 Pages 站並留言。`pages-site` 分支只記住目前站台檔案（含 `pr-preview/`），正式部署不會把預覽清掉。Pages 來源仍是 GitHub Actions，不必改成從分支部署。

Vercel：Build `pnpm build`，Output `apps/web/dist`，Install `pnpm install`。`vercel.json` 已設 SPA rewrite。
