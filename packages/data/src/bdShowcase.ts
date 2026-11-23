import pobSnapshot from "./ruoaPoB2.json";
import type { AffixFamily, CraftSlotId, ShieldBaseId, ShieldFamily } from "./types.ts";
import shieldsJson from "../generated/shields.json";
import { affixModGroup, earlyGearCatalog, isEarlyGearSlotId } from "./earlyGear.ts";
import { desecratedFamiliesFor } from "./desecrated.ts";
import { BASE_SIDE_CAP, familiesForSocketAugments } from "./socketPools.ts";
import { craftingFamiliesFor, isWeaponCategoryId, weaponCatalog } from "./weapons.ts";
import { RUO_CETACEA_META, ruoaCetaceaMemorial } from "./memorialSnapshot.ts";

/**
 * Season BD memorial + recommended paper doll.
 *
 * v1 is one build. `memorial` stays null until a poe.ninja character page is
 * transcribed from its text and item art. `recommended` is the same build's
 * ideal bases and affix types, checked in after the player names their picks.
 * Images are poe2db.tw (PoE2 編年史) URLs looked up by Traditional Chinese or
 * English item name. Do not store poe.ninja image URLs.
 *
 * Rare items use at most SHOWCASE_SIDE_CAP prefixes and the same number of
 * suffixes, plus implicits. Affix picks name a crafting-library family and a
 * rank. They do not store a tier.
 */

const shieldFamilies = shieldsJson as ShieldFamily[];

export const SHOWCASE_SIDE_CAP = BASE_SIDE_CAP;

export type ShowcaseRank = "required" | "optional";

export type ShowcasePick = {
  /** `AffixFamily.id` from `catalogForDollSlot` for this slot. */
  familyId: string;
  rank: ShowcaseRank;
};

export type ShowcaseText = {
  textZh: string;
  textEn: string;
};

export type MemorialAffix = ShowcaseText & {
  generation: "prefix" | "suffix";
};

/** Mod kind copied from the tooltip. Prefix and suffix are not guessed. */
export type MemorialMod = {
  kind: string;
  verifiedTier?: number;
  textZh: string;
  textEn: string;
};

export type MemorialSocket = {
  nameZh: string;
  nameEn: string;
  baseZh: string;
  baseEn: string;
  rarity: string;
  mods: MemorialMod[];
  tooltipEn?: string;
  tooltipZh?: string;
  imageUrl?: string;
};

export type MemorialNotable = {
  nameZh: string;
  nameEn: string;
  mods: MemorialMod[];
};

/** Gear copied off a poe.ninja character. Absent slots are empty, never invented. */
export type MemorialGear = {
  nameZh: string;
  nameEn: string;
  imageUrl: string;
  baseZh: string;
  baseEn: string;
  rarity?: "" | "unique" | "rare" | "magic";
  qualityEn?: string;
  qualityZh?: string;
  itemLevel?: number | null;
  requirementsEn?: string;
  requirementsZh?: string;
  stats?: ShowcaseText[];
  /** Recorded tooltip lines. `kind` is never prefix or suffix. */
  mods?: MemorialMod[];
  sockets?: MemorialSocket[];
  notables?: MemorialNotable[];
  flavourEn?: string;
  flavourZh?: string;
  mirroredEn?: string;
  mirroredZh?: string;
  corruptedEn?: string;
  corruptedZh?: string;
  /** Captured poe.ninja tooltip. Not reconstructed. */
  tooltipEn?: string;
  tooltipZh?: string;
  implicits: ShowcaseText[];
  affixes: MemorialAffix[];
};

/** Ideal base for one paper-doll slot. Empty strings mean "not filled in yet". */
export type RecommendedGear = {
  nameZh: string;
  nameEn: string;
  imageUrl: string;
  baseZh: string;
  baseEn: string;
  implicits: ShowcaseText[];
  /** Crafting-library slot. Null until a weapon or off-hand class is known. */
  craftSlot: CraftSlotId | null;
  /** poe2db pool id inside that slot, when a single base is known. */
  basePoolId: string | null;
  augments?: string[];
  runeforge?: boolean;
  affixes: ShowcasePick[];
};

