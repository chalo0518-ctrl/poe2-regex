import { useEffect, useMemo, useState } from "react";
import {
  affixModGroup,
  affixTagLabels,
  craftTierChoices,
  cycleTagState,
  effectText,
  effectTextSecondary,
  familyLabel,
  familyLabelSecondary,
  importNeedles,
  matchLangForLocale,
  matchesIlvl,
  matchesTagFilter,
  matchesText,
  matchText,
  poolLabel,
  tagLabel,
  tierEffect,
  tierName,
  type AffixFamily,
  type HarvestTag,
  type MatchLang,
  type PoolMeta,
  type TagState,
} from "@poe2-regex/data";
import {
  buildRegex,
  inferNumericPlacement,
  MAX_LENGTH,
  type Polarity,
  type RegexMod,
} from "@poe2-regex/regex";
import { useLocale } from "../i18n.tsx";

export type ModPickState = {
  polarity: Polarity;
  min: string;
  max: string;
  /** Index into `family.tiers`. Null or omitted means any tier (no floor). */
  minTierIndex?: number | null;
  /** This affix is the one locked by the desecration stone. At most one row. */
  desecrationLock?: boolean;
};

export type ModPickMode = "polarity" | "target";

const TARGET_SIDE_CAP = 3;

function isChosenTarget(pick: ModPickState | undefined): boolean {
  return pick?.polarity === "include" || pick?.polarity === "or";
}

function tierFloor(family: AffixFamily, index: number | null | undefined): string {
  if (index == null) return "";
  const tier = family.tiers[index];
  if (!tier || family.kind !== "numeric" || tier.statMin == null) return "";
  return String(tier.statMin);
}

function targetBlockTitle(
  family: AffixFamily,
  picks: Record<string, ModPickState>,
  families: AffixFamily[],
  copy: {
    craftingConflict: string;
    craftingSideFullPrefix: string;
    craftingSideFullSuffix: string;
  },
): string | undefined {
  if (isChosenTarget(picks[family.id])) return undefined;
  const selected = families.filter((row) => isChosenTarget(picks[row.id]));
  const group = affixModGroup(family);
  if (selected.some((row) => affixModGroup(row) === group)) return copy.craftingConflict;
  const sideCount = selected.filter((row) => row.generation === family.generation).length;
  if (sideCount >= TARGET_SIDE_CAP) {
    return family.generation === "prefix" ? copy.craftingSideFullPrefix : copy.craftingSideFullSuffix;
  }
  return undefined;
}

type PickState = ModPickState;

const TAG_TINT: Record<string, string> = {
  fire: "#e07048",
  cold: "#5aa7e6",
  lightning: "#e6c04a",
  chaos: "#c45ad4",
  life: "#e15d5d",
  mana: "#5b8cff",
  armour: "#cfc3a8",
  evasion: "#7dce7a",
  energy_shield: "#7ec8e8",
  physical: "#c9b48a",
  elemental: "#d8a25e",
  resistance: "#d4b46a",
  attribute: "#b7a6ff",
  damage: "#e08a5a",
  critical: "#e6a0a0",
  speed: "#9ad0c6",
};

