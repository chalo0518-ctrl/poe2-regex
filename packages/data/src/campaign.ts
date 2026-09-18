import type { AffixFamily } from "./types.ts";
import type {
  CampaignChapter,
  ChapterId,
  ChapterShopPick,
  ShopMod,
  ShopPickState,
} from "./types.ts";

/**
 * Gaps we are not filling with guessed mods or invented map lists.
 * Keep this in sync with the PR notes.
 */
export const CAMPAIGN_GAPS = [
  "章節地圖／城鎮商店節點尚未進資料模型，預設正則以章為單位，不是每張地圖一組。",
  "武器 DPS、攻擊附加傷害、技能等級等詞綴未列入：poe2db 家族會把不同技能／傷害類型混成一組，match 字串不可靠。",
  "商店詞綴池是從盾牌凍結資料＋poe2db 靴／飾品／護甲核對過的通用生存／移動組合，不是完整裝備詞綴表。",
  "未套用章節數值下限：商人任意一階生命／抗性都值得高亮，亂填 min 會漏掉低階裝備。",
];

const SHOP_FAMILY_PREFIX = "shop:";

export function shopFamilyId(modId: string): string {
  return `${SHOP_FAMILY_PREFIX}${modId}`;
}

const SHOP_MODS: ShopMod[] = [
  {
    id: "life",
    family: "IncreasedLife",
    generation: "prefix",
    labelZh: "最大生命",
    labelEn: "maximum Life",
    textZh: "+(10—19)最大生命",
    textEn: "+(10—19) to maximum Life",
    match: "to maximum Life",
    matchZh: "最大生命",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 10, suggestedMax: 214 },
    tags: ["life"],
    tagsZh: ["生命"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Boots_str", "poe2db.tw/tw/Rings"],
  },
  {
    id: "mana",
    family: "IncreasedMana",
    generation: "prefix",
    labelZh: "最大魔力",
    labelEn: "maximum Mana",
    textZh: "+(10—14)最大魔力",
    textEn: "+(10—14) to maximum Mana",
    match: "to maximum Mana",
    matchZh: "最大魔力",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 10, suggestedMax: 14 },
    tags: ["mana"],
    tagsZh: ["魔力"],
    sources: ["poe2db.tw/tw/Rings", "poe2db.tw/tw/Helmets_str"],
  },
  {
    id: "energy_shield",
    family: "IncreasedEnergyShield",
    generation: "prefix",
    labelZh: "最大能量護盾",
    labelEn: "maximum Energy Shield",
    textZh: "+(8—14)最大能量護盾",
    textEn: "+(8—14) to maximum Energy Shield",
    match: "to maximum Energy Shield",
    matchZh: "最大能量護盾",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 8, suggestedMax: 17 },
    tags: ["energy_shield"],
    tagsZh: ["能量護盾"],
    sources: ["poe2db.tw/tw/Amulets", "poe2db.tw/tw/Body_Armours_int"],
  },
  {
    id: "movement_speed",
    family: "MovementVelocity",
    generation: "prefix",
    labelZh: "移動速度",
    labelEn: "Movement Speed",
    textZh: "增加10%移動速度",
    textEn: "10% increased Movement Speed",
    match: "increased Movement Speed",
    matchZh: "移動速度",
    kind: "numeric",
    numeric: { format: "percentPrefix", suggestedMin: 10, suggestedMax: 35 },
    tags: ["speed"],
    tagsZh: ["速度"],
    sources: ["poe2db.tw/tw/Boots_str"],
  },
  {
    id: "fire_res",
    family: "FireResistance",
    generation: "suffix",
    labelZh: "火焰抗性",
    labelEn: "Fire Resistance",
    textZh: "+(6—10)%火焰抗性",
    textEn: "+(6—10)% to Fire Resistance",
    match: "to Fire Resistance",
    matchZh: "火焰抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["fire", "resistance"],
    tagsZh: ["火焰", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "cold_res",
    family: "ColdResistance",
    generation: "suffix",
    labelZh: "冰冷抗性",
    labelEn: "Cold Resistance",
    textZh: "+(6—10)%冰冷抗性",
    textEn: "+(6—10)% to Cold Resistance",
    match: "to Cold Resistance",
    matchZh: "冰冷抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["cold", "resistance"],
    tagsZh: ["冰冷", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "lightning_res",
    family: "LightningResistance",
    generation: "suffix",
    labelZh: "閃電抗性",
    labelEn: "Lightning Resistance",
    textZh: "+(6—10)%閃電抗性",
    textEn: "+(6—10)% to Lightning Resistance",
    match: "to Lightning Resistance",
    matchZh: "閃電抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["lightning", "resistance"],
    tagsZh: ["閃電", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "all_res",
    family: "AllResistances",
    generation: "suffix",
    labelZh: "全元素抗性",
    labelEn: "all Elemental Resistances",
    textZh: "+(3—5)%全元素抗性",
    textEn: "+(3—5)% to all Elemental Resistances",
    match: "to all Elemental Resistances",
    matchZh: "全元素抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 3, suggestedMax: 16 },
    tags: ["elemental", "resistance"],
    tagsZh: ["元素", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/tw/Amulets"],
  },
  {
    id: "chaos_res",
    family: "ChaosResistance",
    generation: "suffix",
    labelZh: "混沌抗性",
    labelEn: "Chaos Resistance",
    textZh: "+(4—7)%混沌抗性",
    textEn: "+(4—7)% to Chaos Resistance",
    match: "to Chaos Resistance",
    matchZh: "混沌抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 4, suggestedMax: 27 },
    tags: ["chaos", "resistance"],
    tagsZh: ["混沌", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "life_regen",
    family: "LifeRegeneration",
    generation: "suffix",
    labelZh: "生命回復",
    labelEn: "Life Regeneration",
    textZh: "(1—2)每秒生命回復",
    textEn: "(1—2) Life Regeneration per second",
    match: "Life Regeneration per second",
    matchZh: "每秒生命回復",
    kind: "numeric",
    numeric: { format: "bare", suggestedMin: 1, suggestedMax: 36 },
    tags: ["life"],
    tagsZh: ["生命"],
    sources: ["poe2db.tw/tw/Boots_str", "poe2db.tw/tw/Belts", "poe2db.tw/tw/Rings"],
  },
  {
    id: "strength",
    family: "Strength",
    generation: "suffix",
    labelZh: "力量",
    labelEn: "Strength",
    textZh: "+(5—8)點力量",
    textEn: "+(5—8) to Strength",
    match: "to Strength",
    matchZh: "點力量",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    sources: ["generated/shields.json"],
  },
  {
    id: "dexterity",
    family: "Dexterity",
    generation: "suffix",
    labelZh: "敏捷",
    labelEn: "Dexterity",
    textZh: "+(5—8)點敏捷",
    textEn: "+(5—8) to Dexterity",
    match: "to Dexterity",
    matchZh: "點敏捷",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    sources: ["generated/shields.json"],
  },
  {
    id: "intelligence",
    family: "Intelligence",
    generation: "suffix",
    labelZh: "智慧",
    labelEn: "Intelligence",
    textZh: "+(5—8)點智慧",
    textEn: "+(5—8) to Intelligence",
    match: "to Intelligence",
    matchZh: "點智慧",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    sources: ["generated/shields.json"],
  },
  {
    id: "cast_speed",
    family: "IncreasedCastSpeed",
    generation: "suffix",
    labelZh: "施法速度",
    labelEn: "Cast Speed",
    textZh: "增加(9—12)%施法速度",
    textEn: "(9—12)% increased Cast Speed",
    match: "increased Cast Speed",
    matchZh: "增加施法速度",
    kind: "numeric",
    numeric: { format: "percentPrefix", suggestedMin: 9, suggestedMax: 12 },
    tags: ["caster", "speed"],
    tagsZh: ["法術", "速度"],
    sources: ["poe2db.tw/tw/Rings", "poe2db.tw/tw/Amulets"],
  },
];

const DEFENSE_EARLY: ChapterShopPick[] = [
  { modId: "life", polarity: "include" },
  { modId: "movement_speed", polarity: "include" },
];

const DEFENSE_RESISTS: ChapterShopPick[] = [
  ...DEFENSE_EARLY,
  { modId: "fire_res", polarity: "include" },
  { modId: "cold_res", polarity: "include" },
  { modId: "lightning_res", polarity: "include" },
];

const DEFENSE_ALL_RES: ChapterShopPick[] = [
  ...DEFENSE_RESISTS,
  { modId: "all_res", polarity: "include" },
];

const DEFENSE_LATE: ChapterShopPick[] = [
  ...DEFENSE_ALL_RES,
  { modId: "chaos_res", polarity: "include" },
];

const CHAPTERS: CampaignChapter[] = [
  {
    id: "act-1",
    labelZh: "第一章",
    labelEn: "Act 1",
    summaryZh: "開荒商店先抓生命與移速靴；抗性詞綴較晚才穩定出現。",
    maps: [],
    defaultPicks: DEFENSE_EARLY,
  },
  {
    id: "act-2",
    labelZh: "第二章",
    labelEn: "Act 2",
    summaryZh: "三抗開始值得掃商店；與生命、移速一起 OR 高亮。",
    maps: [],
    defaultPicks: DEFENSE_RESISTS,
  },
  {
    id: "act-3",
    labelZh: "第三章",
    labelEn: "Act 3",
    summaryZh: "飾品全抗加入預設。能力值／能量護盾可在清單自行勾選。",
    maps: [],
    defaultPicks: DEFENSE_ALL_RES,
  },
  {
    id: "act-4",
    labelZh: "第四章",
    labelEn: "Act 4",
    summaryZh: "補上混沌抗性。地圖商店節點仍待資料，先用整章預設。",
    maps: [],
    defaultPicks: DEFENSE_LATE,
  },
  {
    id: "act-5",
    labelZh: "第五章",
    labelEn: "Act 5 / Interludes",
    summaryZh: "對應間章（Interludes）階段，沿用後期防禦組合；非獨立地圖表。",
    maps: [],
    defaultPicks: DEFENSE_LATE,
  },
];

export const shopMods: ShopMod[] = SHOP_MODS;
export const campaignChapters: CampaignChapter[] = CHAPTERS;

export function shopModById(id: string): ShopMod {
  const found = SHOP_MODS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown shop mod: ${id}`);
  return found;
}

export function getChapter(id: ChapterId): CampaignChapter {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}

export function isChapterId(value: string | null | undefined): value is ChapterId {
  return CHAPTERS.some((c) => c.id === value);
}

export function shopModToFamily(mod: ShopMod): AffixFamily {
  return {
    id: shopFamilyId(mod.id),
    family: mod.family,
    generation: mod.generation,
    tags: mod.tags,
    tagsZh: mod.tagsZh,
    labelZh: mod.labelZh,
    labelEn: mod.labelEn,
    textZh: mod.textZh,
    textEn: mod.textEn,
    match: mod.match,
    matchZh: mod.matchZh,
    kind: mod.kind,
    numeric: mod.numeric,
    tiers: [
      {
        nameZh: mod.labelZh,
        nameEn: mod.labelEn,
        level: 1,
        textZh: mod.textZh,
        textEn: mod.textEn,
        dropChance: 0,
      },
    ],
    minLevel: 1,
    maxLevel: 1,
    tierCount: 1,
    weight: 0,
  };
}

export function shopFamilies(): AffixFamily[] {
  return SHOP_MODS.map(shopModToFamily);
}

export function defaultPicksForChapter(id: ChapterId): Record<string, ShopPickState> {
  const picks: Record<string, ShopPickState> = {};
  for (const pick of getChapter(id).defaultPicks) {
    picks[shopFamilyId(pick.modId)] = {
      polarity: pick.polarity,
      min: pick.min != null ? String(pick.min) : "",
      max: pick.max != null ? String(pick.max) : "",
    };
  }
  return picks;
}
