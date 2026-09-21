import type {
  AffixFamily,
  AffixTier,
  DataMeta,
  EarlyGearCatalog,
  EarlyGearCategoryId,
  EarlyGearFamily,
  EarlyGearSlotId,
  PoolMeta,
  ShieldFamily,
} from "./types.ts";
import earlyGearJson from "../generated/early-gear.json";
import shieldsJson from "../generated/shields.json";
import metaJson from "../generated/meta.json";

export const earlyGearCatalog = earlyGearJson as EarlyGearCatalog;

const shieldFamilies = shieldsJson as ShieldFamily[];
const dataMeta = metaJson as DataMeta;

export type EarlyGearSlot = PoolMeta<EarlyGearSlotId> & {
  /** Scrape pages only — UI does not pick among these. */
  pools: PoolMeta[];
};

const SHIELD_SLOT: EarlyGearSlot = {
  id: "shield",
  labelZh: "盾牌",
  labelEn: "Shield",
  path: "Shields_str",
  pools: dataMeta.bases,
};

function unionKey(family: AffixFamily): string {
  return `${family.generation}|${family.family}|${family.matchZh}|${family.match}`;
}

function mergeNumeric(
  a: AffixFamily["numeric"],
  b: AffixFamily["numeric"],
): AffixFamily["numeric"] {
  if (!a && !b) return undefined;
  const format = a?.format || b?.format;
  if (!format) return undefined;
  const out: NonNullable<AffixFamily["numeric"]> = { format };
  for (const src of [a, b]) {
    if (!src) continue;
    if (src.suggestedMin != null) {
      out.suggestedMin =
        out.suggestedMin == null ? src.suggestedMin : Math.min(out.suggestedMin, src.suggestedMin);
    }
    if (src.suggestedMax != null) {
      out.suggestedMax =
        out.suggestedMax == null ? src.suggestedMax : Math.max(out.suggestedMax, src.suggestedMax);
    }
  }
  return out;
}

function mergeTiers(a: AffixTier[], b: AffixTier[]): AffixTier[] {
  const seen = new Set(a.map((tier) => `${tier.level}|${tier.nameZh}|${tier.textZh}`));
  const tiers = [...a];
  for (const tier of b) {
    const key = `${tier.level}|${tier.nameZh}|${tier.textZh}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tiers.push(tier);
  }
  tiers.sort((left, right) => left.level - right.level || left.nameZh.localeCompare(right.nameZh, "zh-Hant"));
  return tiers;
}

/** Union scrape pages for one slot. Same match text merges; 護甲/閃避/ES stay separate rows. */
export function unionAffixLists(slotId: EarlyGearSlotId, lists: AffixFamily[][]): AffixFamily[] {
  const merged = new Map<string, AffixFamily>();
  for (const list of lists) {
    for (const row of list) {
      const key = unionKey(row);
      const prev = merged.get(key);
      if (!prev) {
        merged.set(key, {
          ...row,
          id: `gear:${slotId}|${row.family}|${row.generation}|${row.matchZh}`,
        });
        continue;
      }
      const tiers = mergeTiers(prev.tiers, row.tiers);
      const tagsZh = [...prev.tagsZh];
      for (const label of row.tagsZh) {
        if (!tagsZh.includes(label)) tagsZh.push(label);
      }
      merged.set(key, {
        ...prev,
        tags: [...new Set([...prev.tags, ...row.tags])],
        tagsZh,
        kind: prev.kind === "numeric" || row.kind === "numeric" ? "numeric" : prev.kind,
        numeric: mergeNumeric(prev.numeric, row.numeric),
        tiers,
        minLevel: tiers[0]?.level ?? prev.minLevel,
        maxLevel: tiers[tiers.length - 1]?.level ?? prev.maxLevel,
        tierCount: tiers.length,
        weight: tiers.reduce((sum, tier) => sum + (tier.dropChance || 0), 0),
      });
    }
  }
  return [...merged.values()].sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });
}

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

/** One combined affix list per major slot. No attribute-archetype split. */
export function earlyGearFamiliesFor(
  slotId: EarlyGearSlotId,
  catalog: EarlyGearCatalog = earlyGearCatalog,
): AffixFamily[] {
  if (slotId === "shield") {
    return unionAffixLists("shield", [shieldFamilies]);
  }
  const byPool = catalog.byCategory[slotId] ?? {};
  return unionAffixLists(slotId, Object.values(byPool) as EarlyGearFamily[][]);
}

export function earlyGearSlotMeta(
  slotId: EarlyGearSlotId,
  catalog: EarlyGearCatalog = earlyGearCatalog,
): EarlyGearSlot | undefined {
  return earlyGearSlots(catalog).find((slot) => slot.id === slotId);
}

export function earlyGearSourcePath(slot: EarlyGearSlot): string {
  if (slot.pools.length <= 1) return slot.path;
  const prefix = slot.pools[0]?.path.replace(/_(str|dex|int|str_dex|str_int|dex_int|buckler)$/i, "") || slot.path;
  return `${prefix}_*`;
}
