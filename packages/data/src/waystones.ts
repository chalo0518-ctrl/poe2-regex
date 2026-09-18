import waystonesJson from "../generated/waystones.json";
import type {
  MatchLang,
  WaystoneCatalog,
  WaystoneFamily,
  WaystoneTierId,
} from "./types.ts";

const waystoneCatalog = waystonesJson as WaystoneCatalog;

/**
 * Market Endgame Filters (trade2 `map_filters`), in screenshot grid order
 * (left, right per row). `quantity` is intentionally absent: it is not a
 * trade axis, and the frozen prefix/suffix scrape has no 物品數量 line.
 */
export type WaystoneRangeId =
  | "tier"
  | "packSize"
  | "effectiveness"
  | "itemRarity"
  | "monsterRarity"
  | "revives"
  | "dropChance"
  | "gold"
  | "experience";

export type WaystoneChoiceId = "ultimatum";
export type WaystoneStatId = WaystoneRangeId | WaystoneChoiceId;

export type WaystoneNumberStyle = "percent" | "bare";
export type WaystoneHeaderSide = "before" | "after";

export type WaystoneStatEffect = {
  text: string;
  numberSide: "before" | "after";
};

export type WaystoneChoiceOption = {
  id: string;
  labelZh: string;
  labelEn: string;
  matchZh: string;
  matchEn: string;
};

type RangeAxis = {
  id: WaystoneRangeId;
  kind: "range";
  /** Official trade2 map_filters id. */
  tradeId: string;
  labelZh: string;
  labelEn: string;
  numberStyle: WaystoneNumberStyle;
  /** Aggregate label on the item (stash-searchable), when known. */
  headerZh: string;
  headerEn: string;
  headerNumberSide?: WaystoneHeaderSide;
  /** `loose` = `.+` between number and header (unique-map gold). */
  headerGap?: "tight" | "loose";
  /** Affix reward fragments from frozen waystone effect text (or unique-map lines). */
  effectsZh: WaystoneStatEffect[];
  effectsEn: WaystoneStatEffect[];
};

type ChoiceAxis = {
  id: WaystoneChoiceId;
  kind: "choice";
  tradeId: string;
  labelZh: string;
  labelEn: string;
  options: WaystoneChoiceOption[];
};

export type WaystoneStatAxis = RangeAxis | ChoiceAxis;

export function isWaystoneRangeAxis(axis: WaystoneStatAxis): axis is RangeAxis {
  return axis.kind === "range";
}

/**
 * Ultimatum Trial Hint options from GET /api/trade2/data/filters
 * (`ultimatum_hint`). Not present in waystones.json prefix/suffix pools.
 * 繁中 names are the Fate items on poe2db.tw/tw/The_Trial_of_Chaos.
 */
export const WAYSTONE_ULTIMATUM_OPTIONS: WaystoneChoiceOption[] = [
  {
    id: "Victorious",
    labelZh: "勝利之運",
    labelEn: "Victorious",
    matchZh: "勝利之運",
    matchEn: "Victorious",
  },
  {
    id: "Cowardly",
    labelZh: "怯懦之運",
    labelEn: "Cowardly",
    matchZh: "怯懦之運",
    matchEn: "Cowardly",
  },
  {
    id: "Deadly",
    labelZh: "致命之運",
    labelEn: "Deadly",
    matchZh: "致命之運",
    matchEn: "Deadly",
  },
];

/**
 * Player-facing waystone filters matching the trade site ENDGAME FILTERS
 * panel. Regex prefers totals on the item (headers), not a single affix roll.
 */
