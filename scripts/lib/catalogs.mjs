/** Canonical poe2db.tw pages the frozen JSON is built from. */

export const POE2DB_ORIGIN = process.env.POE2DB_ORIGIN || "https://poe2db.tw";

export const REPOE_ORIGIN = process.env.REPOE_ORIGIN || "https://repoe-fork.github.io/poe2";

export const REPOE_MODS_URL = process.env.REPOE_MODS_URL || `${REPOE_ORIGIN}/mods.min.json`;

export const REPOE_INDEX_URL = process.env.REPOE_INDEX_URL || `${REPOE_ORIGIN}/`;

export const SHIELD_BASES = [
  { id: "str", labelZh: "力量塔盾", labelEn: "Str Shield", path: "Shields_str" },
  { id: "str_dex", labelZh: "力／敏盾", labelEn: "Str/Dex Shield", path: "Shields_str_dex" },
  { id: "str_int", labelZh: "力／智盾", labelEn: "Str/Int Shield", path: "Shields_str_int" },
  { id: "buckler", labelZh: "輕盾", labelEn: "Buckler", path: "Bucklers" },
];

/** Attribute-split armour pages on poe2db.tw (index pages have no ModsView). */
export const ARMOUR_ATTR_POOLS = [
  { id: "str", labelZh: "力量", labelEn: "Str" },
  { id: "dex", labelZh: "敏捷", labelEn: "Dex" },
  { id: "int", labelZh: "智慧", labelEn: "Int" },
  { id: "str_dex", labelZh: "力／敏", labelEn: "Str/Dex" },
  { id: "str_int", labelZh: "力／智", labelEn: "Str/Int" },
  { id: "dex_int", labelZh: "敏／智", labelEn: "Dex/Int" },
];

export function armourPools(pagePrefix) {
  return ARMOUR_ATTR_POOLS.map((pool) => ({
    ...pool,
    path: `${pagePrefix}_${pool.id}`,
  }));
}

function singlePool(id, labelZh, labelEn, path) {
  return {
    id,
    labelZh,
    labelEn,
    path,
    pools: [{ id, labelZh, labelEn, path }],
  };
}

/**
 * Campaign early-gear Chronicles pages (excluding shields, which stay in shields.json).
 * Wands are omitted: poe2db families mix damage types so match strings are unreliable.
 */
export const EARLY_GEAR_CATEGORIES = [
  {
    id: "body",
    labelZh: "胸甲",
    labelEn: "Body armour",
    path: "Body_Armours_str",
    pools: armourPools("Body_Armours"),
  },
  {
    id: "helmet",
    labelZh: "頭盔",
    labelEn: "Helmet",
    path: "Helmets_str",
    pools: armourPools("Helmets"),
  },
  {
    id: "gloves",
    labelZh: "手套",
    labelEn: "Gloves",
    path: "Gloves_str",
    pools: armourPools("Gloves"),
  },
  {
    id: "boots",
    labelZh: "鞋子",
    labelEn: "Boots",
    path: "Boots_str",
    pools: armourPools("Boots"),
  },
  singlePool("ring", "戒指", "Ring", "Rings"),
  singlePool("amulet", "項鍊", "Amulet", "Amulets"),
  singlePool("belt", "腰帶", "Belt", "Belts"),
  singlePool("mace1h", "單手錘", "One-handed mace", "One_Hand_Maces"),
];

export const WAYSTONE_TIERS = [
  { id: "low", labelZh: "低階", labelEn: "Low", path: "Waystones_low_tier" },
  { id: "mid", labelZh: "中階", labelEn: "Mid", path: "Waystones_mid_tier" },
  { id: "top", labelZh: "高階", labelEn: "Top", path: "Waystones_top_tier" },
];

export const TABLET_KINDS = [
  { id: "breach", labelZh: "裂痕碑牌", labelEn: "Breach Tablet", path: "Breach_Tablet" },
  { id: "expedition", labelZh: "探險碑牌", labelEn: "Expedition Tablet", path: "Expedition_Tablet" },
  { id: "delirium", labelZh: "譫妄碑牌", labelEn: "Delirium Tablet", path: "Delirium_Tablet" },
  { id: "ritual", labelZh: "祭祀碑牌", labelEn: "Ritual Tablet", path: "Ritual_Tablet" },
  { id: "irradiated", labelZh: "輻照碑牌", labelEn: "Irradiated Tablet", path: "Irradiated_Tablet" },
  { id: "overseer", labelZh: "總督碑牌", labelEn: "Overseer Tablet", path: "Overseer_Tablet" },
  { id: "abyss", labelZh: "深淵碑牌", labelEn: "Abyss Tablet", path: "Abyss_Tablet" },
  { id: "temple", labelZh: "神廟碑牌", labelEn: "Temple Tablet", path: "Temple_Tablet" },
];

export const GENERATED_FILES = [
  "shields.json",
  "tags.json",
  "meta.json",
  "waystones.json",
  "tablets.json",
  "early-gear.json",
];
