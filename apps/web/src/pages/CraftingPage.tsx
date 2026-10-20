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
  craftTierChoices,
  craftVerdictHeadline,
  decideCraft,
  earlyGearFamiliesFor,
  earlyGearSlotMeta,
  earlyGearSlots,
  earlyGearSourcePath,
  effectText,
  effectTextSecondary,
  isEarlyGearSlotId,
  matchLangForLocale,
  matchText,
  matchesText,
  poolLabel,
  suggestedCraftNode,
  tierEffect,
  type AffixFamily,
  type CraftDecision,
  type CraftTreeNodeId,
  type EarlyGearSlotId,
  type MatchLang,
  type ModSide,
} from "@poe2-regex/data";
import {
  buildRegex,
  inferNumericPlacement,
  MAX_LENGTH,
  type RegexMod,
} from "@poe2-regex/regex";
import { useLocale } from "../i18n.tsx";

const SLOTS = earlyGearSlots();
const DEFAULT_SLOT: EarlyGearSlotId = "body";

type OwnedFlag = { owned: boolean; highTier: boolean };
type TargetPick = { minTierIndex: number | null };

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

  const [targets, setTargets] = useState<Record<string, TargetPick>>({});
  const [query, setQuery] = useState("");
  const [owned, setOwned] = useState<Record<string, OwnedFlag>>({});
  const [desecrationLock, setDesecrationLock] = useState("");
  const [itemLevelRaw, setItemLevelRaw] = useState("");
  const [targetSide, setTargetSide] = useState<ModSide | "auto">("auto");
  const [prefixCount, setPrefixCount] = useState(0);
  const [suffixCount, setSuffixCount] = useState(0);
  const [goodFracture, setGoodFracture] = useState(false);
  const [garbageFracture, setGarbageFracture] = useState(false);
  const [keeper, setKeeper] = useState(false);
  const [tightBudget, setTightBudget] = useState(false);
  const [openNode, setOpenNode] = useState<CraftTreeNodeId>("desecrate");
  const [lang, setLang] = useState<MatchLang>(() => matchLangForLocale(locale));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLang(matchLangForLocale(locale));
  }, [locale]);

  useEffect(() => {
    setTargets({});
    setQuery("");
    setOwned({});
    setDesecrationLock("");
    setItemLevelRaw("");
    setPrefixCount(0);
    setSuffixCount(0);
    setGoodFracture(false);
    setGarbageFracture(false);
    setKeeper(false);
  }, [slotId]);

  const selected = useMemo(
    () => families.filter((family) => targets[family.id]),
    [families, targets],
  );

  const decision = useMemo(() => {
    return decideCraft({
      includes: selected.map((family) => {
        const tierIndex = targets[family.id]?.minTierIndex;
        const tier = tierIndex == null ? undefined : family.tiers[tierIndex];
        return {
          id: family.id,
          generation: family.generation,
          tierLevel: tier ? tier.level : null,
        };
      }),
      itemLevel: parseLevel(itemLevelRaw),
      owned: selected
        .filter((family) => owned[family.id]?.owned || desecrationLock === family.id)
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
      desecrationLock: desecrationLock === "" ? null : desecrationLock,
      craftedSlotLockedToKeeper: keeper,
      tightBudget,
    });
  }, [
    selected,
    targets,
    itemLevelRaw,
    owned,
    desecrationLock,
    prefixCount,
    suffixCount,
    targetSide,
    garbageFracture,
    goodFracture,
    keeper,
    tightBudget,
  ]);

  const regex = useMemo(() => {
    const corpus = families.map((family) => matchText(family, lang));
    const mods: RegexMod[] = selected.map((family) => {
      const tierIndex = targets[family.id]?.minTierIndex;
      const tier = tierIndex == null ? undefined : family.tiers[tierIndex];
      const match = matchText(family, lang);
      const source = effectText(family, lang);
      const min = family.kind === "numeric" ? tier?.statMin : undefined;
      return {
        id: family.id,
        match,
        polarity: "include",
        kind: family.kind,
        numeric:
          min != null
            ? {
                format: family.numeric?.format,
                min,
                placement: inferNumericPlacement(source, match),
              }
            : undefined,
      };
    });
    return buildRegex(mods, { combine: "and", corpus });
  }, [families, selected, targets, lang]);

  const related = suggestedCraftNode(decision);
  const sideLabel = decision.targetSide === "prefix" ? t.craftingSidePrefix : t.craftingSideSuffix;

  function setSlot(id: EarlyGearSlotId) {
    setParams({ slot: id });
  }

  const toggleTarget = useCallback((id: string) => {
    setTargets((prev) => {
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { minTierIndex: null } };
    });
    setOwned((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setDesecrationLock((lock) => (lock === id ? "" : lock));
  }, []);

  function setMinTier(id: string, raw: string) {
    const minTierIndex = raw === "" ? null : Number(raw);
    setTargets((prev) => (
      prev[id]
        ? { ...prev, [id]: { minTierIndex: Number.isInteger(minTierIndex) ? minTierIndex : null } }
        : prev
    ));
  }

  function onLock(value: string) {
    setDesecrationLock(value);
    if (value && value !== "other") {
      setOwned((prev) => (
        prev[value]?.owned ? prev : { ...prev, [value]: { owned: true, highTier: true } }
      ));
    }
  }

  function toggleOwned(id: string) {
    if (desecrationLock === id) return;
    setOwned((prev) => {
      if (prev[id]?.owned) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { owned: true, highTier: true } };
    });
  }

  async function copyPattern() {
    if (!regex.pattern) return;
    try {
      await navigator.clipboard.writeText(regex.pattern);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
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
        <section aria-label={t.craftingTargetsTitle}>
          <header className="mb-4 border-b border-line pb-4">
            <p className="text-xs tracking-[0.28em] text-gold-dim">CRAFTING · TARGETS</p>
            <h1 className="mt-1 text-2xl font-bold text-gold">{t.craftingTargetsTitle}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t.craftingTargetsDesc}</p>
            <p className="mt-2 text-xs text-muted">
              {t.statsFamilies(families.length, tierCount)}
              {" · "}
              {t.sourcePoe2db(slot ? earlyGearSourcePath(slot) : "")}
            </p>
          </header>

          <label className="mb-3 flex items-center gap-2 text-sm text-muted">
            {t.craftingSearch}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
            />
          </label>
          <p className="mb-3 text-xs text-muted">{t.craftingSelectedCount(selected.length)}</p>

          <TargetColumns
            families={families}
            query={query}
            targets={targets}
            onToggle={toggleTarget}
            onTier={setMinTier}
          />

          <div className="mt-4 rounded-sm border border-line bg-panel px-3 py-3">
            <p className="text-xs text-gold-dim">{t.craftingRegexCaption}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">
                <span className={regex.overLimit ? "text-exclude" : "text-gold"}>{regex.length}</span>
                /{MAX_LENGTH}
              </span>
              <div className="flex overflow-hidden rounded-sm border border-line text-xs">
                <button
                  type="button"
                  onClick={() => setLang("zh-Hant")}
                  className={`px-2 py-1 ${lang === "zh-Hant" ? "bg-gold text-ink" : "text-muted"}`}
                >
                  {t.matchZhHant}
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`px-2 py-1 ${lang === "en" ? "bg-gold text-ink" : "text-muted"}`}
                >
                  {t.matchEn}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargets({});
                  setOwned({});
                  setDesecrationLock("");
                }}
                className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted hover:text-paper"
              >
                {t.reset}
              </button>
              <button
                type="button"
                disabled={!regex.pattern}
                onClick={() => void copyPattern()}
                className="rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
              >
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <div className="mt-2 overflow-x-auto rounded-sm border border-line bg-ink px-3 py-2 font-mono text-sm text-gold">
              {regex.pattern || <span className="text-muted">{t.craftingRegexPlaceholder}</span>}
            </div>
          </div>
        </section>

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
            desecrationLock={desecrationLock}
            onDesecrationLock={onLock}
            keeper={keeper}
            onKeeper={setKeeper}
            tightBudget={tightBudget}
            onTightBudget={setTightBudget}
            selected={selected.map((family) => {
              const tierIndex = targets[family.id]?.minTierIndex ?? null;
              const choice = tierIndex == null
                ? undefined
                : craftTierChoices(family).find((row) => row.index === tierIndex);
              const tier = tierIndex == null ? undefined : family.tiers[tierIndex];
              return {
                id: family.id,
                label: effectText(family, locale),
                tierLabel: choice && tier
                  ? t.craftingTierOption(choice.rank, choice.level, tierEffect(tier, locale))
                  : null,
                owned: Boolean(owned[family.id]?.owned) || desecrationLock === family.id,
                highTier: owned[family.id]?.highTier !== false,
                locked: desecrationLock === family.id,
              };
            })}
            onToggleOwned={toggleOwned}
            onToggleHigh={(id) => {
              setOwned((prev) => (
                prev[id]?.owned || desecrationLock === id
                  ? { ...prev, [id]: { owned: true, highTier: prev[id]?.highTier === false } }
                  : prev
              ));
            }}
          />
        </aside>
      </div>
    </div>
  );
}