export type MemorialTree = {
  nodes: { id: string; x: number; y: number; nameZh: string; nameEn: string; effectZh?: string; effectEn?: string; allocated: boolean; weaponSets?: number[] }[];
  edges: [string, string][];
};

export type BdShowcase = {
  pobStats?: Readonly<Record<string, number>>;
  passiveTree?: MemorialTree;
  ascendancyTree?: MemorialTree;
  id: string;
  titleZh: string;
  titleEn: string;
  classZh?: string;
  classEn?: string;
  level?: number | null;
  leagueZh?: string;
  leagueEn?: string;
  /** poe.ninja character URL. Null until the product owner supplies one. */
  ninjaUrl: string | null;
  /** Null means no snapshot has been transcribed. */
  memorial: null | Partial<Record<PaperDollSlotId, MemorialGear>>;
  recommended: Partial<Record<PaperDollSlotId, RecommendedGear>>;
};

export const paperDollGroups = [
  { id: "weapon-1", labelZh: "武器組 I", labelEn: "Weapon set I" },
  { id: "weapon-2", labelZh: "武器組 II", labelEn: "Weapon set II" },
  { id: "armour", labelZh: "防具", labelEn: "Armour" },
  { id: "jewellery", labelZh: "首飾", labelEn: "Jewellery" },
  { id: "flask", labelZh: "藥劑", labelEn: "Flasks" },
  { id: "charm", labelZh: "咒符", labelEn: "Charms" },
  { id: "trinket", labelZh: "飾品", labelEn: "Trinket" },
  { id: "jewel", labelZh: "基礎珠寶", labelEn: "BASE JEWELS" },
] as const;

export type PaperDollGroupId = (typeof paperDollGroups)[number]["id"];

