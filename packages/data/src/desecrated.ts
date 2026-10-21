import type { AffixFamily, CraftSlotId } from "./types.ts";
import desecratedJson from "../generated/desecrated.json";

/**
 * 褻瀆詞綴 from poe2db ModsView `desecrated` (keyword Abyssalify).
 * Separate from normal affixes and from socket-unlocked pools such as `soul`.
 */
type DesecratedCatalog = {
  source: string;
  labelZh: string;
  labelEn: string;
  bySlot: Partial<Record<CraftSlotId, AffixFamily[]>>;
};

const CATALOG = desecratedJson as DesecratedCatalog;

export const DESECRATED_POOL_LABEL = {
  zhHant: CATALOG.labelZh,
  en: CATALOG.labelEn,
} as const;

export function desecratedFamiliesFor(slotId: CraftSlotId): AffixFamily[] {
  return CATALOG.bySlot[slotId] ?? [];
}