function TargetColumns({
  families,
  query,
  targets,
  onToggle,
  onTier,
}: {
  families: AffixFamily[];
  query: string;
  targets: Record<string, TargetPick>;
  onToggle: (id: string) => void;
  onTier: (id: string, raw: string) => void;
}) {
  const { t } = useLocale();
  const visible = families.filter((family) => matchesText(family, query) || targets[family.id]);
  const prefixes = visible.filter((family) => family.generation === "prefix");
  const suffixes = visible.filter((family) => family.generation === "suffix");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TargetColumn
        title={t.prefixTitle}
        rows={prefixes}
        query={query}
        targets={targets}
        onToggle={onToggle}
        onTier={onTier}
      />
      <TargetColumn
        title={t.suffixTitle}
        rows={suffixes}
        query={query}
        targets={targets}
        onToggle={onToggle}
        onTier={onTier}
      />
    </div>
  );
}

function TargetColumn({
  title,
  rows,
  query,
  targets,
  onToggle,
  onTier,
}: {
  title: string;
  rows: AffixFamily[];
  query: string;
  targets: Record<string, TargetPick>;
  onToggle: (id: string) => void;
  onTier: (id: string, raw: string) => void;
}) {
  const { locale, t } = useLocale();
  return (
    <section className="overflow-hidden rounded-sm border border-line bg-panel">
      <h2 className="flex items-center justify-between border-b border-line bg-raised px-3 py-2 text-sm font-medium text-gold">
        <span>{title}</span>
        <span className="text-xs font-normal text-muted">{rows.length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted">{t.noAffixes}</p>
      ) : (
        <ul className="max-h-[32rem] overflow-y-auto">
          {rows.map((family) => {
            const pick = targets[family.id];
            const primary = effectText(family, locale);
            const secondary = effectTextSecondary(family, locale);
            const dimmed = !matchesText(family, query);
            return (
              <li
                key={family.id}
                className={`affix-row border-b border-line px-2 py-2 last:border-b-0 ${dimmed ? "opacity-40" : ""}`}
                data-pick={pick ? "include" : "off"}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(pick)}
                    aria-label={`${t.craftingTargetToggle} ${primary}`}
                    onChange={() => onToggle(family.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-paper">{primary}</p>
                    {secondary && <p className="mt-0.5 text-xs text-muted">{secondary}</p>}
                    {pick && (
                      <label className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        {t.craftingMinTier}
                        <select
                          value={pick.minTierIndex ?? ""}
                          onChange={(event) => onTier(family.id, event.target.value)}
                          className="max-w-full rounded-sm border border-line bg-ink px-2 py-1 text-xs text-paper outline-none focus:border-gold"
                        >
                          <option value="">{t.craftingMinTierAny}</option>
                          {craftTierChoices(family).map((choice) => {
                            const tier = family.tiers[choice.index];
                            if (!tier) return null;
                            return (
                              <option key={choice.index} value={choice.index}>
                                {t.craftingTierOption(choice.rank, choice.level, tierEffect(tier, locale))}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
  desecrationLock,
  onDesecrationLock,
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
  desecrationLock: string;
  onDesecrationLock: (value: string) => void;
  keeper: boolean;
  onKeeper: (value: boolean) => void;
  tightBudget: boolean;
  onTightBudget: (value: boolean) => void;
  selected: {
    id: string;
    label: string;
    tierLabel: string | null;
    owned: boolean;
    highTier: boolean;
    locked: boolean;
  }[];
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
        <label className="text-xs text-muted">
          {t.craftingDesecrationLock}
          <select
            value={desecrationLock}
            onChange={(event) => onDesecrationLock(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          >
            <option value="">{t.craftingDesecrationLockNone}</option>
            {selected.map((row) => (
              <option key={row.id} value={row.id}>{row.label}</option>
            ))}
            <option value="other">{t.craftingDesecrationLockOther}</option>
          </select>
        </label>
        <p className="text-[11px] text-muted">{t.craftingDesecrationLockHint}</p>
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
                  disabled={row.locked}
                  onChange={() => onToggleOwned(row.id)}
                  aria-label={`${row.label} ${t.craftingOwned}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-paper">{row.label}</p>
                  {row.tierLabel && <p className="text-[11px] text-muted">{row.tierLabel}</p>}
                  {row.locked && <p className="text-[11px] text-gold-dim">{t.craftingDesecrationLock}</p>}
                </div>
              </div>
              {row.owned && (
                <label className="mt-1 ml-5 flex items-center gap-2 text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={row.highTier}
                    onChange={() => onToggleHigh(row.id)}
                  />
                  {row.tierLabel ? t.craftingTierMet : t.craftingHighTier}
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
