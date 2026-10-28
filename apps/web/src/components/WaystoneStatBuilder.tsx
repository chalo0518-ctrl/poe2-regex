import { useEffect, useMemo, useState } from "react";
import {
  WAYSTONE_RANGE_AXES,
  matchLangForLocale,
  waystoneStatThresholds,
  type MatchLang,
  type WaystoneRangeId,
} from "@poe2-regex/data";
import { buildStatThresholdRegex, MAX_LENGTH } from "@poe2-regex/regex";
import { useLocale } from "../i18n.tsx";
import { RegexRail, type RegexChip } from "./RegexRail.tsx";

type RangeFields = Record<WaystoneRangeId, { min: string; max: string }>;

function emptyRanges(): RangeFields {
  return Object.fromEntries(
    WAYSTONE_RANGE_AXES.map((axis) => [axis.id, { min: "", max: "" }]),
  ) as RangeFields;
}

function parseBound(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

function boundText(raw: string, open: string): string {
  return raw.trim() === "" ? open : raw;
}

function clampBelow(next: string, maxRaw: string, scale: { min: number; max: number }): string {
  const n = Number(next);
  if (!Number.isFinite(n) || n <= scale.min) return "";
  const max = parseBound(maxRaw);
  if (max != null && n > max) return String(max);
  return String(Math.round(n));
}

function clampAbove(next: string, minRaw: string, scale: { min: number; max: number }): string {
  const n = Number(next);
  if (!Number.isFinite(n) || n >= scale.max) return "";
  const min = parseBound(minRaw);
  if (min != null && n < min) return String(min);
  return String(Math.round(n));
}

function boundsLabel(min: string, max: string): string {
  const hasMin = min.trim() !== "";
  const hasMax = max.trim() !== "";
  if (hasMin && hasMax) return `${min}–${max}`;
  if (hasMin) return `≥${min}`;
  if (hasMax) return `≤${max}`;
  return "";
}

function BoundSlider({
  label,
  value,
  floor,
  ceiling,
  openLabel,
  sideLabel,
  upper = false,
  onChange,
}: {
  label: string;
  value: string;
  floor: number;
  ceiling: number;
  openLabel: string;
  sideLabel: string;
  upper?: boolean;
  onChange: (next: string) => void;
}) {
  const unset = value.trim() === "";
  const shown = unset ? (upper ? ceiling : floor) : Number(value);
  return (
    <label className="mt-1 grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-2 text-xs text-muted">
      <span>{sideLabel}</span>
      <input
        type="range"
        className="axis-range"
        min={floor}
        max={ceiling}
        step={1}
        value={shown}
        aria-label={label}
        aria-valuetext={unset ? openLabel : value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span data-bound={upper ? "max" : "min"} className="text-right font-mono text-paper">
        {unset ? openLabel : value}
      </span>
    </label>
  );
}

export function WaystoneStatBuilder() {
  const { locale, t } = useLocale();
  const [ranges, setRanges] = useState<RangeFields>(emptyRanges);
  const [lang, setLang] = useState<MatchLang>(() => matchLangForLocale(locale));
  const [optimizeLength, setOptimizeLength] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    setLang(matchLangForLocale(locale));
  }, [locale]);

  const thresholds = useMemo(() => {
    const parsed: Partial<Record<WaystoneRangeId, { min?: number; max?: number }>> = {};
    for (const axis of WAYSTONE_RANGE_AXES) {
      const min = parseBound(ranges[axis.id].min);
      const max = parseBound(ranges[axis.id].max);
      if (min != null || max != null) parsed[axis.id] = { min, max };
    }
    return waystoneStatThresholds({ ranges: parsed }, lang);
  }, [ranges, lang]);

  const result = useMemo(
    () => buildStatThresholdRegex(thresholds, { optimizeLength }),
    [thresholds, optimizeLength],
  );

  const includeN = thresholds.length;

  const axisLabel = (id: string) => {
    const axis = WAYSTONE_RANGE_AXES.find((row) => row.id === id);
    if (!axis) return id;
    return locale === "en" ? axis.labelEn : axis.labelZh;
  };

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

  function reset() {
    setRanges(emptyRanges());
  }

  function clearAxis(id: WaystoneRangeId) {
    setRanges((prev) => ({ ...prev, [id]: { min: "", max: "" } }));
  }

  function setBound(id: WaystoneRangeId, side: "min" | "max", value: string) {
    setRanges((prev) => ({
      ...prev,
      [id]: { ...prev[id], [side]: value },
    }));
  }

  const chips: RegexChip[] = WAYSTONE_RANGE_AXES.flatMap((axis) => {
    const fields = ranges[axis.id];
    if (parseBound(fields.min) == null && parseBound(fields.max) == null) return [];
    const label = locale === "en" ? axis.labelEn : axis.labelZh;
    const loose = result.loosened.find((row) => row.id === axis.id);
    const bounds = boundsLabel(fields.min, fields.max);
    const text = loose
      ? `${label} ${bounds} 優化 ${loose.typedMin}→${loose.effectiveMin}`
      : `${label} ${bounds}`;
    return [
      {
        id: axis.id,
        label: text,
        tone: loose ? "optimized" : "axis",
        removeLabel: t.waystonesChipRemove(label),
        onRemove: () => clearAxis(axis.id),
      },
    ];
  });

  const notes: string[] = [];
  if (optimizeLength && result.loosened.length === 0 && result.pattern) {
    notes.push(t.waystonesOptimizeTight);
  }
  if (result.loosened.length > 0) {
    notes.push(t.waystonesOptimizeMixed);
    for (const row of result.loosened) {
      notes.push(t.waystonesOptimized(axisLabel(row.id), row.typedMin, row.effectiveMin));
    }
  }

  const alerts = [
    ...result.warnings.map((w) =>
      w === "over-limit" ? t.warningOverLimit(MAX_LENGTH) : w === "missing-match" ? t.warningMissing : w,
    ),
    copyError,
  ].filter(Boolean);

  return (
    <div className="pb-96">
      <header className="mb-4 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.28em] text-gold-dim">CHRONICLES · WAYSTONES</p>
          <h1 className="mt-1 text-2xl font-bold text-gold">{t.waystonesTitle}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t.waystonesDesc}</p>
        </div>
        <div className="text-xs text-muted sm:text-right">
          <div>{t.sourcePoe2db("Waystones")}</div>
        </div>
      </header>

      <p className="mb-3 text-xs text-muted">{t.waystonesThresholdHint}</p>

      <div className="mb-4 grid gap-2 sm:grid-cols-2" role="group" aria-label={t.waystonesStatAria}>
        {WAYSTONE_RANGE_AXES.map((axis) => {
          const label = locale === "en" ? axis.labelEn : axis.labelZh;
          const fields = ranges[axis.id];
          const active = parseBound(fields.min) != null || parseBound(fields.max) != null;
          return (
            <div
              key={axis.id}
              data-axis={axis.id}
              className="rounded-sm border border-line bg-panel px-3 py-2"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gold">{label}</span>
                <span className="font-mono text-xs text-paper">
                  {boundText(fields.min, t.waystonesBoundOpen)}–{boundText(fields.max, t.waystonesBoundOpen)}
                </span>
                {active && (
                  <button
                    type="button"
                    className="rounded-sm border border-line px-1.5 py-0.5 text-[11px] text-muted"
                    aria-label={t.waystonesIgnoreAxis(label)}
                    onClick={() => clearAxis(axis.id)}
                  >
                    {t.waystonesClearAxis}
                  </button>
                )}
              </div>
              <BoundSlider
                label={`${label} ${t.min}`}
                value={fields.min}
                floor={axis.slider.min}
                ceiling={axis.slider.max}
                openLabel={t.waystonesBoundOpen}
                sideLabel={t.min}
                onChange={(next) => setBound(axis.id, "min", clampBelow(next, fields.max, axis.slider))}
              />
              <BoundSlider
                label={`${label} ${t.max}`}
                value={fields.max}
                floor={axis.slider.min}
                ceiling={axis.slider.max}
                openLabel={t.waystonesBoundOpen}
                sideLabel={t.max}
                upper
                onChange={(next) => setBound(axis.id, "max", clampAbove(next, fields.min, axis.slider))}
              />
              <p className="mt-0.5 text-[11px] text-muted">
                {axis.slider.min}–{axis.slider.max}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-muted">{t.waystonesActive(includeN)}</p>

      <RegexRail
        pattern={result.pattern}
        length={result.length}
        overLimit={result.overLimit}
        placeholder={t.waystonesRegexPlaceholder}
        alerts={alerts}
        notes={notes}
        copied={copied}
        onCopy={() => void copyPattern()}
        onReset={reset}
        clearAllLabel={t.waystonesClearAll}
        onClearAll={reset}
        lang={lang}
        onLang={setLang}
        optimize={{
          pressed: optimizeLength,
          onToggle: () => setOptimizeLength((on) => !on),
          label: t.waystonesOptimize,
          title: t.waystonesOptimizeTitle,
        }}
        chips={chips}
      />
    </div>
  );
}
