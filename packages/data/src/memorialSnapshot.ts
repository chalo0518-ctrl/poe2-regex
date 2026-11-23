import snapshot from "./ruoaCetacea.json";
import { craftingSlots } from "./weapons.ts";
import { earlyGearCatalog, isEarlyGearSlotId } from "./earlyGear.ts";
import { weaponCatalog } from "./weapons.ts";
import { recognizeMemorialModifier } from "./memorialTier.ts";
import type { MemorialGear, MemorialMod, MemorialSocket, PaperDollSlotId, ShowcaseText } from "./bdShowcase.ts";

/**
 * Chronicle art from the poe2db.tw item page `itemboximage`.
 * Files are served by cdn.poe2db.tw; poe2db.tw/image itself 404s.
 * Rare items use the base-type page. Unique items use the unique page.
 * No poe.ninja URLs.
 */
const ART: Record<string, string> = {
  "Guiding Palm of the Mind": "https://cdn.poe2db.tw/image/Art/2DItems/Weapons/OneHandWeapons/Scepters/Uniques/GuidingPalmLightning.webp",
  "Sylvan's Effigy": "https://cdn.poe2db.tw/image/Art/2DItems/Weapons/OneHandWeapons/Scepters/Uniques/Packleader.webp",
  "The Eternal Spark": "https://cdn.poe2db.tw/image/Art/2DItems/Offhand/Foci/Uniques/EternalSpark.webp",
  "Soul Mantle": "https://cdn.poe2db.tw/image/Art/2DItems/Armours/BodyArmours/Uniques/SoulMantle.webp",
  Nightscale: "https://cdn.poe2db.tw/image/Art/2DItems/Armours/Gloves/Uniques/Nightscale.webp",
  "Kalandra's Touch": "https://cdn.poe2db.tw/image/Art/2DItems/Rings/MirrorRing.webp",
  "Olroth's Resolve": "https://cdn.poe2db.tw/image/Art/2DItems/Flasks/Uniques/OlrothsResolve.webp",
  "Lavianga's Spirits": "https://cdn.poe2db.tw/image/Art/2DItems/Flasks/Uniques/LaviangasSpirit.webp",
  "The Black Cat": "https://cdn.poe2db.tw/image/Art/2DItems/Charms/Uniques/GroundingUniqueCharm.webp",
  "Rite of Passage": "https://cdn.poe2db.tw/image/Art/2DItems/Charms/Uniques/GoldenUniqueCharm.webp",
  "The Fall of the Axe": "https://cdn.poe2db.tw/image/Art/2DItems/Charms/Uniques/SilverUniqueCharm.webp",
  "Heart of the Well": "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/Uniques/ApostatesHeart.webp",
  Megalomaniac: "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/DeliriumJewel.webp",
  Voices: "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/Uniques/Voices.webp",
  "Dueling Wand": "https://cdn.poe2db.tw/image/Art/2DItems/Weapons/OneHandWeapons/Wands/Basetypes/Wand13.webp",
  "Ancestral Tiara": "https://cdn.poe2db.tw/image/Art/2DItems/Armours/Helmets/Basetypes/HelmetInt08.webp",
  "Invoking Belt": "https://cdn.poe2db.tw/image/Art/2DItems/Belts/Basetypes/InvokingBelt.webp",
  "Sekhema Sandals": "https://cdn.poe2db.tw/image/Art/2DItems/Armours/Boots/Basetypes/BootsInt06.webp",
  "Portent Amulet": "https://cdn.poe2db.tw/image/Art/2DItems/Amulets/Basetypes/PortentAmulet.webp",
  "Mnemonic Ring": "https://cdn.poe2db.tw/image/Art/2DItems/Rings/BreachlordRing_Esh.webp",
  Sapphire: "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/SapphireJewel.webp",
  Diamond: "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/DiamondJewel.webp",
  "Time-Lost Sapphire": "https://cdn.poe2db.tw/image/Art/2DItems/Jewels/SpecialSapphireJewel.webp",
  "Serle's Triumph": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Expedition2/GameWarpRune2.webp",
  "Hedgewitch Assandra's Rune of Wisdom": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Runes/NewRune1.webp",
  "Legacy of Lifesprig": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Expedition2/GameWarpRuneUniqueFragment.webp",
  "Rabbit Idol": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/TormentedSpiritSocketables/AzmeriSocketableRabbit.webp",
  "Fox Idol": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/TormentedSpiritSocketables/AzmeriSocketableFox.webp",
  "Idol of Yeena": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/TormentedSpiritSocketables/IdolofYeena.webp",
  "Snake Idol": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/TormentedSpiritSocketables/AzmeriSocketableSnake.webp",
  "Greater Storm Rune": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Runes/LightningRuneTier2.webp",
  "Perfect Ward Rune": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Expedition2/AddedWardPerfect.webp",
  "Perfect Iron Rune": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Runes/PerfectRuneEnhance.webp",
  "Raven-Touched Shard": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Delirium/DeliriumEndgameSocketable.webp",
  "Idol of Maxarius": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/TormentedSpiritSocketables/AzmeriSocketableStagSpecial.webp",
  "Rune of Foundations": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Expedition2/EarlyMythicRune7.webp",
  "Craiceann's Rune of Warding": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Runes/NewRune6.webp",
  "Cadigan's Epiphany": "https://cdn.poe2db.tw/image/Art/2DItems/Currency/Expedition2/GameWarpRune3.webp",
};

