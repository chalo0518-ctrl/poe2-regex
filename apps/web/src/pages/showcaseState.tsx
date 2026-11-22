import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  affixModGroup,
  catalogForDollSlot,
  craftTierChoices,
  paperDollSlots,
  recommendedGear,
  setShowcasePick,
  type AffixFamily,
  type BdShowcase,
  type PaperDollSlotId,
  type ShowcasePick,
  type ShowcaseRank,
  type RecommendedGear,
} from "@poe2-regex/data";

type ShowcaseContextValue = {
  snapshot: BdShowcase;
  weaponSet: 1 | 2;
  setWeaponSet: (set: 1 | 2) => void;
  setBase: (slot: PaperDollSlotId, gear: RecommendedGear) => void;
  setTier: (slot: PaperDollSlotId, familyId: string, rank: number | null) => void;
  tiers: TierSelections;
  picks: Record<PaperDollSlotId, ShowcasePick[]>;
  toggleRank: (slotId: PaperDollSlotId, family: AffixFamily, rank: ShowcaseRank) => void;
};

type TierSelections = Partial<Record<PaperDollSlotId, Record<string, number | null>>>;
type Bases = BdShowcase["recommended"];
type Saved = { picks: Partial<Record<PaperDollSlotId, ShowcasePick[]>>; tiers: TierSelections; bases: Bases };

function readProgress(key: string | undefined): Partial<Saved> {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

function initialPicks(snapshot: BdShowcase): Record<PaperDollSlotId, ShowcasePick[]> {
  const picks = {} as Record<PaperDollSlotId, ShowcasePick[]>;
  for (const slot of paperDollSlots) {
    picks[slot.id] = recommendedGear(snapshot, slot.id).affixes.map((pick) => ({ ...pick }));
  }
  return picks;
}

export function ShowcaseProvider({
  snapshot: original,
  storageKey,
  children,
}: {
  snapshot: BdShowcase;
  storageKey?: string;
  children: ReactNode;
}) {
  const [saved] = useState(() => readProgress(storageKey));
  const [bases, setBases] = useState<Bases>(saved.bases ?? {});
  const [picks, setPicks] = useState(() => ({ ...initialPicks(original), ...saved.picks }));
  const [tiers, setTiers] = useState<TierSelections>(saved.tiers ?? {});
  const [weaponSet, setWeaponSet] = useState<1 | 2>(1);
  const snapshot = useMemo(() => ({ ...original, recommended: { ...original.recommended, ...bases } }), [original, bases]);
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ bases, picks, tiers }));
    } catch {
      // The editor remains usable when browser storage is unavailable.
    }
  }, [storageKey, bases, picks, tiers]);

  function setBase(slot: PaperDollSlotId, gear: RecommendedGear) {
    const catalog = catalogForDollSlot(slot, gear);
    const compatible = (pick: ShowcasePick) => catalog.some((family) => family.id === pick.familyId &&
      (tiers[slot]?.[pick.familyId] == null || craftTierChoices(family).some((tier) => tier.rank === tiers[slot]?.[pick.familyId])));
    setPicks((previous) => ({ ...previous, [slot]: previous[slot].filter(compatible) }));
    setBases((previous) => ({ ...previous, [slot]: gear }));
  }

  function setTier(slot: PaperDollSlotId, familyId: string, rank: number | null) {
    setTiers((previous) => ({ ...previous, [slot]: { ...previous[slot], [familyId]: rank } }));
  }

  const toggleRank = useCallback((slotId: PaperDollSlotId, family: AffixFamily, rank: ShowcaseRank) => {
    setPicks((prev) => {
      const gear = recommendedGear(snapshot, slotId);
      const catalog = catalogForDollSlot(slotId, gear);
      const current = prev[slotId].find((pick) => pick.familyId === family.id);
      if (!current && prev[slotId].some((pick) => catalog.some((row) =>
        row.id === pick.familyId && affixModGroup(row) === affixModGroup(family)))) return prev;
      const next = current?.rank === rank ? null : rank;
      return {
        ...prev,
        [slotId]: setShowcasePick(prev[slotId], family, catalog, next),
      };
    });
  }, [snapshot]);

  const value = { snapshot, picks, toggleRank, tiers, setBase, setTier, weaponSet, setWeaponSet };
  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase(): ShowcaseContextValue {
  const value = useContext(ShowcaseContext);
  if (!value) throw new Error("useShowcase must be used inside ShowcaseProvider");
  return value;
}