export const WAYSTONE_STAT_AXES: WaystoneStatAxis[] = [
  {
    id: "tier",
    kind: "range",
    tradeId: "map_tier",
    labelZh: "換界石階級",
    labelEn: "Waystone Tier",
    numberStyle: "bare",
    headerZh: "階級",
    headerEn: "Tier",
    effectsZh: [],
    effectsEn: [],
  },
  {
    id: "packSize",
    kind: "range",
    tradeId: "map_packsize",
    labelZh: "換界石怪物群大小",
    labelEn: "Waystone Pack Size",
    numberStyle: "percent",
    headerZh: "怪物群大小",
    headerEn: "Pack Size",
    effectsZh: [{ text: "更多怪物群大小", numberSide: "before" }],
    effectsEn: [{ text: "more Pack size", numberSide: "before" }],
  },
  {
    id: "effectiveness",
    kind: "range",
    tradeId: "map_magic_monsters",
    labelZh: "怪物效用",
    labelEn: "Monster Effectiveness",
    numberStyle: "percent",
    headerZh: "怪物效用",
    headerEn: "Monster Effectiveness",
    effectsZh: [{ text: "更多效用", numberSide: "before" }],
    effectsEn: [{ text: "more Effectiveness", numberSide: "before" }],
  },
  {
    id: "itemRarity",
    kind: "range",
    tradeId: "map_iir",
    labelZh: "物品稀有度",
    labelEn: "Item Rarity",
    numberStyle: "percent",
    headerZh: "物品稀有度",
    headerEn: "Item Rarity",
    effectsZh: [{ text: "更多稀有度", numberSide: "before" }],
    effectsEn: [{ text: "more Rarity of Items", numberSide: "before" }],
  },
  {
    id: "monsterRarity",
    kind: "range",
    tradeId: "map_rare_monsters",
    labelZh: "怪物稀有度",
    labelEn: "Monster Rarity",
    numberStyle: "percent",
    headerZh: "怪物稀有度",
    headerEn: "Monster Rarity",
    effectsZh: [
      { text: "更多魔法和稀有怪物", numberSide: "before" },
      { text: "更多怪物詞綴機率", numberSide: "before" },
    ],
    effectsEn: [
      { text: "more Magic and Rare Monsters", numberSide: "before" },
      { text: "more chance of Monster Modifiers", numberSide: "before" },
    ],
  },
  {
    id: "revives",
    kind: "range",
    tradeId: "map_revives",
    labelZh: "換界石復活",
    labelEn: "Waystone Revives",
    numberStyle: "bare",
    headerZh: "可用的復活",
    headerEn: "Revives Available",
    effectsZh: [],
    effectsEn: [],
  },
  {
    id: "dropChance",
    kind: "range",
    tradeId: "map_bonus",
    labelZh: "換界石掉落率",
    labelEn: "Waystone Drop Chance",
    numberStyle: "percent",
    headerZh: "掉落率",
    headerEn: "Drop Chance",
    effectsZh: [{ text: "更多換界石", numberSide: "before" }],
    effectsEn: [{ text: "more Waystones found in Area", numberSide: "before" }],
  },
  {
    id: "gold",
    kind: "range",
    tradeId: "map_gold",
    labelZh: "換界石金幣",
    labelEn: "Waystone Gold",
    numberStyle: "percent",
    headerZh: "金幣的掉落",
    headerEn: "Gold found in this Area",
    headerNumberSide: "before",
    headerGap: "loose",
    effectsZh: [],
    effectsEn: [],
  },
  {
    id: "experience",
    kind: "range",
    tradeId: "map_experience",
    labelZh: "換界石經驗",
    labelEn: "Waystone Experience",
    numberStyle: "percent",
    headerZh: "經驗獲得",
    headerEn: "Experience gain",
    headerNumberSide: "before",
    headerGap: "tight",
    effectsZh: [],
    effectsEn: [],
  },
  {
    id: "ultimatum",
    kind: "choice",
    tradeId: "ultimatum_hint",
    labelZh: "混沌試煉",
    labelEn: "Ultimatum Trial",
    options: WAYSTONE_ULTIMATUM_OPTIONS,
  },
];

export const WAYSTONE_RANGE_AXES = WAYSTONE_STAT_AXES.filter(isWaystoneRangeAxis);

const ROLL_PATTERNS: Record<
  "itemRarity" | "effectiveness" | "packSize" | "monsterRarity" | "dropChance",
  { zh: RegExp; en: RegExp }
> = {
  itemRarity: {
    zh: /(\d+)%更多稀有度/g,
    en: /(\d+)% more Rarity of Items/g,
  },
  effectiveness: {
    zh: /(\d+)%更多效用/g,
    en: /(\d+)% more Effectiveness/g,
  },
  packSize: {
    zh: /(\d+)%更多怪物群大小/g,
    en: /(\d+)% more Pack size/g,
  },
  monsterRarity: {
    zh: /(\d+)%更多魔法和稀有怪物|稀有怪物有(\d+)%更多怪物詞綴機率|增加(\d+)%稀有怪物的數量/g,
    en: /(\d+)% more Magic and Rare Monsters|Rare Monsters have (\d+)% more chance of Monster Modifiers|(\d+)% increased number of Rare Monsters/g,
  },
  dropChance: {
    zh: /(\d+)%更多換界石|增加(\d+)%此區域找到的換界石/g,
    en: /(\d+)% more Waystones found in Area|(\d+)% increased Waystones found in Area/g,
  },
};

