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

/** Same gaps in 简中 / EN for chrome i18n. Affix strings stay source-backed elsewhere. */
export const CAMPAIGN_GAPS_I18N = {
  "zh-Hant": CAMPAIGN_GAPS,
  "zh-Hans": [
    "章节地图／城镇商店节点尚未进数据模型，默认正则以章为单位，不是每张地图一组。",
    "武器 DPS、攻击附加伤害、技能等级等词缀未列入：poe2db 家族会把不同技能／伤害类型混成一组，match 字符串不可靠。",
    "商店词缀池是从盾牌冻结数据＋poe2db 靴／饰品／护甲核对过的通用生存／移动组合，不是完整装备词缀表。",
    "未套用章节数值下限：商人任意一阶生命／抗性都值得高亮，乱填 min 会漏掉低阶装备。",
  ],
  en: [
    "Chapter map / town shop nodes are not in the data model yet; default regexes are per act, not per map.",
    "Weapon DPS, added attack damage, and skill-level affixes are omitted: poe2db families mix skill/damage types, so match strings are unreliable.",
    "The shop pool is a verified survival/move set from frozen shields plus poe2db boots/jewellery/armour — not a full item affix table.",
    "No chapter numeric floors: any vendor life/resist tier is worth highlighting; a guessed min would hide low-tier gear.",
  ],
} as const;

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
    labelZhHans: "生命上限",
    textZh: "+(10—19)最大生命",
    textEn: "+(10—19) to maximum Life",
    textZhHans: "+(10—19) 生命上限",
    match: "to maximum Life",
    matchZh: "最大生命",
    matchZhHans: "生命上限",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 10, suggestedMax: 214 },
    tags: ["life"],
    tagsZh: ["生命"],
    tagsZhHans: ["生命"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Boots_str", "poe2db.tw/cn/Boots_str", "poe2db.tw/tw/Rings"],
  },
  {
    id: "mana",
    family: "IncreasedMana",
    generation: "prefix",
    labelZh: "最大魔力",
    labelEn: "maximum Mana",
    labelZhHans: "魔力上限",
    textZh: "+(10—14)最大魔力",
    textEn: "+(10—14) to maximum Mana",
    textZhHans: "+(10—14) 魔力上限",
    match: "to maximum Mana",
    matchZh: "最大魔力",
    matchZhHans: "魔力上限",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 10, suggestedMax: 14 },
    tags: ["mana"],
    tagsZh: ["魔力"],
    tagsZhHans: ["魔力"],
    sources: ["poe2db.tw/tw/Rings", "poe2db.tw/cn/Rings", "poe2db.tw/tw/Helmets_str"],
  },
  {
    id: "energy_shield",
    family: "IncreasedEnergyShield",
    generation: "prefix",
    labelZh: "最大能量護盾",
    labelEn: "maximum Energy Shield",
    labelZhHans: "能量护盾上限",
    textZh: "+(8—14)最大能量護盾",
    textEn: "+(8—14) to maximum Energy Shield",
    textZhHans: "+(8—14) 能量护盾上限",
    match: "to maximum Energy Shield",
    matchZh: "最大能量護盾",
    matchZhHans: "能量护盾上限",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 8, suggestedMax: 17 },
    tags: ["energy_shield"],
    tagsZh: ["能量護盾"],
    tagsZhHans: ["能量护盾"],
    sources: ["poe2db.tw/tw/Amulets", "poe2db.tw/cn/Amulets", "poe2db.tw/tw/Body_Armours_int"],
  },
  {
    id: "movement_speed",
    family: "MovementVelocity",
    generation: "prefix",
    labelZh: "移動速度",
    labelEn: "Movement Speed",
    labelZhHans: "移动速度",
    textZh: "增加10%移動速度",
    textEn: "10% increased Movement Speed",
    textZhHans: "移动速度提高 10%",
    match: "increased Movement Speed",
    matchZh: "移動速度",
    matchZhHans: "移动速度提高",
    kind: "numeric",
    numeric: { format: "percentPrefix", suggestedMin: 10, suggestedMax: 35 },
    tags: ["speed"],
    tagsZh: ["速度"],
    tagsZhHans: ["速度"],
    sources: ["poe2db.tw/tw/Boots_str", "poe2db.tw/cn/Boots_str"],
  },
  {
    id: "fire_res",
    family: "FireResistance",
    generation: "suffix",
    labelZh: "火焰抗性",
    labelEn: "Fire Resistance",
    labelZhHans: "火焰抗性",
    textZh: "+(6—10)%火焰抗性",
    textEn: "+(6—10)% to Fire Resistance",
    textZhHans: "火焰抗性 +(6—10)%",
    match: "to Fire Resistance",
    matchZh: "火焰抗性",
    matchZhHans: "火焰抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["fire", "resistance"],
    tagsZh: ["火焰", "抗性"],
    tagsZhHans: ["火焰", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/cn/Shields_str", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "cold_res",
    family: "ColdResistance",
    generation: "suffix",
    labelZh: "冰冷抗性",
    labelEn: "Cold Resistance",
    labelZhHans: "冰霜抗性",
    textZh: "+(6—10)%冰冷抗性",
    textEn: "+(6—10)% to Cold Resistance",
    textZhHans: "冰霜抗性 +(6—10)%",
    match: "to Cold Resistance",
    matchZh: "冰冷抗性",
    matchZhHans: "冰霜抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["cold", "resistance"],
    tagsZh: ["冰冷", "抗性"],
    tagsZhHans: ["冰霜", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/cn/Shields_str", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "lightning_res",
    family: "LightningResistance",
    generation: "suffix",
    labelZh: "閃電抗性",
    labelEn: "Lightning Resistance",
    labelZhHans: "闪电抗性",
    textZh: "+(6—10)%閃電抗性",
    textEn: "+(6—10)% to Lightning Resistance",
    textZhHans: "闪电抗性 +(6—10)%",
    match: "to Lightning Resistance",
    matchZh: "閃電抗性",
    matchZhHans: "闪电抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 6, suggestedMax: 45 },
    tags: ["lightning", "resistance"],
    tagsZh: ["閃電", "抗性"],
    tagsZhHans: ["闪电", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/cn/Shields_str", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "all_res",
    family: "AllResistances",
    generation: "suffix",
    labelZh: "全元素抗性",
    labelEn: "all Elemental Resistances",
    labelZhHans: "所有元素抗性",
    textZh: "+(3—5)%全元素抗性",
    textEn: "+(3—5)% to all Elemental Resistances",
    textZhHans: "所有元素抗性 +(3—5)%",
    match: "to all Elemental Resistances",
    matchZh: "全元素抗性",
    matchZhHans: "所有元素抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 3, suggestedMax: 16 },
    tags: ["elemental", "resistance"],
    tagsZh: ["元素", "抗性"],
    tagsZhHans: ["元素", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/cn/Rings", "poe2db.tw/tw/Amulets"],
  },
  {
    id: "chaos_res",
    family: "ChaosResistance",
    generation: "suffix",
    labelZh: "混沌抗性",
    labelEn: "Chaos Resistance",
    labelZhHans: "混沌抗性",
    textZh: "+(4—7)%混沌抗性",
    textEn: "+(4—7)% to Chaos Resistance",
    textZhHans: "混沌抗性 +(4—7)%",
    match: "to Chaos Resistance",
    matchZh: "混沌抗性",
    matchZhHans: "混沌抗性",
    kind: "numeric",
    numeric: { format: "plusPercent", suggestedMin: 4, suggestedMax: 27 },
    tags: ["chaos", "resistance"],
    tagsZh: ["混沌", "抗性"],
    tagsZhHans: ["混沌", "抗性"],
    sources: ["generated/shields.json", "poe2db.tw/tw/Rings", "poe2db.tw/cn/Shields_str", "poe2db.tw/tw/Boots_str"],
  },
  {
    id: "life_regen",
    family: "LifeRegeneration",
    generation: "suffix",
    labelZh: "生命回復",
    labelEn: "Life Regeneration",
    labelZhHans: "生命再生",
    textZh: "(1—2)每秒生命回復",
    textEn: "(1—2) Life Regeneration per second",
    textZhHans: "生命每秒再生 (1—2)",
    match: "Life Regeneration per second",
    matchZh: "每秒生命回復",
    matchZhHans: "生命每秒再生",
    kind: "numeric",
    numeric: { format: "bare", suggestedMin: 1, suggestedMax: 36 },
    tags: ["life"],
    tagsZh: ["生命"],
    tagsZhHans: ["生命"],
    sources: ["poe2db.tw/tw/Boots_str", "poe2db.tw/cn/Boots_str", "poe2db.tw/tw/Belts", "poe2db.tw/tw/Rings"],
  },
  {
    id: "strength",
    family: "Strength",
    generation: "suffix",
    labelZh: "力量",
    labelEn: "Strength",
    labelZhHans: "力量",
    textZh: "+(5—8)點力量",
    textEn: "+(5—8) to Strength",
    textZhHans: "+(5—8) 力量",
    match: "to Strength",
    matchZh: "點力量",
    matchZhHans: "力量",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    tagsZhHans: ["属性"],
    sources: ["generated/shields.json", "poe2db.tw/cn/Shields_str"],
  },
  {
    id: "dexterity",
    family: "Dexterity",
    generation: "suffix",
    labelZh: "敏捷",
    labelEn: "Dexterity",
    labelZhHans: "敏捷",
    textZh: "+(5—8)點敏捷",
    textEn: "+(5—8) to Dexterity",
    textZhHans: "+(5—8) 敏捷",
    match: "to Dexterity",
    matchZh: "點敏捷",
    matchZhHans: "敏捷",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    tagsZhHans: ["属性"],
    sources: ["generated/shields.json", "poe2db.tw/cn/Rings"],
  },
  {
    id: "intelligence",
    family: "Intelligence",
    generation: "suffix",
    labelZh: "智慧",
    labelEn: "Intelligence",
    labelZhHans: "智慧",
    textZh: "+(5—8)點智慧",
    textEn: "+(5—8) to Intelligence",
    textZhHans: "+(5—8) 智慧",
    match: "to Intelligence",
    matchZh: "點智慧",
    matchZhHans: "智慧",
    kind: "numeric",
    numeric: { format: "plusFlat", suggestedMin: 5, suggestedMax: 33 },
    tags: ["attribute"],
    tagsZh: ["能力"],
    tagsZhHans: ["属性"],
    sources: ["generated/shields.json", "poe2db.tw/cn/Rings"],
  },
  {
    id: "cast_speed",
    family: "IncreasedCastSpeed",
    generation: "suffix",
    labelZh: "施法速度",
    labelEn: "Cast Speed",
    labelZhHans: "施法速度",
    textZh: "增加(9—12)%施法速度",
    textEn: "(9—12)% increased Cast Speed",
    textZhHans: "施法速度提高 (9—12)%",
    match: "increased Cast Speed",
    matchZh: "增加施法速度",
    matchZhHans: "施法速度提高",
    kind: "numeric",
    numeric: { format: "percentPrefix", suggestedMin: 9, suggestedMax: 12 },
    tags: ["caster", "speed"],
    tagsZh: ["法術", "速度"],
    tagsZhHans: ["施法", "速度"],
    sources: ["poe2db.tw/tw/Rings", "poe2db.tw/cn/Rings", "poe2db.tw/tw/Amulets"],
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
    labelZhHans: "第一章",
    summaryZh: "開荒商店先抓生命與移速靴；抗性詞綴較晚才穩定出現。",
    summaryZhHans: "开荒商店先抓生命与移速靴；抗性词缀较晚才稳定出现。",
    summaryEn: "Early shops: grab life and move-speed boots first. Resists show up more reliably later.",
    maps: [],
    defaultPicks: DEFENSE_EARLY,
  },
  {
    id: "act-2",
    labelZh: "第二章",
    labelEn: "Act 2",
    labelZhHans: "第二章",
    summaryZh: "三抗開始值得掃商店；與生命、移速一起 OR 高亮。",
    summaryZhHans: "三抗开始值得扫商店；与生命、移速一起 OR 高亮。",
    summaryEn: "Fire/cold/lightning resists are worth scanning, OR-combined with life and move speed.",
    maps: [],
    defaultPicks: DEFENSE_RESISTS,
  },
  {
    id: "act-3",
    labelZh: "第三章",
    labelEn: "Act 3",
    labelZhHans: "第三章",
    summaryZh: "飾品全抗加入預設。能力值／能量護盾可在清單自行勾選。",
    summaryZhHans: "饰品全抗加入默认。属性／能量护盾可在清单自行勾选。",
    summaryEn: "All-res jewellery joins the defaults. Attributes / energy shield stay optional in the list.",
    maps: [],
    defaultPicks: DEFENSE_ALL_RES,
  },
  {
    id: "act-4",
    labelZh: "第四章",
    labelEn: "Act 4",
    labelZhHans: "第四章",
    summaryZh: "補上混沌抗性。地圖商店節點仍待資料，先用整章預設。",
    summaryZhHans: "补上混沌抗性。地图商店节点仍待数据，先用整章默认。",
    summaryEn: "Chaos resist is added. Per-map shop nodes are still missing, so the whole-act default is used.",
    maps: [],
    defaultPicks: DEFENSE_LATE,
  },
  {
    id: "act-5",
    labelZh: "第五章",
    labelEn: "Act 5 / Interludes",
    labelZhHans: "第五章",
    summaryZh: "對應間章（Interludes）階段，沿用後期防禦組合；非獨立地圖表。",
    summaryZhHans: "对应间章（Interludes）阶段，沿用后期防御组合；非独立地图表。",
    summaryEn: "Covers the Interludes stretch with the late defensive set; not a separate map table.",
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
    tagsZhHans: mod.tagsZhHans,
    labelZh: mod.labelZh,
    labelEn: mod.labelEn,
    labelZhHans: mod.labelZhHans,
    textZh: mod.textZh,
    textEn: mod.textEn,
    textZhHans: mod.textZhHans,
    match: mod.match,
    matchZh: mod.matchZh,
    matchZhHans: mod.matchZhHans,
    kind: mod.kind,
    numeric: mod.numeric,
    tiers: [
      {
        nameZh: mod.labelZh,
        nameEn: mod.labelEn,
        nameZhHans: mod.labelZhHans,
        level: 1,
        textZh: mod.textZh,
        textEn: mod.textEn,
        textZhHans: mod.textZhHans,
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