type RawText = { kind?: string; text_en?: string; text_zh?: string; prefix_suffix?: string | null };
type RawNotable = { name_en?: string; name_zh?: string; mods?: RawText[] };
type RawItem = {
  status?: string;
  rarity?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  base_en?: string | null;
  item_class_en?: string | null;
  base_zh?: string | null;
  quality?: string | null;
  item_level?: number | null;
  requirements?: string | null;
  implicit_mods?: RawText[];
  explicit_affixes?: RawText[];
  other_visible_text?: {
    enchanted?: RawText[];
    enchanted_from_sockets?: RawText[];
    allocated_notable?: RawNotable;
    allocated_notables?: RawNotable[];
    mirrored?: { text_en?: string; text_zh?: string };
  };
  corrupted_text_en?: string;
  corrupted_text_zh?: string;
  flavour_en?: string;
  flavour_zh?: string;
  stats_shown?: Record<string, string>;
  tooltip_en?: string;
  tooltip_zh?: string;
  socketed_items?: {
    name_en?: string;
    name_zh?: string;
    base_en?: string;
    base_zh?: string;
    rarity?: string;
    explicit_affixes?: RawText[];
    tooltip_en?: string;
    tooltip_zh?: string;
  }[];
};

const STAT_LABELS: Record<string, [string, string]> = {
  Spirit: ["Spirit", "精魂"],
  "Energy Shield": ["Energy Shield", "能量護盾"],
  Armour: ["Armour", "護甲值"],
  "Evasion Rating": ["Evasion Rating", "閃避值"],
  "Runic Ward": ["Runic Ward", "保護"],
};

const SLOT_KEYS: Record<string, PaperDollSlotId> = {
  weapon_set_I_main_hand: "weapon-1-main",
  weapon_set_I_off_hand: "weapon-1-off",
  weapon_set_II_main_hand: "weapon-2-main",
  weapon_set_II_off_hand: "weapon-2-off",
  helm: "helmet",
  body: "body",
  gloves: "gloves",
  boots: "boots",
  belt: "belt",
  amulet: "amulet",
  ring: "ring-1",
  ring2: "ring-2",
  life_flask: "flask-life",
  mana_flask: "flask-mana",
};

function textOf(row: RawText): MemorialMod | null {
  const textEn = row.text_en ?? "";
  const textZh = row.text_zh ?? "";
  if (!textEn && !textZh) return null;
  const generation = row.prefix_suffix === "prefix" || row.prefix_suffix === "suffix" ? row.prefix_suffix : undefined;
  return { kind: row.kind || "explicit", textEn, textZh, generation };
}