export type WaystoneAffixAxisId = keyof typeof ROLL_PATTERNS;

export type WaystoneStatHit = {
  axis: WaystoneAffixAxisId;
  id: string;
  family: string;
  tier: WaystoneTierId;
  value: number;
  lang: "zh" | "en";
  snippet: string;
};

/** Concatenate low/mid/top pools so the UI never asks for an affix-pool tier. */
export function waystoneAllFamilies(): WaystoneFamily[] {
  return waystoneCatalog.tiers.flatMap((tier) => waystoneCatalog.byTier[tier.id] ?? []);
}

function textsOf(family: WaystoneFamily): { lang: "zh" | "en"; text: string }[] {
  return [
    { lang: "zh", text: family.textZh },
    { lang: "en", text: family.textEn },
    ...family.tiers.flatMap((tier) => [
      { lang: "zh" as const, text: tier.textZh },
      { lang: "en" as const, text: tier.textEn },
    ]),
  ];
}

function firstNumericCapture(match: RegExpMatchArray): number | undefined {
  for (let i = 1; i < match.length; i++) {
    if (match[i] == null) continue;
    const value = Number(match[i]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

/** Rolls on affix reward lines that implement a market axis. */
export function waystoneStatHits(axis: WaystoneAffixAxisId): WaystoneStatHit[] {
  const patterns = ROLL_PATTERNS[axis];
  const hits: WaystoneStatHit[] = [];
  const seen = new Set<string>();
  for (const family of waystoneAllFamilies()) {
    for (const { lang, text } of textsOf(family)) {
      const re = lang === "zh" ? patterns.zh : patterns.en;
      re.lastIndex = 0;
      for (const match of text.matchAll(re)) {
        const value = firstNumericCapture(match);
        if (value == null) continue;
        const key = `${family.id}|${lang}|${value}|${match[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({
          axis,
          id: family.id,
          family: family.family,
          tier: family.tier,
          value,
          lang,
          snippet: match[0],
        });
      }
    }
  }
  return hits;
}

export function waystoneStatRange(
  axis: WaystoneAffixAxisId,
): { min: number; max: number } | undefined {
  const values = waystoneStatHits(axis).map((hit) => hit.value);
  if (values.length === 0) return undefined;
  return { min: Math.min(...values), max: Math.max(...values) };
}

export type WaystoneRangeBounds = {
  min?: number;
  max?: number;
};

export type WaystoneFilterInput = {
  ranges?: Partial<Record<WaystoneRangeId, WaystoneRangeBounds>>;
  ultimatum?: string;
};

export type WaystoneStatThresholdInput = {
  id: WaystoneStatId;
  min?: number;
  max?: number;
  header?: string;
  headerNumberSide?: WaystoneHeaderSide;
  headerGap?: "tight" | "loose";
  effects?: WaystoneStatEffect[];
  numberStyle?: WaystoneNumberStyle;
  flag?: string;
};

function finiteBound(n: number | undefined): number | undefined {
  if (n == null || !Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

/** Build regex inputs for filled min/max / dropdown values in one match language. */
export function waystoneStatThresholds(
  input: WaystoneFilterInput,
  lang: MatchLang,
): WaystoneStatThresholdInput[] {
  const out: WaystoneStatThresholdInput[] = [];
  for (const axis of WAYSTONE_STAT_AXES) {
    if (axis.kind === "choice") {
      const selected = input.ultimatum;
      if (!selected) continue;
      const option = axis.options.find((item) => item.id === selected);
      if (!option) continue;
      out.push({
        id: axis.id,
        flag: lang === "en" ? option.matchEn : option.matchZh,
      });
      continue;
    }

    const bounds = input.ranges?.[axis.id];
    const min = finiteBound(bounds?.min);
    const max = finiteBound(bounds?.max);
    if (min == null && max == null) continue;
    out.push({
      id: axis.id,
      min,
      max,
      header: lang === "en" ? axis.headerEn : axis.headerZh,
      headerNumberSide: axis.headerNumberSide,
      headerGap: axis.headerGap,
      // Totals-on-item only: affix fragments are classified in waystoneStatHits
      // but omitted from the stash string so many AND axes still fit in 250.
      effects: [],
      numberStyle: axis.numberStyle,
    });
  }
  return out;
}
