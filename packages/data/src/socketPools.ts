import type { AffixFamily, CraftSlotId } from "./types.ts";
import poolsJson from "../generated/socket-pools.json";

/**
 * Augments that change how many affixes can roll, or unlock an extra mod pool.
 * Names and modifier tables are the poe2db item pages (zh-TW and EN).
 * Count bonuses: 瑟雷的凱旋 adds one suffix; 阿斯垂德的創造 adds one crafted mod.
 */
export type SocketPoolAugment = {
  id: string;
  nameZh: string;
  nameEn: string;
  socketBound: boolean;
  limitOne: boolean;
  slots: CraftSlotId[];
  effectZh: string;
  effectEn: string;
  prefixBonus: number;
  suffixBonus: number;
  craftedBonus: number;
  families: AffixFamily[];
};

const AUGMENTS = (poolsJson as { augments: SocketPoolAugment[] }).augments;
const BY_ID = new Map(AUGMENTS.map((row) => [row.id, row]));

export const BASE_SIDE_CAP = 3;
export const BASE_CRAFTED_CAP = 1;

export function poolAugmentById(id: string): SocketPoolAugment | undefined {
  return BY_ID.get(id);
}

export function poolAugmentsForSlot(slot: CraftSlotId): SocketPoolAugment[] {
  return AUGMENTS.filter((row) => row.slots.includes(slot));
}

export function socketSideCaps(ids: readonly string[]): { prefix: number; suffix: number; crafted: number } {
  const seen = new Set<string>();
  let prefix = 0;
  let suffix = 0;
  let crafted = 0;
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const row = BY_ID.get(id);
    if (!row) continue;
    prefix += row.prefixBonus;
    suffix += row.suffixBonus;
    crafted += row.craftedBonus;
  }
  return {
    prefix: BASE_SIDE_CAP + prefix,
    suffix: BASE_SIDE_CAP + suffix,
    crafted: BASE_CRAFTED_CAP + crafted,
  };
}

export function familiesForSocketAugments(ids: readonly string[]): AffixFamily[] {
  const seen = new Set<string>();
  const families: AffixFamily[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const row = BY_ID.get(id);
    if (!row) continue;
    families.push(...row.families);
  }
  return families;
}
