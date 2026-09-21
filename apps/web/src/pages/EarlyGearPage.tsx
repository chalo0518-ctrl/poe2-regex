import { useMemo } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  earlyGearCatalog,
  earlyGearFamiliesFor,
  earlyGearSlotMeta,
  earlyGearSlots,
  harvestTags,
  isEarlyGearSlotId,
  poolLabel,
  type EarlyGearSlotId,
} from "@poe2-regex/data";
import { ChroniclesModBuilder } from "../components/ChroniclesModBuilder.tsx";
import { useLocale } from "../i18n.tsx";

const SLOTS = earlyGearSlots();
const DEFAULT_SLOT: EarlyGearSlotId = "body";

function firstPoolId(slotId: EarlyGearSlotId): string {
  return earlyGearSlotMeta(slotId)?.pools[0]?.id ?? "";
}

export default function EarlyGearPage() {
  const { locale, t } = useLocale();
  const [params, setParams] = useSearchParams();
  const rawSlot = params.get("slot") || DEFAULT_SLOT;
  const slotId: EarlyGearSlotId = isEarlyGearSlotId(rawSlot) ? rawSlot : DEFAULT_SLOT;
  const slot = earlyGearSlotMeta(slotId);
  const rawPool = params.get("pool") || "";
  const poolId =
    slot?.pools.some((pool) => pool.id === rawPool) ? rawPool : firstPoolId(slotId);
  const pool = slot?.pools.find((item) => item.id === poolId);

  const families = useMemo(
    () => (slotId && poolId ? earlyGearFamiliesFor(slotId, poolId) : []),
    [slotId, poolId],
  );

  const count =
    slotId === "shield"
      ? {
          families: families.length,
          tiers: families.reduce((sum, family) => sum + family.tiers.length, 0),
        }
      : earlyGearCatalog.counts[slotId]?.[poolId];

  function setSlot(id: EarlyGearSlotId) {
    setParams({ slot: id, pool: firstPoolId(id) });
  }

  function setPool(id: string) {
    setParams({ slot: slotId, pool: id });
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
              className={`rounded-sm border px-2.5 py-1.5 text-sm ${
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
        key={`${slotId}:${poolId}`}
        kicker="CHRONICLES · EARLY GEAR"
        title={t.earlyGearTitle(slot ? poolLabel(slot, locale) : t.earlyGear)}
        description={t.earlyGearDesc}
        statsNote={t.statsFamilies(count?.families ?? families.length, count?.tiers ?? 0)}
        sourceNote={t.sourcePoe2db(pool?.path || slot?.path || "")}
        harvestTags={harvestTags}
        families={families}
        pools={slot && slot.pools.length > 1 ? slot.pools : undefined}
        pool={poolId}
        onPoolChange={setPool}
        poolAriaLabel={t.earlyGearPoolAria}
        importHint={t.earlyGearImportHint}
      />
      {/* Task 2 (out of scope): chapter recommended presets can pass defaultPicks into ChroniclesModBuilder. */}
    </div>
  );
}

/** Old /early/shields lab URL. */
export function EarlyGearShieldsRedirect() {
  return <Navigate to="/early/gear?slot=shield" replace />;
}
