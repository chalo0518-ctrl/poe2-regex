import type { AffixFamily, CraftSlotId, EarlyGearCatalog, PoolMeta, WeaponCategoryId } from "./types.ts";
import weaponsJson from "../generated/weapons.json";
import {
  earlyGearFamiliesFor,
  earlyGearSlots,
  earlyGearSourcePath,
  isEarlyGearSlotId,
  unionAffixLists,
  type EarlyGearSlot,
} from "./earlyGear.ts";

export const weaponCatalog = weaponsJson as EarlyGearCatalog;

/**
 * Crafting picker order. One-handed maces are the early-gear scrape;
 * every other class comes from weapons.json. No str/dex/int split.
 */
const WEAPON_SLOT_ORDER = [
  "claw",
  "dagger",
  "sword1h",
  "axe1h",
  "mace1h",
  "sceptre",
  "wand",
  "bow",
  "crossbow",
  "staff",
  "sword2h",
  "axe2h",
  "mace2h",
  "spear",
  "quarterstaff",
  "flail",
  "trap",
] as const satisfies readonly CraftSlotId[];

export type CraftSlot = PoolMeta<CraftSlotId> & {
  pools: PoolMeta[];
};

function weaponSlot(categoryId: WeaponCategoryId): CraftSlot | undefined {
  const category = weaponCatalog.categories.find((row) => row.id === (categoryId as string));
  if (!category) return undefined;
  return {
    id: category.id as WeaponCategoryId,
    labelZh: category.labelZh,
    labelEn: category.labelEn,
    path: category.path,
    pools: category.pools,
  };
}

/** Armour, jewellery, and shield, then one button per weapon class. */
export function craftingSlots(): CraftSlot[] {
  const gear = earlyGearSlots();
  const weapons = WEAPON_SLOT_ORDER.map((id) => {
    if (id === "mace1h") return gear.find((slot) => slot.id === "mace1h");
    return weaponSlot(id);
  }).filter((slot): slot is CraftSlot => Boolean(slot));
  return [...gear.filter((slot) => slot.id !== "mace1h"), ...weapons];
}

export function isWeaponCategoryId(id: string): id is WeaponCategoryId {
  return weaponCatalog.categories.some((category) => category.id === id);
}

export function isCraftSlotId(id: string): id is CraftSlotId {
  return isEarlyGearSlotId(id) || isWeaponCategoryId(id);
}

export function craftingFamiliesFor(slotId: CraftSlotId): AffixFamily[] {
  if (isEarlyGearSlotId(slotId)) return earlyGearFamiliesFor(slotId);
  const byPool = weaponCatalog.byCategory[slotId] ?? {};
  return unionAffixLists(slotId, Object.values(byPool) as AffixFamily[][]);
}

export function craftingSlotMeta(slotId: CraftSlotId): CraftSlot | undefined {
  return craftingSlots().find((slot) => slot.id === slotId);
}

export function craftingSourcePath(slot: CraftSlot | EarlyGearSlot): string {
  return earlyGearSourcePath(slot);
}
