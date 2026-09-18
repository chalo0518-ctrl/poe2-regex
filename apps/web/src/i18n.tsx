import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UiLocale } from "@poe2-regex/data";

export type { UiLocale };

const STORAGE_KEY = "poe2-regex.locale";
export const LOCALES: UiLocale[] = ["zh-Hans", "zh-Hant", "en"];
export const DEFAULT_LOCALE: UiLocale = "zh-Hans";

export const LOCALE_LABEL: Record<UiLocale, string> = {
  "zh-Hans": "简中",
  "zh-Hant": "繁中",
  en: "EN",
};

export const HTML_LANG: Record<UiLocale, string> = {
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  en: "en",
};

type Messages = {
  brand: string;
  navAria: string;
  early: string;
  endgame: string;
  homeKicker: string;
  homeTitle: string;
  homeLead: string;
  homeEarlyBody: string;
  homeEndgameBody: string;
  subNavAria: string;
  earlyChapters: string;
  earlyVendor: string;
  earlyBuilds: string;
  earlyShields: string;
  endgameWaystones: string;
  endgameTablets: string;
  emptyLater: string;
  buildsTitle: string;
  buildsBody: string;
  chapterAria: string;
  chapterShopTitle: (label: string) => string;
  chapterShopDesc: string;
  chapterNoMaps: string;
  knownGaps: string;
  vendorTitle: string;
  vendorEditLink: string;
  shieldsTitle: string;
  shieldsDesc: string;
  shieldsImportHint: string;
  shieldsPoolAria: string;
  waystonesTitle: string;
  waystonesDesc: string;
  waystonesPoolAria: string;
  tabletsKindHeading: string;
  tabletsKindHint: string;
  tabletsKindAria: string;
  tabletsEmptyTitle: string;
  tabletsEmptyBody: string;
  tabletsTitle: (label: string) => string;
  tabletsDesc: string;
  statsFamilies: (families: number, tiers: number) => string;
  shopStats: (mods: number, defaults: number) => string;
  sourcePoe2db: (path: string) => string;
  sourceShop: string;
  prefixTitle: string;
  suffixTitle: string;
  shopPrefix: string;
  shopSuffix: string;
  filter: string;
  minIlvl: string;
  maxIlvl: string;
  importItem: string;
  importConfirm: string;
  toggleHidden: string;
  listed: (shown: number) => string;
  listedHidden: (n: number) => string;
  regexCounts: (includeN: number, excludeN: number) => string;
  tagHelp: string;
  matchZhHans: string;
  matchZhHant: string;
  matchEn: string;
  reset: string;
  copy: string;
  copied: string;
  copyFail: string;
  regexPlaceholder: string;
  include: string;
  exclude: string;
  min: string;
  max: string;
  commonRange: (min: number, max: number) => string;
  expandTiers: string;
  noAffixes: string;
  importTitle: string;
  importDefaultHint: string;
  cancel: string;
  warningMissing: string;
  warningOverLimit: (n: number) => string;
};

