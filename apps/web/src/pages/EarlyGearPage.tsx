import { useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  earlyGearFamiliesFor,
  earlyGearSlotMeta,
  earlyGearSlots,
  earlyGearSourcePath,
  harvestTags,
  isEarlyGearSlotId,
  poolLabel,
  type EarlyGearSlotId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";
import { useLocale } from "../i18n.tsx";

const SLOTS = earlyGearSlots();
const DEFAULT_SLOT: EarlyGearSlotId = "body";

export default function EarlyGearPage() {
  const { locale, t } = useLocale();
  const [params, setParams] = useSearchParams();
  const rawSlot = params.get("slot") || DEFAULT_SLOT;
  const slotId: EarlyGearSlotId = isEarlyGearSlotId(rawSlot) ? rawSlot : DEFAULT_SLOT;
  const slot = earlyGearSlotMeta(slotId);

  const families = useMemo(() => earlyGearFamiliesFor(slotId), [slotId]);
  const tierCount = families.reduce((sum, family) => sum + family.tiers.length, 0);

  function setSlot(id: EarlyGearSlotId) {
    setParams({ slot: id });
  }

  return (
    <div>
      <div className="mb-4">
        <p className="mb-2 text-sm text-gold">{t.earlyGearSlotHeading}</p>
        <p className="mb-3 text-xs text-muted">{t.earlyGearSlotHint}</p>
        <div className="flex flex-wrap gap-1.5" role="listbox" aria-label={t.earlyGearSlotAria}>
          {SLOTS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={slotId === item.id}
              onClick={() => setSlot(item.id)}
              className={`rounded-sm border px-3 py-2 text-sm font-medium ${
                slotId === item.id
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {poolLabel(item, locale)}
            </button>
          ))}
        </div>
      </div>

      <ChroniclesModBuilder
        key={slotId}
        kicker="CHRONICLES · EARLY GEAR"
        title={t.earlyGearTitle(slot ? poolLabel(slot, locale) : t.earlyGear)}
        description={t.earlyGearDesc}
        statsNote={t.statsFamilies(families.length, tierCount)}
        sourceNote={t.sourcePoe2db(slot ? earlyGearSourcePath(slot) : "")}
        harvestTags={harvestTags}
        families={families}
        importHint={t.earlyGearImportHint}
      />
      {/* Task 2 (out of scope): chapter recommended presets can pass defaultPicks into ChroniclesModBuilder. */}
    </div>
  );
}

/** Old /early/shields lab URL — major-slot UI only, no attribute-family chrome. */
export function EarlyGearShieldsRedirect() {
  return <Navigate to="/early/gear?slot=shield" replace />;
}