function modsOf(rows: RawText[] | undefined): MemorialMod[] {
  return (rows ?? []).flatMap((row) => {
    const mod = textOf(row);
    return mod ? [mod] : [];
  });
}

function splitPair(value: string | null | undefined): { en: string; zh: string } {
  if (!value) return { en: "", zh: "" };
  const idx = value.indexOf(" / ");
  if (idx === -1) return { en: value, zh: "" };
  return { en: value.slice(0, idx), zh: value.slice(idx + 3) };
}

function statsOf(shown: Record<string, string> | undefined): ShowcaseText[] {
  if (!shown) return [];
  const rows: ShowcaseText[] = [];
  for (const [key, [en, zh]] of Object.entries(STAT_LABELS)) {
    if (!shown[key]) continue;
    rows.push({ textEn: `${en}: ${shown[key]}`, textZh: `${zh}: ${shown[key]}` });
  }
  const pairs: [string, string][] = [
    ["duration_en", "duration_zh"],
    ["charges_en", "charges_zh"],
    ["grants_en", "grants_zh"],
    ["recovers_en", "recovers_zh"],
  ];
  for (const [enKey, zhKey] of pairs) {
    if (!shown[enKey] && !shown[zhKey]) continue;
    rows.push({ textEn: shown[enKey] ?? "", textZh: shown[zhKey] ?? "" });
  }
  return rows;
}

function artFor(nameEn: string, baseEn: string, rarity: string): string {
  if (ART[nameEn]) return ART[nameEn];
  if (rarity === "rare" && ART[baseEn]) return ART[baseEn];
  return "";
}

function notablesOf(item: RawItem): { nameZh: string; nameEn: string; mods: MemorialMod[] }[] {
  const extra = item.other_visible_text;
  const rows = [
    ...(extra?.allocated_notable ? [extra.allocated_notable] : []),
    ...(extra?.allocated_notables ?? []),
  ];
  return rows.flatMap((row) => {
    const nameEn = row.name_en ?? "";
    const nameZh = row.name_zh ?? "";
    if (!nameEn && !nameZh) return [];
    return [{ nameEn, nameZh, mods: modsOf(row.mods) }];
  });
}

function socketsOf(item: RawItem): MemorialSocket[] {
  return (item.socketed_items ?? []).map((row) => ({
    nameEn: row.name_en ?? "",
    nameZh: row.name_zh ?? "",
    baseEn: row.base_en ?? "",
    baseZh: row.base_zh ?? "",
    rarity: row.rarity ?? "",
    mods: modsOf(row.explicit_affixes),
    tooltipEn: row.tooltip_en ?? "",
    tooltipZh: row.tooltip_zh ?? "",
    imageUrl: artFor(row.name_en ?? "", row.base_en ?? "", row.rarity === "rare" ? "rare" : row.rarity === "unique" ? "unique" : ""),
  }));
}

const itemClassToSlot: Record<string, string> = { "Body Armour": "body", "Helmet": "helmet" };
const knownBasePools: Record<string, string> = {
  "Ancestral Tiara": "int",
  "Sekhema Sandals": "int",
};

function verifyTiers(item: RawItem, mods: MemorialMod[]): MemorialMod[] {
  if (item.rarity !== "rare" || !item.item_class_en) return mods;
  const slot = craftingSlots().find((row) => row.id === (itemClassToSlot[item.item_class_en ?? ""] ?? item.item_class_en?.toLowerCase()) ||
    row.labelEn?.toLowerCase() === item.item_class_en?.toLowerCase());
  if (!slot) return mods;
  const pools = isEarlyGearSlotId(slot.id) ? earlyGearCatalog.byCategory[slot.id] : weaponCatalog.byCategory[slot.id];
  if (!pools) return mods;
  const knownPool = knownBasePools[item.base_en ?? ""];
  const candidates = knownPool && pools[knownPool] ? [pools[knownPool]] : Object.values(pools);
  return mods.map((mod) => {
    if (!["explicit", "fractured", "crafted"].includes(mod.kind)) return mod;
    const matched = recognizeMemorialModifier(mod, candidates, item.item_level ?? null, mod.generation);
    return { ...mod, ...matched, verifiedTier: mod.kind === "crafted" ? undefined : matched.verifiedTier };
  });
}

