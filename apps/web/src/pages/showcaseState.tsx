import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  catalogForDollSlot,
  paperDollSlots,
  recommendedGear,
  setShowcasePick,
  type AffixFamily,
  type BdShowcase,
  type PaperDollSlotId,
  type ShowcasePick,
  type ShowcaseRank,
} from "@poe2-regex/data";

type ShowcaseContextValue = {
  snapshot: BdShowcase;
  picks: Record<PaperDollSlotId, ShowcasePick[]>;
  toggleRank: (slotId: PaperDollSlotId, family: AffixFamily, rank: ShowcaseRank) => void;
};

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

function initialPicks(snapshot: BdShowcase): Record<PaperDollSlotId, ShowcasePick[]> {
  const picks = {} as Record<PaperDollSlotId, ShowcasePick[]>;
  for (const slot of paperDollSlots) {
    picks[slot.id] = recommendedGear(snapshot, slot.id).affixes.map((pick) => ({ ...pick }));
  }
  return picks;
}

export function ShowcaseProvider({
  snapshot,
  children,
}: {
  snapshot: BdShowcase;
  children: ReactNode;
}) {
  const [picks, setPicks] = useState(() => initialPicks(snapshot));

  const toggleRank = useCallback((slotId: PaperDollSlotId, family: AffixFamily, rank: ShowcaseRank) => {
    setPicks((prev) => {
      const gear = recommendedGear(snapshot, slotId);
      const catalog = catalogForDollSlot(slotId, gear);
      const current = prev[slotId].find((pick) => pick.familyId === family.id);
      const next = current?.rank === rank ? null : rank;
      return {
        ...prev,
        [slotId]: setShowcasePick(prev[slotId], family, catalog, next),
      };
    });
  }, [snapshot]);

  const value = useMemo(() => ({ snapshot, picks, toggleRank }), [snapshot, picks, toggleRank]);
  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

export function useShowcase(): ShowcaseContextValue {
  const value = useContext(ShowcaseContext);
  if (!value) throw new Error("useShowcase must be used inside ShowcaseProvider");
  return value;
}