const zhHant: Messages = {
  brand: "流放之路 2 正則",
  navAria: "主模組",
  early: "開荒／新手",
  endgame: "終局",
  homeKicker: "PATH OF EXILE 2",
  homeTitle: "正則工具",
  homeLead: "依遊玩階段選擇模組。開荒依章節提供商店裝備預設正則；終局已填入換界石與碑牌詞綴正則。",
  homeEarlyBody:
    "章節地圖、商店裝備篩選（各章預設生命／移速／抗性）、流派推薦裝備。盾牌詞綴實驗頁暫放於此。",
  homeEndgameBody: "換界石（低／中／高階）與八種碑牌詞綴正則。碑牌必須先選種類。",
  subNavAria: "子頁面",
  earlyChapters: "章節地圖",
  earlyVendor: "商店裝備篩選",
  earlyBuilds: "流派推薦裝備",
  earlyShields: "實驗：盾牌詞綴",
  endgameWaystones: "換界石",
  endgameTablets: "碑牌",
  emptyLater: "內容稍後填入",
  buildsTitle: "流派推薦裝備",
  buildsBody: "主流開荒流派的裝備正則稍後填入。此頁暫不提供建議或預設。",
  chapterAria: "章節",
  chapterShopTitle: (label) => `${label}商店正則`,
  chapterShopDesc: "預設已勾選該章通用商店詞綴。點列可改為排除或取消；也可加選清單中的能力值／能量護盾／施法速度。",
  chapterNoMaps: "此章尚無獨立地圖／商店節點資料，預設套用整章商店裝備正則。",
  knownGaps: "已知缺口",
  vendorTitle: "商店裝備篩選",
  vendorEditLink: "在商店頁編輯此章正則",
  shieldsTitle: "盾牌詞綴正則",
  shieldsDesc: "對齊編年史 ModifiersCalc：標籤三態篩選、基礎前後綴兩欄。範圍僅限力量塔盾／力敏／力智／輕盾。",
  shieldsImportHint: "貼上倉庫複製的物品文字，將自動勾選目前盾種上對得上的基礎詞綴。",
  shieldsPoolAria: "盾種",
  waystonesTitle: "換界石詞綴正則",
  waystonesDesc: "對齊編年史換界石 ModifiersCalc。低階／中階／高階各為獨立詞綴池；點選詞綴後產生倉庫正則。",
  waystonesPoolAria: "換界石階級",
  tabletsKindHeading: "碑牌種類",
  tabletsKindHint: "請先選擇碑牌種類。詞綴清單只顯示該種類頁面上可骰出的詞綴，不會把八種碑牌混在一起再假裝篩選。",
  tabletsKindAria: "碑牌種類",
  tabletsEmptyTitle: "尚未選擇碑牌",
  tabletsEmptyBody: "選一種碑牌後才會載入該頁的前綴／後綴。裂痕碑牌不會看到探險專屬詞綴，以此類推。",
  tabletsTitle: (label) => `${label}詞綴正則`,
  tabletsDesc: "種類已鎖定目前碑牌。點選詞綴列以包含或排除，底部產生倉庫正則。",
  statsFamilies: (families, tiers) => `${families} 組詞綴 · ${tiers} 階`,
  shopStats: (mods, defaults) => `${mods} 組商店詞綴 · ${defaults} 項預設包含`,
  sourcePoe2db: (path) => `來源 poe2db.tw /tw /cn /us · ${path}`,
  sourceShop: "match／matchZh／matchZhHans 核對 shields.json 與 poe2db.tw 靴／飾品／護甲",
  prefixTitle: "基礎前綴",
  suffixTitle: "基礎後綴",
  shopPrefix: "商店前綴",
  shopSuffix: "商店後綴",
  filter: "Filter:",
  minIlvl: "Min iLvL:",
  maxIlvl: "Max iLvL:",
  importItem: "匯入物品",
  importConfirm: "匯入",
  toggleHidden: "切換隱藏",
  listed: (shown) => `顯示 ${shown} 列`,
  listedHidden: (n) => `（另顯示 ${n} 列隱藏）`,
  regexCounts: (includeN, excludeN) => `。正則包含 ${includeN} · 排除 ${excludeN}`,
  tagHelp: "。標籤：第一次包含（紫）· 第二次排除 · 第三次還原；多個包含為聯集。",
  matchZhHans: "简中匹配",
  matchZhHant: "繁中匹配",
  matchEn: "EN match",
  reset: "重置",
  copy: "複製",
  copied: "已複製",
  copyFail: "複製失敗，請手動選取",
  regexPlaceholder: "點選詞綴列以包含／排除，正則會顯示在這裡",
  include: "正則包含",
  exclude: "正則排除",
  min: "最小",
  max: "最大",
  commonRange: (min, max) => `常見 ${min}–${max}`,
  expandTiers: "展開階層",
  noAffixes: "沒有符合的詞綴",
  importTitle: "匯入物品",
  importDefaultHint: "貼上倉庫複製的物品文字，將自動勾選目前清單上對得上的基礎詞綴。",
  cancel: "取消",
  warningMissing: "部分詞綴缺少匹配文本，已跳過",
  warningOverLimit: (n) => `已超過 ${n} 字限制，請取消部分詞綴或放寬數值範圍`,
};