export function memorialGearFromRaw(item: RawItem): MemorialGear | null {
  if (item.status === "empty" || !item.name_en) return null;
  const rarity = item.rarity === "unique" || item.rarity === "rare" || item.rarity === "magic" ? item.rarity : "";
  const quality = splitPair(item.quality);
  const requirements = splitPair(item.requirements);
  const mods = [
    ...modsOf(item.implicit_mods),
    ...modsOf(item.other_visible_text?.enchanted),
    ...modsOf(item.other_visible_text?.enchanted_from_sockets).map((mod) => ({ ...mod, kind: "socket" })),
    ...modsOf(item.explicit_affixes),
  ];
  if (item.corrupted_text_en || item.corrupted_text_zh) {
    mods.push({
      kind: "corrupted",
      textEn: item.corrupted_text_en ?? "",
      textZh: item.corrupted_text_zh ?? "",
    });
  }
  return {
    nameEn: item.name_en,
    nameZh: item.name_zh ?? "",
    baseEn: item.base_en ?? "",
    baseZh: item.base_zh ?? "",
    imageUrl: artFor(item.name_en, item.base_en ?? "", rarity),
    rarity,
    qualityEn: quality.en,
    qualityZh: quality.zh || quality.en,
    itemLevel: item.item_level ?? null,
    requirementsEn: requirements.en,
    requirementsZh: requirements.zh,
    stats: statsOf(item.stats_shown),
    mods: verifyTiers(item, mods),
    sockets: socketsOf(item),
    notables: notablesOf(item),
    flavourEn: item.flavour_en ?? "",
    flavourZh: item.flavour_zh ?? "",
    mirroredEn: item.other_visible_text?.mirrored?.text_en ?? "",
    mirroredZh: item.other_visible_text?.mirrored?.text_zh ?? "",
    corruptedEn: item.corrupted_text_en ?? "",
    corruptedZh: item.corrupted_text_zh ?? "",
    tooltipEn: item.tooltip_en ?? "",
    tooltipZh: item.tooltip_zh ?? "",
    implicits: modsOf(item.implicit_mods).map((mod) => ({ textEn: mod.textEn, textZh: mod.textZh })),
    affixes: [],
  };
}

type SnapshotFile = {
  character: {
    name: string;
    class_en: string;
    class_zh: string;
    level: number;
    league: string;
    league_zh: string;
  };
  sources: { english_url: string };
  slots: Record<string, RawItem> & {
    charms?: { items_left_to_right?: RawItem[] };
  };
  base_jewels: { items: RawItem[] };
};

const file = snapshot as SnapshotFile;

export const RUO_CETACEA_META = {
  name: file.character.name,
  classEn: file.character.class_en,
  classZh: file.character.class_zh,
  level: file.character.level,
  leagueEn: file.character.league,
  leagueZh: file.character.league_zh,
  ninjaUrl: file.sources.english_url,
};

export function ruoaCetaceaMemorial(): Partial<Record<PaperDollSlotId, MemorialGear>> {
  const memorial: Partial<Record<PaperDollSlotId, MemorialGear>> = {};
  for (const [key, slotId] of Object.entries(SLOT_KEYS)) {
    const gear = memorialGearFromRaw(file.slots[key] ?? {});
    if (gear) memorial[slotId] = gear;
  }
  const charms = file.slots.charms?.items_left_to_right ?? [];
  (["charm-1", "charm-2", "charm-3"] as const).forEach((slotId, index) => {
    const gear = charms[index] ? memorialGearFromRaw(charms[index]) : null;
    if (gear) memorial[slotId] = gear;
  });
  file.base_jewels.items.forEach((item, index) => {
    const gear = memorialGearFromRaw(item);
    const slotId = `jewel-${index + 1}` as PaperDollSlotId;
    if (gear) memorial[slotId] = gear;
  });
  return memorial;
}
