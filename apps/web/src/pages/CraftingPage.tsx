import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CRAFTING_CONSTRAINTS,
  CRAFTING_RULESET,
  CRAFTING_TREE,
  CRAFT_CLEANUP_TEXT,
  CRAFT_REASON_TEXT,
  CRAFT_WARNING_TEXT,
  craftLocaleText,
  craftVerdictHeadline,
  decideCraft,
  earlyGearFamiliesFor,
  earlyGearSlotMeta,
  earlyGearSlots,
  earlyGearSourcePath,
  effectText,
  isEarlyGearSlotId,
  poolLabel,
  suggestedCraftNode,
  topTierLevel,
  type CraftDecision,
  type CraftTreeNodeId,
  type EarlyGearSlotId,
  type ModSide,
} from "@poe2-regex/data";
import { ChroniclesModBuilder, type ModPickState } from "../components/ChroniclesModBuilder.tsx";
import { useLocale } from "../i18n.tsx";

const SLOTS = earlyGearSlots();
const DEFAULT_SLOT: EarlyGearSlotId = "body";

type OwnedFlag = { owned: boolean; highTier: boolean };

function parseLevel(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export default function CraftingPage() {
  const { locale, t } = useLocale();
  const [params, setParams] = useSearchParams();
  const rawSlot = params.get("slot") || DEFAULT_SLOT;
  const slotId: EarlyGearSlotId = isEarlyGearSlotId(rawSlot) ? rawSlot : DEFAULT_SLOT;
  const slot = earlyGearSlotMeta(slotId);
  const families = useMemo(() => earlyGearFamiliesFor(slotId), [slotId]);
  const tierCount = families.reduce((sum, family) => sum + family.tiers.length, 0);

  const [picks, setPicks] = useState<Record<string, ModPickState>>({});
  const [owned, setOwned] = useState<Record<string, OwnedFlag>>({});
  const [itemLevelRaw, setItemLevelRaw] = useState("");
  const [targetSide, setTargetSide] = useState<ModSide | "auto">("auto");
  const [prefixCount, setPrefixCount] = useState(0);
  const [suffixCount, setSuffixCount] = useState(0);
  const [goodFracture, setGoodFracture] = useState(false);
  const [garbageFracture, setGarbageFracture] = useState(false);
  const [hasDesecrated, setHasDesecrated] = useState(false);
  const [desecratedOnRoute, setDesecratedOnRoute] = useState(false);
  const [keeper, setKeeper] = useState(false);
  const [tightBudget, setTightBudget] = useState(false);
  const [openNode, setOpenNode] = useState<CraftTreeNodeId>("desecrate");

  const onPicksChange = useCallback((next: Record<string, ModPickState>) => {
    setPicks(next);
  }, []);

  useEffect(() => {
    setOwned({});
    setItemLevelRaw("");
    setPrefixCount(0);
    setSuffixCount(0);
    setGoodFracture(false);
    setGarbageFracture(false);
    setHasDesecrated(false);
    setDesecratedOnRoute(false);
    setKeeper(false);
  }, [slotId]);

  const selected = useMemo(
    () => families.filter((family) => {
      const polarity = picks[family.id]?.polarity;
      return polarity === "include" || polarity === "or";
    }),
    [families, picks],
  );

  const decision = useMemo(() => {
    const toTarget = (family: (typeof families)[number]) => ({
      id: family.id,
      generation: family.generation,
      t1Level: topTierLevel(family),
    });
    return decideCraft({
      includes: selected.filter((family) => picks[family.id]?.polarity === "include").map(toTarget),
      ors: selected.filter((family) => picks[family.id]?.polarity === "or").map(toTarget),
      itemLevel: parseLevel(itemLevelRaw),
      owned: selected
        .filter((family) => owned[family.id]?.owned)
        .map((family) => ({
          id: family.id,
          generation: family.generation,
          highTier: owned[family.id]?.highTier !== false,
        })),
      prefixCount,
      suffixCount,
      targetSide,
      garbageFracture,
      hasGoodFractureOnTargetSide: goodFracture,
      hasDesecrated,
      desecratedOnRoute,
      craftedSlotLockedToKeeper: keeper,
      tightBudget,
    });
  }, [
    selected,
    picks,
    itemLevelRaw,
    owned,
    prefixCount,
    suffixCount,
    targetSide,
    garbageFracture,
    goodFracture,
    hasDesecrated,
    desecratedOnRoute,
    keeper,
    tightBudget,
  ]);

  const related = suggestedCraftNode(decision);
  const sideLabel = decision.targetSide === "prefix" ? t.craftingSidePrefix : t.craftingSideSuffix;

  function setSlot(id: EarlyGearSlotId) {
    setParams({ slot: id });
  }

  function toggleOwned(id: string) {
    setOwned((prev) => {
      if (prev[id]?.owned) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { owned: true, highTier: true } };
    });
  }

  return (
    <div>
      <section className="mb-5 rounded-sm border border-line bg-panel px-4 py-3" aria-label={t.craftingConstraintsLabel}>
        <p className="text-xs tracking-[0.18em] text-gold-dim">
          {t.craftingConstraintsLabel}
          <span className="ml-2 font-mono normal-case tracking-normal">{CRAFTING_RULESET.id}</span>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-paper">
          {CRAFTING_CONSTRAINTS.map((line) => (
            <li key={line.zhHant}>{craftLocaleText(line, locale)}</li>
          ))}
        </ul>
      </section>

      <div className="mb-5">
        <p className="mb-2 text-sm text-gold">{t.craftingSlotHeading}</p>
        <p className="mb-3 text-xs text-muted">{t.craftingSlotHint}</p>
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ChroniclesModBuilder
          key={slotId}
          kicker="CRAFTING · TARGETS"
          title={t.craftingTargetsTitle}
          description={t.craftingTargetsDesc}
          statsNote={t.statsFamilies(families.length, tierCount)}
          sourceNote={t.sourcePoe2db(slot ? earlyGearSourcePath(slot) : "")}
          families={families}
          showTags={false}
          showFilter
          showImport={false}
          showHideToggle={false}
          showFamilyNames={false}
          showAffixTags={false}
          dockRegex={false}
          regexCaption={t.craftingRegexCaption}
          onPicksChange={onPicksChange}
        />

        <aside className="space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
          <section aria-labelledby="craft-tree-heading">
            <h2 id="craft-tree-heading" className="text-sm font-medium text-gold">{t.craftingTreeHeading}</h2>
            <p className="mt-1 mb-3 text-xs text-muted">{t.craftingTreeHint}</p>
            <ol className="space-y-2">
              {CRAFTING_TREE.map((node, index) => {
                const open = openNode === node.id;
                return (
                  <li key={node.id} className="rounded-sm border border-line bg-panel">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenNode(node.id)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left"
                    >
                      <span className="mt-0.5 font-mono text-xs text-gold-dim">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gold">{craftLocaleText(node.title, locale)}</span>
                          {related === node.id && (
                            <span className="rounded-sm bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">
                              {t.craftingNodeRelated}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{craftLocaleText(node.summary, locale)}</span>
                      </span>
                      <span className="text-xs text-muted" aria-hidden="true">{open ? "▴" : "▾"}</span>
                    </button>
                    {open && (
                      <div className="space-y-2 border-t border-line px-3 py-3 text-xs leading-relaxed text-paper">
                        <NodeBlock label={t.craftingSectionAction} body={craftLocaleText(node.action, locale)} />
                        <NodeBlock label={t.craftingSectionSkip} body={craftLocaleText(node.skip, locale)} />
                        <NodeBlock label={t.craftingSectionIrreversible} body={craftLocaleText(node.irreversible, locale)} />
                        <NodeBlock label={t.craftingSectionWarning} body={craftLocaleText(node.warning, locale)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <ItemPanel
            decision={decision}
            sideLabel={sideLabel}
            itemLevelRaw={itemLevelRaw}
            onItemLevel={setItemLevelRaw}
            targetSide={targetSide}
            onTargetSide={setTargetSide}
            prefixCount={prefixCount}
            suffixCount={suffixCount}
            onPrefixCount={setPrefixCount}
            onSuffixCount={setSuffixCount}
            goodFracture={goodFracture}
            garbageFracture={garbageFracture}
            onGoodFracture={(next) => {
              setGoodFracture(next);
              if (next) setGarbageFracture(false);
            }}
            onGarbageFracture={(next) => {
              setGarbageFracture(next);
              if (next) setGoodFracture(false);
            }}
            hasDesecrated={hasDesecrated}
            desecratedOnRoute={desecratedOnRoute}
            onDesecrated={setHasDesecrated}
            onDesecratedOnRoute={setDesecratedOnRoute}
            keeper={keeper}
            onKeeper={setKeeper}
            tightBudget={tightBudget}
            onTightBudget={setTightBudget}
            selected={selected.map((family) => ({
              id: family.id,
              polarity: picks[family.id]?.polarity === "or" ? "or" : "include",
              label: effectText(family, locale),
              owned: Boolean(owned[family.id]?.owned),
              highTier: owned[family.id]?.highTier !== false,
            }))}
            onToggleOwned={toggleOwned}
            onToggleHigh={(id) => {
              setOwned((prev) => prev[id]?.owned
                ? { ...prev, [id]: { owned: true, highTier: !prev[id].highTier } }
                : prev);
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function NodeBlock({ label, body }: { label: string; body: string }) {
  return (
    <p>
      <span className="text-gold-dim">{label} · </span>
      {body}
    </p>
  );
}

function ItemPanel({
  decision,
  sideLabel,
  itemLevelRaw,
  onItemLevel,
  targetSide,
  onTargetSide,
  prefixCount,
  suffixCount,
  onPrefixCount,
  onSuffixCount,
  goodFracture,
  garbageFracture,
  onGoodFracture,
  onGarbageFracture,
  hasDesecrated,
  desecratedOnRoute,
  onDesecrated,
  onDesecratedOnRoute,
  keeper,
  onKeeper,
  tightBudget,
  onTightBudget,
  selected,
  onToggleOwned,
  onToggleHigh,
}: {
  decision: CraftDecision;
  sideLabel: string;
  itemLevelRaw: string;
  onItemLevel: (value: string) => void;
  targetSide: ModSide | "auto";
  onTargetSide: (value: ModSide | "auto") => void;
  prefixCount: number;
  suffixCount: number;
  onPrefixCount: (value: number) => void;
  onSuffixCount: (value: number) => void;
  goodFracture: boolean;
  garbageFracture: boolean;
  onGoodFracture: (value: boolean) => void;
  onGarbageFracture: (value: boolean) => void;
  hasDesecrated: boolean;
  desecratedOnRoute: boolean;
  onDesecrated: (value: boolean) => void;
  onDesecratedOnRoute: (value: boolean) => void;
  keeper: boolean;
  onKeeper: (value: boolean) => void;
  tightBudget: boolean;
  onTightBudget: (value: boolean) => void;
  selected: { id: string; polarity: "include" | "or"; label: string; owned: boolean; highTier: boolean }[];
  onToggleOwned: (id: string) => void;
  onToggleHigh: (id: string) => void;
}) {
  const { locale, t } = useLocale();
  const headline = craftVerdictHeadline(decision, locale);
  const tone =
    decision.verdict === "continue"
      ? "border-include text-include"
      : decision.verdict === "rebase"
        ? "border-exclude text-exclude"
        : "border-gold text-gold";
  const cleanup = decision.cleanup === "none" ? null : CRAFT_CLEANUP_TEXT[decision.cleanup];

  return (
    <section className="rounded-sm border border-line bg-panel p-3" aria-labelledby="craft-now-heading">
      <h2 id="craft-now-heading" className="text-sm font-medium text-gold">{t.craftingNowHeading}</h2>
      <p className="mt-1 text-xs text-muted">{t.craftingNowHint}</p>

      <div className={`mt-3 rounded-sm border px-3 py-3 ${tone}`} data-verdict={decision.verdict} aria-live="polite">
        <p className="text-base font-bold">{headline}</p>
        <p className="mt-1 text-xs text-muted">{t.craftingResolvedSide(sideLabel)}</p>
        {cleanup && <p className="mt-2 text-xs text-paper">{craftLocaleText(cleanup, locale)}</p>}
        <p className="mt-3 text-xs text-gold-dim">{t.craftingReasons}</p>
        <ul className="mt-1 space-y-1 text-xs text-paper">
          {decision.reasons.map((reason) => (
            <li key={reason}>{craftLocaleText(CRAFT_REASON_TEXT[reason], locale)}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gold-dim">{t.craftingWarnings}</p>
        <ul className="mt-1 space-y-1 text-xs text-muted">
          {decision.warnings.map((warning) => (
            <li key={warning}>{craftLocaleText(CRAFT_WARNING_TEXT[warning], locale)}</li>
          ))}
        </ul>
        {tightBudget && <p className="mt-2 text-xs text-gold">{t.craftingBudgetOn}</p>}
      </div>

      <div className="mt-3 grid gap-2">
        <label className="text-xs text-muted">
          {t.craftingItemLevel}
          <input
            inputMode="numeric"
            value={itemLevelRaw}
            onChange={(event) => onItemLevel(event.target.value)}
            placeholder={t.craftingItemLevelHint}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          />
        </label>
        <label className="text-xs text-muted">
          {t.craftingSide}
          <select
            value={targetSide}
            onChange={(event) => onTargetSide(event.target.value as ModSide | "auto")}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          >
            <option value="auto">{t.craftingSideAuto}</option>
            <option value="prefix">{t.craftingSidePrefix}</option>
            <option value="suffix">{t.craftingSideSuffix}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <CountSelect label={t.craftingPrefixCount} value={prefixCount} onChange={onPrefixCount} />
          <CountSelect label={t.craftingSuffixCount} value={suffixCount} onChange={onSuffixCount} />
        </div>
        <Check label={t.craftingGoodFracture} checked={goodFracture} onChange={onGoodFracture} />
        <Check label={t.craftingGarbageFracture} checked={garbageFracture} onChange={onGarbageFracture} />
        <Check label={t.craftingDesecrated} checked={hasDesecrated} onChange={onDesecrated} />
        {hasDesecrated && (
          <div className="ml-5 space-y-1" role="radiogroup" aria-label={t.craftingDesecrated}>
            <Radio
              name="desecrated-route"
              label={t.craftingDesecratedMiss}
              checked={!desecratedOnRoute}
              onChange={() => onDesecratedOnRoute(false)}
            />
            <Radio
              name="desecrated-route"
              label={t.craftingDesecratedOnRoute}
              checked={desecratedOnRoute}
              onChange={() => onDesecratedOnRoute(true)}
            />
          </div>
        )}
        <Check label={t.craftingKeeper} checked={keeper} onChange={onKeeper} />
        <p className="ml-5 text-[11px] text-muted">{t.craftingKeeperHint}</p>
        <Check label={t.craftingBudget} checked={tightBudget} onChange={onTightBudget} />
      </div>

      <ul className="mt-3 space-y-2">
        {selected.length === 0 ? (
          <li className="text-xs text-muted">{t.craftingNoOwned}</li>
        ) : (
          selected.map((row) => (
            <li key={row.id} className="rounded-sm border border-line px-2 py-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={row.owned}
                  onChange={() => onToggleOwned(row.id)}
                  aria-label={`${row.label} ${t.craftingOwned}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-paper">{row.label}</p>
                  <p className="text-[11px] text-muted">{row.polarity === "include" ? t.polarityYes : t.polarityOr}</p>
                </div>
              </div>
              {row.owned && (
                <label className="mt-1 ml-5 flex items-center gap-2 text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={row.highTier}
                    onChange={() => onToggleHigh(row.id)}
                  />
                  {t.craftingHighTier}
                </label>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function CountSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
      >
        {[0, 1, 2, 3].map((count) => (
          <option key={count} value={count}>{count}</option>
        ))}
      </select>
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-xs text-paper">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Radio({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-paper">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
