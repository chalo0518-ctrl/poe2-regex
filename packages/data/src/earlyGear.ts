import type {
  AffixFamily,
  DataMeta,
  EarlyGearCatalog,
  EarlyGearCategoryId,
  EarlyGearFamily,
  EarlyGearSlotId,
  PoolMeta,
  ShieldBaseId,
  ShieldFamily,
} from "./types.ts";
import earlyGearJson from "../generated/early-gear.json";
import shieldsJson from "../generated/shields.json";
import metaJson from "../generated/meta.json";

export const earlyGearCatalog = earlyGearJson as EarlyGearCatalog;

const shieldFamilies = shieldsJson as ShieldFamily[];
const dataMeta = metaJson as DataMeta;

export type EarlyGearSlot = PoolMeta<EarlyGearSlotId> & {
  pools: PoolMeta[];
};

const SHIELD_SLOT: EarlyGearSlot = {
  id: "shield",
  labelZh: "盾牌",
  labelEn: "Shield",
  path: "Shields_str",
  pools: dataMeta.bases,
};

/** Slot picker: scraped early-gear categories plus the existing shield lab. */
export function earlyGearSlots(catalog: EarlyGearCatalog = earlyGearCatalog): EarlyGearSlot[] {
  const scraped: EarlyGearSlot[] = catalog.categories.map((category) => ({
    id: category.id,
    labelZh: category.labelZh,
    labelEn: category.labelEn,
    path: category.path,
    pools: category.pools,
  }));
  return [...scraped, SHIELD_SLOT];
}

export function isEarlyGearCategoryId(id: string, catalog: EarlyGearCatalog = earlyGearCatalog): id is EarlyGearCategoryId {
  return catalog.categories.some((category) => category.id === id);
}

export function isEarlyGearSlotId(id: string, catalog: EarlyGearCatalog = earlyGearCatalog): id is EarlyGearSlotId {
  return id === "shield" || isEarlyGearCategoryId(id, catalog);
}

export function earlyGearFamiliesFor(
  slotId: EarlyGearSlotId,
  poolId: string,
  catalog: EarlyGearCatalog = earlyGearCatalog,
): AffixFamily[] {
  if (slotId === "shield") {
    return shieldFamilies.filter((family) => family.bases.includes(poolId as ShieldBaseId));
  }
  const list: EarlyGearFamily[] = catalog.byCategory[slotId]?.[poolId] ?? [];
  return list;
}

export function earlyGearSlotMeta(
  slotId: EarlyGearSlotId,
  catalog: EarlyGearCatalog = earlyGearCatalog,
): EarlyGearSlot | undefined {
  return earlyGearSlots(catalog).find((slot) => slot.id === slotId);
}