const zhHans: Messages = {
  ...zhHant,
  brand: "流亡 2 正则",
  navAria: "主模块",
  early: "开荒／新手",
  endgame: "终局",
  homeTitle: "正则工具",
  homeLead: "按游玩阶段选择模块。开荒按章节提供商店装备默认正则；终局已填入引路石与石板词缀正则。",
  homeEarlyBody: "章节地图、商店装备筛选（各章默认生命／移速／抗性）、流派推荐装备。盾牌词缀实验页暂放于此。",
  homeEndgameBody: "引路石（低／中／高阶）与八种石板词缀正则。石板必须先选种类。",
  subNavAria: "子页面",
  earlyChapters: "章节地图",
  earlyVendor: "商店装备筛选",
  earlyBuilds: "流派推荐装备",
  earlyShields: "实验：盾牌词缀",
  endgameWaystones: "引路石",
  endgameTablets: "石板",
  emptyLater: "内容稍后填入",
  buildsTitle: "流派推荐装备",
  buildsBody: "主流开荒流派的装备正则稍后填入。此页暂不提供建议或默认。",
  chapterAria: "章节",
  chapterShopTitle: (label) => `${label}商店正则`,
  chapterShopDesc: "默认已勾选该章通用商店词缀。点列可改为排除或取消；也可加选清单中的属性／能量护盾／施法速度。",
  chapterNoMaps: "此章尚无独立地图／商店节点数据，默认套用整章商店装备正则。",
  knownGaps: "已知缺口",
  vendorTitle: "商店装备筛选",
  vendorEditLink: "在商店页编辑此章正则",
  shieldsTitle: "盾牌词缀正则",
  shieldsDesc: "对齐编年史 ModifiersCalc：标签三态筛选、基础前后缀两栏。范围仅限力量塔盾／力敏／力智／轻盾。",
  shieldsImportHint: "贴上仓库复制的物品文字，将自动勾选当前盾种上对得上的基础词缀。",
  shieldsPoolAria: "盾种",
  waystonesTitle: "引路石词缀正则",
  waystonesDesc: "对齐编年史引路石 ModifiersCalc。低阶／中阶／高阶各为独立词缀池；点选词缀后产生仓库正则。",
  waystonesPoolAria: "引路石阶级",
  tabletsKindHeading: "石板种类",
  tabletsKindHint: "请先选择石板种类。词缀清单只显示该种类页面上可骰出的词缀，不会把八种石板混在一起再假装筛选。",
  tabletsKindAria: "石板种类",
  tabletsEmptyTitle: "尚未选择石板",
  tabletsEmptyBody: "选一种石板后才会载入该页的前缀／后缀。裂隙石板不会看到先祖秘藏专属词缀，以此类推。",
  tabletsTitle: (label) => `${label}词缀正则`,
  tabletsDesc: "种类已锁定当前石板。点选词缀列以包含或排除，底部产生仓库正则。",
  statsFamilies: (families, tiers) => `${families} 组词缀 · ${tiers} 阶`,
  shopStats: (mods, defaults) => `${mods} 组商店词缀 · ${defaults} 项默认包含`,
  sourcePoe2db: (path) => `来源 poe2db.tw /tw /cn /us · ${path}`,
  sourceShop: "match／matchZh／matchZhHans 核对 shields.json 与 poe2db.tw 靴／饰品／护甲",
  prefixTitle: "基础前缀",
  suffixTitle: "基础后缀",
  shopPrefix: "商店前缀",
  shopSuffix: "商店后缀",
  importItem: "导入物品",
  importConfirm: "导入",
  toggleHidden: "切换隐藏",
  listed: (shown) => `显示 ${shown} 列`,
  listedHidden: (n) => `（另显示 ${n} 列隐藏）`,
  regexCounts: (includeN, excludeN) => `。正则包含 ${includeN} · 排除 ${excludeN}`,
  tagHelp: "。标签：第一次包含（紫）· 第二次排除 · 第三次还原；多个包含为并集。",
  reset: "重置",
  copy: "复制",
  copied: "已复制",
  copyFail: "复制失败，请手动选取",
  regexPlaceholder: "点选词缀列以包含／排除，正则会显示在这里",
  include: "正则包含",
  exclude: "正则排除",
  min: "最小",
  max: "最大",
  commonRange: (min, max) => `常见 ${min}–${max}`,
  expandTiers: "展开阶层",
  noAffixes: "没有符合的词缀",
  importTitle: "导入物品",
  importDefaultHint: "贴上仓库复制的物品文字，将自动勾选当前清单上对得上的基础词缀。",
  cancel: "取消",
  warningMissing: "部分词缀缺少匹配文本，已跳过",
  warningOverLimit: (n) => `已超过 ${n} 字限制，请取消部分词缀或放宽数值范围`,
};