export const paperDollSlots = [
  { id: "weapon-1-main", group: "weapon-1", area: "weapon", set: 1, labelZh: "主手", labelEn: "Main hand" },
  { id: "weapon-1-off", group: "weapon-1", area: "offhand", set: 1, labelZh: "副手", labelEn: "Off hand" },
  { id: "weapon-2-main", group: "weapon-2", area: "weapon", set: 2, labelZh: "主手", labelEn: "Main hand" },
  { id: "weapon-2-off", group: "weapon-2", area: "offhand", set: 2, labelZh: "副手", labelEn: "Off hand" },
  { id: "helmet", group: "armour", area: "helm", set: 0, labelZh: "頭盔", labelEn: "Helmet" },
  { id: "body", group: "armour", area: "body", set: 0, labelZh: "胸甲", labelEn: "Body armour" },
  { id: "gloves", group: "armour", area: "gloves", set: 0, labelZh: "手套", labelEn: "Gloves" },
  { id: "boots", group: "armour", area: "boots", set: 0, labelZh: "鞋子", labelEn: "Boots" },
  { id: "ring-3", group: "jewellery", area: "ring3", set: 0, labelZh: "戒指 3", labelEn: "Ring 3" },
  { id: "ring-1", group: "jewellery", area: "ring", set: 0, labelZh: "戒指", labelEn: "Ring" },
  { id: "ring-2", group: "jewellery", area: "ring2", set: 0, labelZh: "戒指 2", labelEn: "Ring 2" },
  { id: "amulet", group: "jewellery", area: "amulet", set: 0, labelZh: "項鍊", labelEn: "Amulet" },
  { id: "belt", group: "jewellery", area: "belt", set: 0, labelZh: "腰帶", labelEn: "Belt" },
  { id: "trinket", group: "trinket", area: "trinket", set: 0, labelZh: "飾品", labelEn: "Trinket" },
  { id: "flask-life", group: "flask", area: "life", set: 0, labelZh: "生命藥劑", labelEn: "Life flask" },
  { id: "flask-mana", group: "flask", area: "mana", set: 0, labelZh: "魔力藥劑", labelEn: "Mana flask" },
  { id: "charm-1", group: "charm", area: "charm", set: 0, labelZh: "咒符 1", labelEn: "Charm 1" },
  { id: "charm-2", group: "charm", area: "charm", set: 0, labelZh: "咒符 2", labelEn: "Charm 2" },
  { id: "charm-3", group: "charm", area: "charm", set: 0, labelZh: "咒符 3", labelEn: "Charm 3" },
  { id: "jewel-1", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 1", labelEn: "Jewel 1" },
  { id: "jewel-2", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 2", labelEn: "Jewel 2" },
  { id: "jewel-3", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 3", labelEn: "Jewel 3" },
  { id: "jewel-4", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 4", labelEn: "Jewel 4" },
  { id: "jewel-5", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 5", labelEn: "Jewel 5" },
  { id: "jewel-6", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 6", labelEn: "Jewel 6" },
  { id: "jewel-7", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 7", labelEn: "Jewel 7" },
  { id: "jewel-8", group: "jewel", area: "jewel", set: 0, labelZh: "珠寶 8", labelEn: "Jewel 8" },
] as const;

export type PaperDollSlot = (typeof paperDollSlots)[number];
export type PaperDollSlotId = PaperDollSlot["id"];

const DEFAULT_CRAFT_SLOT: Partial<Record<PaperDollSlotId, CraftSlotId>> = {
  helmet: "helmet",
  body: "body",
  gloves: "gloves",
  boots: "boots",
  amulet: "amulet",
  "ring-1": "ring",
  "ring-2": "ring",
  "ring-3": "ring",
  belt: "belt",
};

function snapshotTree(tree: typeof pobSnapshot.passiveTree): MemorialTree {
  return {
    nodes: tree.nodes,
    edges: tree.edges.map(([from, to]) => [from, to]),
  };
}

export const SEASON_BD_V1: BdShowcase = {
  id: "ruoa-cetacea",
  passiveTree: snapshotTree(pobSnapshot.passiveTree),
  ascendancyTree: snapshotTree(pobSnapshot.ascendancyTree),
  pobStats: pobSnapshot.stats,
  titleZh: RUO_CETACEA_META.name,
  titleEn: RUO_CETACEA_META.name,
  classZh: RUO_CETACEA_META.classZh,
  classEn: RUO_CETACEA_META.classEn,
  level: RUO_CETACEA_META.level,
  leagueZh: RUO_CETACEA_META.leagueZh,
  leagueEn: RUO_CETACEA_META.leagueEn,
  ninjaUrl: RUO_CETACEA_META.ninjaUrl,
  memorial: ruoaCetaceaMemorial(),
  recommended: {},
};

export function emptyRecommendedGear(): RecommendedGear {
  return {
    nameZh: "",
    nameEn: "",
    imageUrl: "",
    baseZh: "",
    baseEn: "",
    implicits: [],
    craftSlot: null,
    basePoolId: null,
    affixes: [],
  };
}

export function memorialGear(snapshot: BdShowcase, slotId: PaperDollSlotId): MemorialGear | null {
  if (!snapshot.memorial) return null;
  return snapshot.memorial[slotId] ?? null;
}

export function recommendedGear(snapshot: BdShowcase, slotId: PaperDollSlotId): RecommendedGear {
  return snapshot.recommended[slotId] ?? emptyRecommendedGear();
}

export function resolveCraftSlot(slotId: PaperDollSlotId, gear: RecommendedGear): CraftSlotId | null {
  if (gear.craftSlot) return gear.craftSlot;
  return DEFAULT_CRAFT_SLOT[slotId] ?? null;
}

/** Same rows as the crafting page, narrowed to one base pool when one is recorded. */
export function showcaseCatalog(slot: CraftSlotId, basePoolId: string | null): AffixFamily[] {
  if (!basePoolId) return craftingFamiliesFor(slot);
  if (slot === "shield") {
    const base = basePoolId as ShieldBaseId;
    return shieldFamilies.filter((family) => family.bases.includes(base));
  }
  if (isEarlyGearSlotId(slot)) {
    return earlyGearCatalog.byCategory[slot]?.[basePoolId] ?? [];
  }
  if (isWeaponCategoryId(slot)) {
    return weaponCatalog.byCategory[slot]?.[basePoolId] ?? [];
  }
  return [];
}

export function catalogForDollSlot(slotId: PaperDollSlotId, gear: RecommendedGear): AffixFamily[] {
  const slot = resolveCraftSlot(slotId, gear);
  if (!slot) return [];
  if (!gear.basePoolId) return showcaseCatalog(slot, gear.basePoolId);
  const families = [...showcaseCatalog(slot, gear.basePoolId), ...desecratedFamiliesFor(slot), ...familiesForSocketAugments(gear.augments ?? [])];
  return [...new Map(families.map((family) => [family.id, family])).values()];
}

export function setShowcasePick(
  picks: readonly ShowcasePick[],
  family: AffixFamily,
  catalog: readonly AffixFamily[],
  rank: ShowcaseRank | null,
): ShowcasePick[] {
  const group = affixModGroup(family);
  const inGroup = (familyId: string) => {
    const other = catalog.find((row) => row.id === familyId);
    return Boolean(other && affixModGroup(other) === group);
  };
  if (rank == null) return picks.filter((pick) => !inGroup(pick.familyId));

  const already = picks.some((pick) => pick.familyId === family.id);
  const kept = picks.filter((pick) => !inGroup(pick.familyId));
  const sideCount = kept.filter((pick) => {
    const other = catalog.find((row) => row.id === pick.familyId);
    return other?.generation === family.generation;
  }).length;
  if (!already && sideCount >= SHOWCASE_SIDE_CAP) return [...picks];
  return [...kept, { familyId: family.id, rank }];
}

export type ShowcaseAffixLine = {
  kind: "affix";
  rank: ShowcaseRank;
  familyId: string;
  generation: "prefix" | "suffix";
  labelZh: string;
  labelEn: string;
};

export type ShowcaseEmptyLine = {
  kind: "empty";
  generation: "prefix" | "suffix";
};

export type ShowcaseLine = ShowcaseAffixLine | ShowcaseEmptyLine;

export function showcaseLines(
  picks: readonly ShowcasePick[],
  catalog: readonly AffixFamily[],
): { prefixes: ShowcaseLine[]; suffixes: ShowcaseLine[] } {
  return {
    prefixes: linesFor("prefix", picks, catalog),
    suffixes: linesFor("suffix", picks, catalog),
  };
}

function linesFor(
  generation: "prefix" | "suffix",
  picks: readonly ShowcasePick[],
  catalog: readonly AffixFamily[],
): ShowcaseLine[] {
  const side = catalog.filter((family) => family.generation === generation);
  const index = new Map(side.map((family, position) => [family.id, position]));
  const rows = picks
    .flatMap((pick) => {
      const family = side.find((row) => row.id === pick.familyId);
      return family ? [{ pick, family }] : [];
    })
    .sort((a, b) => {
      if (a.pick.rank !== b.pick.rank) return a.pick.rank === "required" ? -1 : 1;
      return (index.get(a.family.id) ?? 0) - (index.get(b.family.id) ?? 0);
    });
  const affixes: ShowcaseLine[] = rows.map((row) => ({
    kind: "affix",
    rank: row.pick.rank,
    familyId: row.family.id,
    generation,
    labelZh: row.family.matchZh || row.family.textZh,
    labelEn: row.family.match || row.family.textEn,
  }));
  const holes = Math.max(0, SHOWCASE_SIDE_CAP - affixes.length);
  const empty: ShowcaseLine[] = Array.from({ length: holes }, () => ({ kind: "empty", generation }));
  return [...affixes, ...empty];
}

/** Chronicle art only. poe.ninja and PoE1 poedb hosts are refused. */
export function showcaseImageUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname;
    if (host !== "poe2db.tw" && host !== "www.poe2db.tw" && host !== "cdn.poe2db.tw") return null;
    return url;
  } catch {
    return null;
  }
}
