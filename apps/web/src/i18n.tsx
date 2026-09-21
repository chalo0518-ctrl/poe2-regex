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
export const LOCALES: UiLocale[] = ["zh-Hant", "en"];
export const DEFAULT_LOCALE: UiLocale = "zh-Hant";

export const LOCALE_LABEL: Record<UiLocale, string> = {
  "zh-Hant": "繁中",
  en: "EN",
};

export const HTML_LANG: Record<UiLocale, string> = {
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
  earlyGear: string;
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
  earlyGearSlotHeading: string;
  earlyGearSlotHint: string;
  earlyGearSlotAria: string;
  earlyGearPoolAria: string;
  earlyGearTitle: (label: string) => string;
  earlyGearDesc: string;
  earlyGearImportHint: string;
  waystonesTitle: string;
  waystonesDesc: string;
  waystonesStatAria: string;
  waystonesThresholdHint: string;
  waystonesRegexPlaceholder: string;
  waystonesActive: (n: number) => string;
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
  regexCounts: (includeN: number, orN: number, excludeN: number) => string;
  tagHelp: string;
  matchZhHant: string;
  matchEn: string;
  reset: string;
  copy: string;
  copied: string;
  copyFail: string;
  regexPlaceholder: string;
  include: string;
  exclude: string;
  polarityYes: string;
  polarityOr: string;
  polarityNo: string;
  polarityGroup: string;
  polarityYesTitle: string;
  polarityOrTitle: string;
  polarityNoTitle: string;
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
    "章節地圖、商店裝備篩選（各章預設生命／移速／抗性）、流派推薦裝備。開荒裝備詞綴可切換胸甲／頭盔／手套／鞋子／飾品／單手錘／盾牌。",
  homeEndgameBody:
    "換界石依市集終局篩選（階級、效用、稀有度、掉落率、經驗、群大小、復活、金幣）產生正則，與八種碑牌詞綴正則。碑牌必須先選種類。",
  subNavAria: "子頁面",
  earlyChapters: "章節地圖",
  earlyVendor: "商店裝備篩選",
  earlyBuilds: "流派推薦裝備",
  earlyGear: "裝備詞綴",
  earlyShields: "實驗：盾牌詞綴",
  endgameWaystones: "換界石",
  endgameTablets: "碑牌",
  emptyLater: "內容稍後填入",
  buildsTitle: "流派推薦裝備",
  buildsBody: "主流開荒流派的裝備正則稍後填入。此頁暫不提供建議或預設。",
  chapterAria: "章節",
  chapterShopTitle: (label) => `${label}商店正則`,
  chapterShopDesc:
    "預設已勾選該章通用商店詞綴。每列右側選「是」AND 包含、「或」OR 包含、「否」排除；未選不寫入正則。是項彼此 AND，「或」項合成一組 OR 再與是項 AND。也可加選清單中的能力值／能量護盾／施法速度。",
  chapterNoMaps: "此章尚無獨立地圖／商店節點資料，預設套用整章商店裝備正則。",
  knownGaps: "已知缺口",
  vendorTitle: "商店裝備篩選",
  vendorEditLink: "在商店頁編輯此章正則",
  shieldsTitle: "盾牌詞綴正則",
  shieldsDesc:
    "對齊編年史 ModifiersCalc：標籤三態篩選、基礎前後綴兩欄。每列右側「是／或／否」決定是否寫入正則。範圍僅限力量塔盾／力敏／力智／輕盾。",
  shieldsImportHint: "貼上倉庫複製的物品文字，將自動勾選目前盾種上對得上的基礎詞綴。",
  shieldsPoolAria: "盾種",
  earlyGearSlotHeading: "裝備部位",
  earlyGearSlotHint:
    "選擇部位後載入該 poe2db 頁的前綴／後綴。胸甲／頭盔／手套／鞋子再選力量／敏捷／智慧基底；詞綴清單不會把不同基底混在一起。",
  earlyGearSlotAria: "裝備部位",
  earlyGearPoolAria: "基底",
  earlyGearTitle: (label) => `${label}詞綴正則`,
  earlyGearDesc:
    "每列右側「是／或／否」決定是否寫入正則。是項 AND，「或」項合成一組 OR 再與是項 AND，排除項用既有 ! 群組。章節推薦預設稍後填入。",
  earlyGearImportHint: "貼上倉庫複製的物品文字，將自動勾選目前部位與基底上對得上的基礎詞綴。",
  waystonesTitle: "換界石篩選正則",
  waystonesDesc:
    "對齊市集終局篩選：階級、怪物效用、怪物稀有度、掉落率、經驗、怪物群大小、物品稀有度、復活、金幣。空白則忽略該軸，不必選低階／中階／高階詞綴池。",
  waystonesStatAria: "換界石終局篩選",
  waystonesThresholdHint:
    "每項可填最小／最大（空白＝忽略）。已填的軸以 AND 組合，對換界石上的總數值（與市集相同）。",
  waystonesRegexPlaceholder: "填入數值後，正則會顯示在這裡",
  waystonesActive: (n) => (n === 0 ? "尚未設定篩選" : `已設定 ${n} 軸`),
  tabletsKindHeading: "碑牌種類",
  tabletsKindHint: "請先選擇碑牌種類。詞綴清單只顯示該種類頁面上可骰出的詞綴，不會把八種碑牌混在一起再假裝篩選。",
  tabletsKindAria: "碑牌種類",
  tabletsEmptyTitle: "尚未選擇碑牌",
  tabletsEmptyBody: "選一種碑牌後才會載入該頁的前綴／後綴。裂痕碑牌不會看到探險專屬詞綴，以此類推。",
  tabletsTitle: (label) => `${label}詞綴正則`,
  tabletsDesc: "種類已鎖定目前碑牌。每列右側選「是」AND 包含、「或」OR 包含、「否」排除；未選不寫入。底部以 AND 產生倉庫正則，「或」項先合成一組。",
  statsFamilies: (families, tiers) => `${families} 組詞綴 · ${tiers} 階`,
  shopStats: (mods, defaults) => `${mods} 組商店詞綴 · ${defaults} 項預設包含`,
  sourcePoe2db: (path) => `來源 poe2db.tw /tw /us · ${path}`,
  sourceShop: "match／matchZh 核對 shields.json 與 poe2db.tw 靴／飾品／護甲",
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
  regexCounts: (includeN, orN, excludeN) =>
    `。是 ${includeN} · 或 ${orN} · 否 ${excludeN}`,
  tagHelp: "。標籤：第一次包含（紫）· 第二次排除 · 第三次還原；多個包含為聯集。",
  matchZhHant: "繁中匹配",
  matchEn: "EN match",
  reset: "重置",
  copy: "複製",
  copied: "已複製",
  copyFail: "複製失敗，請手動選取",
  regexPlaceholder: "每列選「是」、「或」或「否」，正則會顯示在這裡",
  include: "正則包含",
  exclude: "正則排除",
  polarityYes: "是",
  polarityOr: "或",
  polarityNo: "否",
  polarityGroup: "詞條取捨",
  polarityYesTitle: "包含此詞條（AND）",
  polarityOrTitle: "包含此詞條（OR）",
  polarityNoTitle: "排除此詞條",
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
    "Chapter maps, vendor gear filters (life / move speed / resists per act), and build presets. Campaign affixes cover body / helm / gloves / boots / jewellery / one-hand maces / shields.",
  homeEndgameBody:
    "Waystones use the market endgame filters (tier, effectiveness, rarity, drop chance, experience, pack size, revives, gold) plus eight tablet pools. Pick a tablet kind first.",
  subNavAria: "Subpages",
  earlyChapters: "Chapter maps",
  earlyVendor: "Vendor filter",
  earlyBuilds: "Build presets",
  earlyGear: "Gear affixes",
  earlyShields: "Lab: shield affixes",
  endgameWaystones: "Waystones",
  endgameTablets: "Tablets",
  emptyLater: "Coming later",
  buildsTitle: "Build presets",
  buildsBody: "Campaign build regexes are not filled in yet. This page does not invent presets.",
  chapterAria: "Chapters",
  chapterShopTitle: (label) => `${label} shop regex`,
  chapterShopDesc:
    "Default shop affixes for this act are pre-checked. Use Yes (AND), Or (OR), or No (exclude) on each row; unselected rows are ignored. Yes fragments AND together; Or fragments become one OR group, then AND’d with Yes. Attributes / ES / cast speed stay optional.",
  chapterNoMaps: "This act has no per-map shop nodes yet, so the whole-act shop regex is used.",
  knownGaps: "Known gaps",
  vendorTitle: "Vendor filter",
  vendorEditLink: "Edit this act’s regex on the vendor page",
  shieldsTitle: "Shield affix regex",
  shieldsDesc:
    "Chronicles ModifiersCalc: three-state tags, prefix/suffix columns, and Yes / Or / No on each affix. Str / str-dex / str-int shields and bucklers only.",
  shieldsImportHint: "Paste clipboard item text to tick matching base affixes on this shield type.",
  shieldsPoolAria: "Shield base",
  earlyGearSlotHeading: "Item slot",
  earlyGearSlotHint:
    "Pick a slot to load that poe2db page’s prefixes/suffixes. Body / helm / gloves / boots also pick a str/dex/int base — lists are not unioned across bases.",
  earlyGearSlotAria: "Item slot",
  earlyGearPoolAria: "Base type",
  earlyGearTitle: (label) => `${label} affix regex`,
  earlyGearDesc:
    "Use Yes (AND), Or (OR), or No (exclude) on each row. Or fragments become one OR group, then AND’d with Yes. Chapter recommended presets come later.",
  earlyGearImportHint: "Paste clipboard item text to tick matching base affixes on this slot and base.",
  waystonesTitle: "Waystone filter regex",
  waystonesDesc:
    "Market endgame filters: tier, monster effectiveness, monster rarity, drop chance, experience, pack size, item rarity, revives, and gold. Empty = ignore. No low/mid/top affix-pool picker.",
  waystonesStatAria: "Waystone endgame filters",
  waystonesThresholdHint:
    "Each row is min/max (leave empty to ignore). Filled axes AND together and match totals on the waystone, like trade.",
  waystonesRegexPlaceholder: "Enter a min/max value and the regex shows up here",
  waystonesActive: (n) => (n === 0 ? "No filters set" : `${n} filter${n === 1 ? "" : "s"} set`),
  tabletsKindHeading: "Tablet kind",
  tabletsKindHint:
    "Pick a tablet kind first. The list only shows mods from that page — it does not union all eight then fake-filter.",
  tabletsKindAria: "Tablet kind",
  tabletsEmptyTitle: "No tablet selected",
  tabletsEmptyBody: "Choose a kind to load that page’s prefixes/suffixes. Breach will not show Expedition-only mods.",
  tabletsTitle: (label) => `${label} affix regex`,
  tabletsDesc:
    "Kind is locked. Use Yes (AND), Or (OR), or No (exclude) on each row; unselected rows are ignored. Or fragments become one OR group, then AND’d with Yes.",
  statsFamilies: (families, tiers) => `${families} families · ${tiers} tiers`,
  shopStats: (mods, defaults) => `${mods} shop mods · ${defaults} default includes`,
  sourcePoe2db: (path) => `Source poe2db.tw /tw /us · ${path}`,
  sourceShop: "match / matchZh checked against shields.json and poe2db boots/jewellery/armour",
  prefixTitle: "Prefixes",
  suffixTitle: "Suffixes",
  shopPrefix: "Shop prefixes",
  shopSuffix: "Shop suffixes",
  importItem: "Import item",
  importConfirm: "Import",
  toggleHidden: "Show hidden",
  listed: (shown) => `Showing ${shown} rows`,
  listedHidden: (n) => ` (plus ${n} hidden)`,
  regexCounts: (includeN, orN, excludeN) =>
    `. Yes ${includeN} · Or ${orN} · No ${excludeN}`,
  tagHelp: ". Tags: first click include (purple) · second exclude · third clear; multiple includes OR.",
  reset: "Reset",
  copy: "Copy",
  copied: "Copied",
  copyFail: "Copy failed — select the text manually",
  regexPlaceholder: "Choose Yes, Or, or No on a row; the regex shows up here",
  include: "Include",
  exclude: "Exclude",
  polarityYes: "Yes",
  polarityOr: "Or",
  polarityNo: "No",
  polarityGroup: "Affix include",
  polarityYesTitle: "Include this affix (AND)",
  polarityOrTitle: "Include this affix (OR)",
  polarityNoTitle: "Exclude this affix",
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
  "zh-Hant": zhHant,
  en,
};

function readStoredLocale(): UiLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "zh-Hant" || raw === "en") return raw;
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
