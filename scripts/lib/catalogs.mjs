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
];