const en: Messages = {
  ...zhHant,
  brand: "PoE 2 Regex",
  navAria: "Main modules",
  early: "Campaign",
  endgame: "Endgame",
  homeTitle: "Regex tools",
  homeLead:
    "Pick a stage. Campaign chapters ship default shop regexes; endgame has waystone and tablet affix regexes.",
  homeEarlyBody:
    "Chapter maps, vendor gear filters (life / move speed / resists per act), and build presets. The shield lab lives here for now.",
  homeEndgameBody: "Waystones (low / mid / top) and eight tablet pools. Pick a tablet kind first.",
  subNavAria: "Subpages",
  earlyChapters: "Chapter maps",
  earlyVendor: "Vendor filter",
  earlyBuilds: "Build presets",
  earlyShields: "Lab: shield affixes",
  endgameWaystones: "Waystones",
  endgameTablets: "Tablets",
  emptyLater: "Coming later",
  buildsTitle: "Build presets",
  buildsBody: "Campaign build regexes are not filled in yet. This page does not invent presets.",
  chapterAria: "Chapters",
  chapterShopTitle: (label) => `${label} shop regex`,
  chapterShopDesc:
    "Default shop affixes for this act are pre-checked. Click a row to exclude or clear; attributes / ES / cast speed are optional.",
  chapterNoMaps: "This act has no per-map shop nodes yet, so the whole-act shop regex is used.",
  knownGaps: "Known gaps",
  vendorTitle: "Vendor filter",
  vendorEditLink: "Edit this act’s regex on the vendor page",
  shieldsTitle: "Shield affix regex",
  shieldsDesc:
    "Chronicles ModifiersCalc: three-state tags and prefix/suffix columns. Str / str-dex / str-int shields and bucklers only.",
  shieldsImportHint: "Paste clipboard item text to tick matching base affixes on this shield type.",
  shieldsPoolAria: "Shield base",
  waystonesTitle: "Waystone affix regex",
  waystonesDesc:
    "Chronicles waystone ModifiersCalc. Low / mid / top are independent pools; clicking an affix builds a stash regex.",
  waystonesPoolAria: "Waystone tier",
  tabletsKindHeading: "Tablet kind",
  tabletsKindHint:
    "Pick a tablet kind first. The list only shows mods from that page — it does not union all eight then fake-filter.",
  tabletsKindAria: "Tablet kind",
  tabletsEmptyTitle: "No tablet selected",
  tabletsEmptyBody: "Choose a kind to load that page’s prefixes/suffixes. Breach will not show Expedition-only mods.",
  tabletsTitle: (label) => `${label} affix regex`,
  tabletsDesc: "Kind is locked. Click rows to include or exclude; the stash regex appears at the bottom.",
  statsFamilies: (families, tiers) => `${families} families · ${tiers} tiers`,
  shopStats: (mods, defaults) => `${mods} shop mods · ${defaults} default includes`,
  sourcePoe2db: (path) => `Source poe2db.tw /tw /cn /us · ${path}`,
  sourceShop: "match / matchZh / matchZhHans checked against shields.json and poe2db boots/jewellery/armour",
  prefixTitle: "Prefixes",
  suffixTitle: "Suffixes",
  shopPrefix: "Shop prefixes",
  shopSuffix: "Shop suffixes",
  importItem: "Import item",
  importConfirm: "Import",
  toggleHidden: "Show hidden",
  listed: (shown) => `Showing ${shown} rows`,
  listedHidden: (n) => ` (plus ${n} hidden)`,
  regexCounts: (includeN, excludeN) => `. Include ${includeN} · exclude ${excludeN}`,
  tagHelp: ". Tags: first click include (purple) · second exclude · third clear; multiple includes OR.",
  reset: "Reset",
  copy: "Copy",
  copied: "Copied",
  copyFail: "Copy failed — select the text manually",
  regexPlaceholder: "Click affix rows to include/exclude; the regex shows up here",
  include: "Include",
  exclude: "Exclude",
  min: "Min",
  max: "Max",
  commonRange: (min, max) => `Typical ${min}–${max}`,
  expandTiers: "Expand tiers",
  noAffixes: "No matching affixes",
  importTitle: "Import item",
  importDefaultHint: "Paste clipboard item text to tick matching base affixes on the current list.",
  cancel: "Cancel",
  warningMissing: "Some affixes have no match text and were skipped",
  warningOverLimit: (n) => `Over the ${n}-character cap — drop affixes or loosen numeric bounds`,
};

export const MESSAGES: Record<UiLocale, Messages> = {
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  en,
};

function readStoredLocale(): UiLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "zh-Hans" || raw === "zh-Hant" || raw === "en") return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

type LocaleContextValue = {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  t: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: UiLocale;
}) {
  const [locale, setLocaleState] = useState<UiLocale>(initialLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    if (initialLocale) return;
    setLocaleState(readStoredLocale());
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, t: MESSAGES[locale] }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: MESSAGES[DEFAULT_LOCALE],
    };
  }
  return ctx;
}
