import waystonesJson from "../generated/waystones.json";
import type {
  MatchLang,
  WaystoneCatalog,
  WaystoneFamily,
  WaystoneTierId,
} from "./types.ts";

const waystoneCatalog = waystonesJson as WaystoneCatalog;

export type WaystoneStatId = "quantity" | "rarity" | "effectiveness";

export type WaystoneStatEffect = {
  text: string;
  numberSide: "before" | "after";
};

export type WaystoneStatAxis = {
  id: WaystoneStatId;
  labelZh: string;
  labelEn: string;
  /** Aggregate waystone item label (stash-searchable). */
  headerZh: string;
  headerEn: string;
  /** Affix reward fragments taken from frozen waystone effect text. */
  effectsZh: WaystoneStatEffect[];
  effectsEn: WaystoneStatEffect[];
};

/**
 * Player-facing waystone filters. Quantity has no affix reward line in the
 * scrape (it is the item header); rarity and effectiveness map to reward
 * lines on prefixes/suffixes. Pack size is the effectiveness analogue.
 */
export const WAYSTONE_STAT_AXES: WaystoneStatAxis[] = [
  {
    id: "quantity",
    labelZh: "物品數量",
    labelEn: "Item Quantity",
    headerZh: "物品數量",
    headerEn: "Item Quantity",
    effectsZh: [],
    effectsEn: [],
  },
  {
    id: "rarity",
    labelZh: "物品稀有度",
    labelEn: "Item Rarity",
    headerZh: "物品稀有度",
    headerEn: "Item Rarity",
    effectsZh: [{ text: "更多稀有度", numberSide: "before" }],
    effectsEn: [{ text: "more Rarity of Items", numberSide: "before" }],
  },
  {
    id: "effectiveness",
    labelZh: "怪物效用",
    labelEn: "Monster Effectiveness",
    headerZh: "怪物效用",
    headerEn: "Monster Effectiveness",
    // Regex uses 更多效用 / more Effectiveness. Pack size is the same
    // player axis in data (`map_pack_size`) but those fragments are long;
    // classification still counts them via waystoneStatHits.
    effectsZh: [{ text: "更多效用", numberSide: "before" }],
    effectsEn: [{ text: "more Effectiveness", numberSide: "before" }],
  },
];

const ROLL_PATTERNS: Record<
  Exclude<WaystoneStatId, "quantity">,
  { zh: RegExp; en: RegExp }
> = {
  rarity: {
    zh: /(\d+)%更多稀有度/g,
    en: /(\d+)% more Rarity of Items/g,
  },
  effectiveness: {
    zh: /(\d+)%更多(?:效用|怪物群大小)/g,
    en: /(\d+)% more (?:Effectiveness|Pack size)/g,
  },
};

export type WaystoneStatHit = {
  axis: Exclude<WaystoneStatId, "quantity">;
  id: string;
  family: string;
  tier: WaystoneTierId;
  value: number;
  lang: "zh" | "en";
  snippet: string;
};

/** Concatenate low/mid/top pools so the UI never asks for a tier. */
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

/** Rolls on affix reward lines that implement rarity / effectiveness. */
export function waystoneStatHits(
  axis: Exclude<WaystoneStatId, "quantity">,
): WaystoneStatHit[] {
  const patterns = ROLL_PATTERNS[axis];
  const hits: WaystoneStatHit[] = [];
  const seen = new Set<string>();
  for (const family of waystoneAllFamilies()) {
    for (const { lang, text } of textsOf(family)) {
      const re = lang === "zh" ? patterns.zh : patterns.en;
      re.lastIndex = 0;
      for (const match of text.matchAll(re)) {
        const value = Number(match[1]);
        if (!Number.isFinite(value)) continue;
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
  axis: Exclude<WaystoneStatId, "quantity">,
): { min: number; max: number } | undefined {
  const values = waystoneStatHits(axis).map((hit) => hit.value);
  if (values.length === 0) return undefined;
  return { min: Math.min(...values), max: Math.max(...values) };
}

export type WaystoneStatThresholdInput = {
  id: WaystoneStatId;
  min: number;
  header?: string;
  effects?: WaystoneStatEffect[];
};

/** Build regex inputs for the active min thresholds in one match language. */
export function waystoneStatThresholds(
  mins: Partial<Record<WaystoneStatId, number>>,
  lang: MatchLang,
): WaystoneStatThresholdInput[] {
  const out: WaystoneStatThresholdInput[] = [];
  for (const axis of WAYSTONE_STAT_AXES) {
    const min = mins[axis.id];
    if (min == null || !Number.isFinite(min) || min < 0) continue;
    out.push({
      id: axis.id,
      min,
      header: lang === "en" ? axis.headerEn : axis.headerZh,
      effects: lang === "en" ? axis.effectsEn : axis.effectsZh,
    });
  }
  return out;
}
