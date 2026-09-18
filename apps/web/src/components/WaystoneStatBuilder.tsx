import { useEffect, useMemo, useState } from "react";
import {
  WAYSTONE_STAT_AXES,
  matchLangForLocale,
  waystoneStatThresholds,
  type MatchLang,
  type WaystoneStatId,
} from "@poe2-regex/data";
import {
  buildStatThresholdRegex,
  MAX_LENGTH,
} from "@poe2-regex/regex";
import { useLocale } from "../i18n.tsx";

function parseMin(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}

export function WaystoneStatBuilder() {
  const { locale, t } = useLocale();
  const [mins, setMins] = useState<Record<WaystoneStatId, string>>({
    quantity: "",
    rarity: "",
    effectiveness: "",
  });
  const [lang, setLang] = useState<MatchLang>(() => matchLangForLocale(locale));
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    setLang(matchLangForLocale(locale));
  }, [locale]);

  const thresholds = useMemo(() => {
    const parsed: Partial<Record<WaystoneStatId, number>> = {};
    for (const axis of WAYSTONE_STAT_AXES) {
      const min = parseMin(mins[axis.id]);
      if (min != null) parsed[axis.id] = min;
    }
    return waystoneStatThresholds(parsed, lang);
  }, [mins, lang]);

  const result = useMemo(
    () => buildStatThresholdRegex(thresholds),
    [thresholds],
  );

  const includeN = thresholds.length;
  const lengthPct = Math.min(100, (result.length / MAX_LENGTH) * 100);

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
    setMins({ quantity: "", rarity: "", effectiveness: "" });
  }

  return (
    <div className="pb-40">
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

      <div
        className="mb-4 grid gap-3 md:grid-cols-3"
        role="group"
        aria-label={t.waystonesStatAria}
      >
        {WAYSTONE_STAT_AXES.map((axis) => {
          const label = locale === "en" ? axis.labelEn : axis.labelZh;
          const effects = (locale === "en" ? axis.effectsEn : axis.effectsZh)
            .map((effect) => effect.text)
            .join(" · ");
          return (
            <label
              key={axis.id}
              className="flex flex-col gap-2 rounded-sm border border-line bg-panel p-3"
            >
              <span className="text-sm font-medium text-gold">{label}</span>
              <span className="flex items-center gap-2 text-sm text-muted">
                ≥
                <input
                  inputMode="numeric"
                  value={mins[axis.id]}
                  onChange={(e) =>
                    setMins((prev) => ({ ...prev, [axis.id]: e.target.value }))
                  }
                  placeholder={t.waystonesMinPlaceholder}
                  aria-label={label}
                  className="w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-paper outline-none placeholder:text-muted focus:border-gold"
                />
                %
              </span>
              {effects ? (
                <span className="text-[11px] text-muted">{t.waystonesEffectNote(effects)}</span>
              ) : (
                <span className="text-[11px] text-muted">{t.waystonesQuantityNote}</span>
              )}
            </label>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-muted">{t.waystonesActive(includeN)}</p>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-panel/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3 sm:px-6">
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
              onClick={reset}
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
            {result.pattern || <span className="text-muted">{t.waystonesRegexPlaceholder}</span>}
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
    </div>
  );
}