function parseBound(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function toRegexMod(family: AffixFamily, pick: PickState, lang: MatchLang): RegexMod {
  const min = parseBound(pick.min);
  const max = parseBound(pick.max);
  const match = matchText(family, lang);
  const source = effectText(family, lang);
  return {
    id: family.id,
    match,
    polarity: pick.polarity,
    kind: family.kind,
    numeric:
      family.kind === "numeric" &&
      (pick.polarity === "include" || pick.polarity === "or")
        ? {
            format: family.numeric?.format,
            min,
            max,
            placement: inferNumericPlacement(source, match),
          }
        : undefined,
  };
}

export function ChroniclesModBuilder({
  kicker,
  title,
  description,
  sourceNote,
  statsNote,
  harvestTags = [],
  families,
  pools,
  pool,
  onPoolChange,
  poolAriaLabel,
  importHint,
  prefixTitle,
  suffixTitle,
  showTags = true,
  showFilter = true,
  showImport = true,
  showHideToggle = true,
  showFamilyNames = false,
  showAffixTags = false,
  defaultPicks,
  onPicksChange,
  dockRegex = true,
  regexCaption,
  pickMode = "polarity",
}: {
  kicker: string;
  title: string;
  description: string;
  sourceNote: string;
  statsNote: string;
  harvestTags?: HarvestTag[];
  families: AffixFamily[];
  pools?: PoolMeta[];
  pool?: string;
  onPoolChange?: (id: string) => void;
  poolAriaLabel?: string;
  importHint?: string;
  prefixTitle?: string;
  suffixTitle?: string;
  showTags?: boolean;
  showFilter?: boolean;
  showImport?: boolean;
  showHideToggle?: boolean;
  showFamilyNames?: boolean;
  showAffixTags?: boolean;
  defaultPicks?: Record<string, ModPickState>;
  onPicksChange?: (picks: Record<string, ModPickState>) => void;
  /** Fixed bottom bar on other pages. Crafting inlines it so the tree stays visible. */
  dockRegex?: boolean;
  regexCaption?: string;
  /** Polarity keeps 是／或／否. Target is the crafting checklist. */
  pickMode?: ModPickMode;
}) {
  const { locale, t } = useLocale();
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});
  const [query, setQuery] = useState("");
  const [minIlvl, setMinIlvl] = useState("");
  const [maxIlvl, setMaxIlvl] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [picks, setPicks] = useState<Record<string, PickState>>(() => ({
    ...(defaultPicks ?? {}),
  }));
  const [lang, setLang] = useState<MatchLang>(() => matchLangForLocale(locale));

  useEffect(() => {
    setLang(matchLangForLocale(locale));
  }, [locale]);

  useEffect(() => {
    onPicksChange?.(picks);
  }, [picks, onPicksChange]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const minLv = parseBound(minIlvl);
  const maxLv = parseBound(maxIlvl);

  const listed = useMemo(() => {
    return families
      .map((family) => {
        const tagOk = matchesTagFilter(family, tagStates);
        const textOk = matchesText(family, query);
        const ilvlOk = matchesIlvl(family, minLv, maxLv);
        const matched = tagOk && textOk && ilvlOk;
        return { family, matched };
      })
      .filter((row) => row.matched || showHidden);
  }, [families, tagStates, query, minLv, maxLv, showHidden]);

  const prefixes = listed.filter((r) => r.family.generation === "prefix");
  const suffixes = listed.filter((r) => r.family.generation === "suffix");

  const prefixHeading = prefixTitle ?? t.prefixTitle;
  const suffixHeading = suffixTitle ?? t.suffixTitle;

  const corpus = useMemo(
    () => families.map((f) => matchText(f, lang)),
    [families, lang],
  );

  const selected = useMemo(
    () => families.filter((f) => picks[f.id]),
    [families, picks],
  );

  const result = useMemo(() => {
    return buildRegex(
      selected.map((f) => toRegexMod(f, picks[f.id], lang)),
      { combine: "and", corpus },
    );
  }, [selected, picks, lang, corpus]);

  async function copyPattern() {
    if (!result.pattern) return;
    try {
      await navigator.clipboard.writeText(result.pattern);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError(t.copyFail);
    }
  }

  function cycleTag(id: string) {
    setTagStates((prev) => ({
      ...prev,
      [id]: cycleTagState(prev[id] ?? "off"),
    }));
  }

  function setPickPolarity(family: AffixFamily, next: Polarity) {
    setPicks((prev) => {
      const cur = prev[family.id];
      const clear = () => {
        if (!cur) return prev;
        const copy = { ...prev };
        delete copy[family.id];
        return copy;
      };
      // Re-clicking the active 是 / 或 / 否 clears the row.
      if (cur?.polarity === next) return clear();
      return {
        ...prev,
        [family.id]: {
          polarity: next,
          min: cur?.min ?? "",
          max: cur?.max ?? "",
        },
      };
    });
  }

  function importItem() {
    const blob = importText.toLowerCase();
    if (!blob.trim()) return;
    setPicks((prev) => {
      const next = { ...prev };
      for (const family of families) {
        const needles = importNeedles(family)
          .map((s) => s.toLowerCase());
        if (!needles.some((n) => n.length >= 2 && blob.includes(n))) continue;
        if (next[family.id]) continue;
        if (pickMode === "target" && targetBlockTitle(family, next, families, t)) continue;
        next[family.id] = {
          polarity: "include",
          min: "",
          max: "",
          ...(pickMode === "target" ? { minTierIndex: null, desecrationLock: false } : {}),
        };
      }
      return next;
    });
    setImportOpen(false);
  }

  function setTargetChecked(family: AffixFamily, on: boolean) {
    setPicks((prev) => {
      if (!on) {
        if (!prev[family.id]) return prev;
        const copy = { ...prev };
        delete copy[family.id];
        return copy;
      }
      const cur = prev[family.id];
      return {
        ...prev,
        [family.id]: {
          polarity: "include",
          min: cur?.min ?? "",
          max: cur?.max ?? "",
          minTierIndex: cur?.minTierIndex ?? null,
          desecrationLock: cur?.desecrationLock ?? false,
        },
      };
    });
  }

  function toggleDesecrationLock(family: AffixFamily) {
    setPicks((prev) => {
      const turningOff = Boolean(prev[family.id]?.desecrationLock);
      const next: Record<string, PickState> = {};
      for (const [id, pick] of Object.entries(prev)) {
        next[id] = pick.desecrationLock ? { ...pick, desecrationLock: false } : pick;
      }
      if (turningOff) return next;
      const cur = next[family.id];
      next[family.id] = {
        polarity: "include",
        min: cur?.min ?? "",
        max: cur?.max ?? "",
        minTierIndex: cur?.minTierIndex ?? null,
        desecrationLock: true,
      };
      return next;
    });
  }

  function setTargetTier(family: AffixFamily, index: number | null) {
    setPicks((prev) => {
      const cur = prev[family.id];
      return {
        ...prev,
        [family.id]: {
          polarity: "include",
          min: tierFloor(family, index),
          max: "",
          minTierIndex: index,
          desecrationLock: cur?.desecrationLock ?? false,
        },
      };
    });
  }

  const blockTitles = useMemo(() => {
    if (pickMode !== "target") return {} as Record<string, string>;
    const titles: Record<string, string> = {};
    for (const family of families) {
      const title = targetBlockTitle(family, picks, families, t);
      if (title) titles[family.id] = title;
    }
    return titles;
  }, [pickMode, families, picks, t]);

  function changePool(id: string) {
    onPoolChange?.(id);
    setPicks({});
    setExpanded({});
  }

  const includeN = selected.filter((f) => picks[f.id]?.polarity === "include").length;
  const orN = selected.filter((f) => picks[f.id]?.polarity === "or").length;
  const excludeN = selected.filter((f) => picks[f.id]?.polarity === "exclude").length;
  const lengthPct = Math.min(100, (result.length / MAX_LENGTH) * 100);

  return (
    <div className={dockRegex ? "pb-40" : "pb-2"}>
      <header className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] text-gold-dim">{kicker}</p>
          <h1 className="mt-1 text-2xl font-bold text-gold">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        </div>
        <div className="text-xs text-muted sm:text-right">
          <div>{statsNote}</div>
          <div>{sourceNote}</div>
        </div>
      </header>

      {pools && onPoolChange && (
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label={poolAriaLabel}>
          {pools.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={pool === item.id}
              onClick={() => changePool(item.id)}
              className={`rounded-sm border px-2.5 py-1 text-sm ${
                pool === item.id
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {poolLabel(item, locale)}
            </button>
          ))}
        </div>
      )}

      {showTags && harvestTags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {harvestTags.map((tag) => {
            const state = tagStates[tag.id] ?? "off";
            const tint = TAG_TINT[tag.id];
            return (
              <button
                key={tag.id}
                type="button"
                className="tag-chip"
                data-state={state}
                style={state === "off" && tint ? { color: tint, borderColor: tint } : undefined}
                onClick={() => cycleTag(tag.id)}
              >
                {tagLabel(tag, locale)}
              </button>
            );
          })}
        </div>
      )}

      {(showFilter || showImport || showHideToggle) && (
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          {showFilter && (
            <>
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
                {t.filter}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
                />
              </label>
              <label className="flex items-center gap-1 text-sm text-muted">
                {t.minIlvl}
                <input
                  inputMode="numeric"
                  value={minIlvl}
                  onChange={(e) => setMinIlvl(e.target.value)}
                  className="w-20 rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
                />
              </label>
              <label className="flex items-center gap-1 text-sm text-muted">
                {t.maxIlvl}
                <input
                  inputMode="numeric"
                  value={maxIlvl}
                  onChange={(e) => setMaxIlvl(e.target.value)}
                  className="w-20 rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
                />
              </label>
            </>
          )}
          {showImport && (
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="rounded-sm bg-[#2f6fbf] px-3 py-1.5 text-sm text-white"
            >
              {t.importItem}
            </button>
          )}
          {showHideToggle && (
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                showHidden ? "bg-gold text-ink" : "bg-[#8a6a3a] text-paper"
              }`}
            >
              {t.toggleHidden}
            </button>
          )}
        </div>
      )}

      <p className="mb-3 text-xs text-muted">
        {t.listed(listed.filter((r) => r.matched).length)}
        {showHideToggle && showHidden ? t.listedHidden(listed.filter((r) => !r.matched).length) : ""}
        {pickMode === "target"
          ? locale === "en"
            ? `. ${t.craftingSelectedCount(selected.length)}`
            : `。${t.craftingSelectedCount(selected.length)}`
          : t.regexCounts(includeN, orN, excludeN)}
        {showTags ? t.tagHelp : ""}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <AffixColumn
          title={prefixHeading}
          rows={prefixes}
          picks={picks}
          expanded={expanded}
          showFamilyNames={showFamilyNames}
          showAffixTags={showAffixTags}
          pickMode={pickMode}
          blockTitles={blockTitles}
          onPolarity={setPickPolarity}
          onToggleTarget={setTargetChecked}
          onToggleLock={toggleDesecrationLock}
          onTier={setTargetTier}
          onExpand={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
          onBound={(id, key, value) =>
            setPicks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [key]: value } } : prev))
          }
        />
        <AffixColumn
          title={suffixHeading}
          rows={suffixes}
          picks={picks}
          expanded={expanded}
          showFamilyNames={showFamilyNames}
          showAffixTags={showAffixTags}
          pickMode={pickMode}
          blockTitles={blockTitles}
          onPolarity={setPickPolarity}
          onToggleTarget={setTargetChecked}
          onToggleLock={toggleDesecrationLock}
          onTier={setTargetTier}
          onExpand={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
          onBound={(id, key, value) =>
            setPicks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [key]: value } } : prev))
          }
        />
      </div>

      <div
        className={
          dockRegex
            ? "fixed inset-x-0 bottom-0 z-10 border-t border-line bg-panel/95 backdrop-blur"
            : "mt-4 rounded-sm border border-line bg-panel"
        }
      >
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3 sm:px-6">
          {regexCaption && <p className="text-xs text-gold-dim">{regexCaption}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-16 text-xs text-muted">
              <span className={result.overLimit ? "text-exclude" : "text-gold"}>
                {result.length}
              </span>
              /{MAX_LENGTH}
            </div>
            <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-raised">
              <div
                className={`h-full ${result.overLimit ? "bg-exclude" : "bg-gold"}`}
                style={{ width: `${lengthPct}%` }}
              />
            </div>
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
              onClick={() => setPicks({ ...(defaultPicks ?? {}) })}
              className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted hover:text-paper"
            >
              {t.reset}
            </button>
            <button
              type="button"
              disabled={!result.pattern}
              onClick={() => void copyPattern()}
              className="rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <div className="overflow-x-auto rounded-sm border border-line bg-ink px-3 py-2 font-mono text-sm text-gold">
            {result.pattern || (
              <span className="text-muted">
                {pickMode === "target" ? t.craftingRegexPlaceholder : t.regexPlaceholder}
              </span>
            )}
          </div>
          {(result.warnings.length > 0 || copyError) && (
            <p className="text-xs text-exclude">
              {[
                ...result.warnings.map((w) =>
                  w === "over-limit"
                    ? t.warningOverLimit(MAX_LENGTH)
                    : w === "missing-match"
                      ? t.warningMissing
                      : w,
                ),
                copyError,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>

      {showImport && importOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-md border border-line bg-panel p-4">
            <h2 className="mb-2 text-lg text-gold">{t.importTitle}</h2>
            <p className="mb-2 text-xs text-muted">{importHint ?? t.importDefaultHint}</p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              className="mb-3 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-paper outline-none focus:border-gold"
              placeholder={
                locale === "en"
                  ? "+73 to maximum Life\n+40% to Fire Resistance"
                  : "+73 最大生命\n+40% 火焰抗性"
              }
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={importItem}
                className="rounded-sm bg-[#2f6fbf] px-3 py-1.5 text-sm text-white"
              >
                {t.importConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AffixColumn({
  title,
  rows,
  picks,
  expanded,
  showFamilyNames,
  showAffixTags,
  pickMode,
  blockTitles,
  onPolarity,
  onToggleTarget,
  onToggleLock,
  onTier,
  onExpand,
  onBound,
}: {
  title: string;
  rows: { family: AffixFamily; matched: boolean }[];
  picks: Record<string, PickState>;
  expanded: Record<string, boolean>;
  showFamilyNames: boolean;
  showAffixTags: boolean;
  pickMode: ModPickMode;
  blockTitles: Record<string, string>;
  onPolarity: (family: AffixFamily, next: Polarity) => void;
  onToggleTarget: (family: AffixFamily, on: boolean) => void;
  onToggleLock: (family: AffixFamily) => void;
  onTier: (family: AffixFamily, index: number | null) => void;
  onExpand: (id: string) => void;
  onBound: (id: string, key: "min" | "max", value: string) => void;
}) {
  const { t } = useLocale();
  return (
    <section className="overflow-hidden rounded-sm border border-line bg-panel">
      <h2 className="flex items-center justify-between border-b border-line bg-raised px-3 py-2 text-sm font-medium text-gold">
        <span>{title}</span>
        <span className="text-xs font-normal text-muted">{rows.filter((r) => r.matched).length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted">{t.noAffixes}</p>
      ) : (
        <ul>
          {rows.map(({ family, matched }) => (
            <AffixRow
              key={family.id}
              family={family}
              dimmed={!matched}
              pick={picks[family.id]}
              open={Boolean(expanded[family.id])}
              showFamilyNames={showFamilyNames}
              showAffixTags={showAffixTags}
              pickMode={pickMode}
              blockedTitle={blockTitles[family.id]}
              onPolarity={(next) => onPolarity(family, next)}
              onToggleTarget={(on) => onToggleTarget(family, on)}
              onToggleLock={() => onToggleLock(family)}
              onTier={(index) => onTier(family, index)}
              onExpand={() => onExpand(family.id)}
              onBound={(key, value) => onBound(family.id, key, value)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PolarityToggle({
  value,
  onChange,
}: {
  value: Polarity | "off";
  onChange: (next: Polarity) => void;
}) {
  const { t } = useLocale();
  const options: { id: Polarity; label: string; title: string }[] = [
    { id: "include", label: t.polarityYes, title: t.polarityYesTitle },
    { id: "or", label: t.polarityOr, title: t.polarityOrTitle },
    { id: "exclude", label: t.polarityNo, title: t.polarityNoTitle },
  ];
  return (
    <div
      className="flex shrink-0 items-center gap-0.5"
      role="group"
      aria-label={t.polarityGroup}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className="polarity-btn"
          data-polarity={opt.id}
          title={opt.title}
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function AffixRow({
  family,
  dimmed,
  pick,
  open,
  showFamilyNames,
  showAffixTags,
  pickMode,
  blockedTitle,
  onPolarity,
  onToggleTarget,
  onToggleLock,
  onTier,
  onExpand,
  onBound,
}: {
  family: AffixFamily;
  dimmed: boolean;
  pick?: PickState;
  open: boolean;
  showFamilyNames: boolean;
  showAffixTags: boolean;
  pickMode: ModPickMode;
  blockedTitle?: string;
  onPolarity: (next: Polarity) => void;
  onToggleTarget: (on: boolean) => void;
  onToggleLock: () => void;
  onTier: (index: number | null) => void;
  onExpand: () => void;
  onBound: (key: "min" | "max", value: string) => void;
}) {
  const { locale, t } = useLocale();
  const targetMode = pickMode === "target";
  const blocked = Boolean(blockedTitle);
  const showBounds =
    !targetMode &&
    Boolean(pick) &&
    family.kind === "numeric" &&
    (pick?.polarity === "include" || pick?.polarity === "or");
  const primary = effectText(family, locale);
  const secondary = effectTextSecondary(family, locale);
  const tags = affixTagLabels(family, locale);
  const tierChoices = targetMode ? craftTierChoices(family) : [];
  const selectedTier = pick?.minTierIndex ?? null;

  return (
    <li
      className={`affix-row border-b border-line last:border-b-0 ${dimmed || blocked ? "opacity-40" : ""}`}
      data-pick={pick?.polarity ?? "off"}
      data-blocked={blocked ? "true" : "false"}
      title={blockedTitle}
    >
      <div className="flex items-start gap-2 px-2 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {showFamilyNames && (
              <span className="text-sm text-gold">{familyLabel(family, locale)}</span>
            )}
            <span className="text-sm text-paper">{primary}</span>
            {showAffixTags &&
              tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-sm bg-[#2a3344] px-1.5 py-0.5 text-[10px] text-[#9ec3ff]"
                >
                  {tag}
                </span>
              ))}
            <span className="ml-auto font-mono text-[11px] text-muted">
              {family.tierCount} {family.maxLevel} {family.weight}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted">
            {showFamilyNames
              ? `${familyLabelSecondary(family, locale)}${secondary ? ` · ${secondary}` : ""}`
              : secondary}
          </div>
          {targetMode && tierChoices.length > 0 && (
            <label className="mt-1 flex items-center gap-2 text-xs text-muted">
              {t.craftingMinTier}
              <select
                aria-label={`${t.craftingMinTier} ${primary}`}
                disabled={blocked}
                value={selectedTier == null ? "" : String(selectedTier)}
                onChange={(event) => {
                  const raw = event.target.value;
                  onTier(raw === "" ? null : Number(raw));
                }}
                className="min-w-0 flex-1 rounded-sm border border-line bg-ink px-1.5 py-1 text-paper outline-none focus:border-gold disabled:cursor-not-allowed"
              >
                <option value="">{t.craftingMinTierAny}</option>
                {tierChoices.map((choice) => (
                  <option key={choice.index} value={String(choice.index)}>
                    {t.craftingTierOption(
                      choice.rank,
                      choice.level,
                      tierEffect(family.tiers[choice.index], locale),
                    )}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {targetMode ? (
          <div className="flex shrink-0 items-center gap-1">
            <input
              type="checkbox"
              className="mt-0.5 disabled:cursor-not-allowed"
              checked={isChosenTarget(pick)}
              disabled={blocked}
              title={blockedTitle}
              aria-label={`${t.craftingTargetToggle} ${primary}`}
              onChange={(event) => onToggleTarget(event.target.checked)}
            />
            <button
              type="button"
              disabled={blocked}
              aria-pressed={Boolean(pick?.desecrationLock)}
              aria-label={`${t.craftingDesecrationLock} ${primary}`}
              title={blockedTitle || t.craftingDesecrationLock}
              onClick={onToggleLock}
              className={`rounded-sm border px-1.5 py-0.5 text-xs disabled:cursor-not-allowed ${
                pick?.desecrationLock
                  ? "border-gold bg-gold text-ink"
                  : "border-line bg-ink text-muted"
              }`}
            >
              {t.craftingLockMark}
            </button>
          </div>
        ) : (
          <PolarityToggle value={pick?.polarity ?? "off"} onChange={onPolarity} />
        )}
        <button
          type="button"
          onClick={onExpand}
          className="shrink-0 px-1 text-xs text-muted"
          aria-label={t.expandTiers}
        >
          {open ? "▴" : "▾"}
        </button>
      </div>
      {showBounds && pick && (
        <div className="flex flex-wrap items-center gap-2 px-2 pb-2 text-xs">
          <input
            inputMode="numeric"
            value={pick.min}
            onChange={(e) => onBound("min", e.target.value)}
            placeholder={t.min}
            className="w-16 rounded-sm border border-line bg-ink px-1.5 py-1 text-paper outline-none placeholder:text-muted focus:border-gold"
          />
          <span>–</span>
          <input
            inputMode="numeric"
            value={pick.max}
            onChange={(e) => onBound("max", e.target.value)}
            placeholder={t.max}
            className="w-16 rounded-sm border border-line bg-ink px-1.5 py-1 text-paper outline-none placeholder:text-muted focus:border-gold"
          />
          {family.numeric?.suggestedMin != null && (
            <span className="text-muted">
              {t.commonRange(family.numeric.suggestedMin, family.numeric.suggestedMax ?? family.numeric.suggestedMin)}
            </span>
          )}
        </div>
      )}
      {open && (
        <ul className="border-t border-line bg-ink/40 px-3 py-2 text-xs text-muted">
          {family.tiers.map((tier, index) => {
            const choice = tierChoices.find((row) => row.index === index);
            const label = choice
              ? t.craftingTierOption(choice.rank, tier.level, tierEffect(tier, locale))
              : tierEffect(tier, locale);
            return (
              <li key={`${tier.level}-${tier.nameZh}`} className="flex flex-wrap items-center gap-x-2 py-0.5">
                {targetMode ? (
                  <button
                    type="button"
                    disabled={blocked}
                    aria-pressed={selectedTier === index}
                    onClick={() => onTier(selectedTier === index ? null : index)}
                    className={`rounded-sm border px-1.5 py-0.5 text-left disabled:cursor-not-allowed ${
                      selectedTier === index
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-line text-muted"
                    }`}
                  >
                    <span className="text-gold-dim">iLvL {tier.level}</span>
                    <span className="ml-2">{label}</span>
                  </button>
                ) : (
                  <>
                    <span className="text-gold-dim">iLvL {tier.level}</span>
                    {showFamilyNames && <span className="text-paper">{tierName(tier, locale)}</span>}
                    <span>{tierEffect(tier, locale)}</span>
                    {showFamilyNames && locale !== "en" && (
                      <span className="text-muted">{tier.nameEn}</span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
