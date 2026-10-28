import type { MatchLang } from "@poe2-regex/data";
import { MAX_LENGTH } from "@poe2-regex/regex";
import { useLocale } from "../i18n.tsx";

export type RegexChipTone = "include" | "or" | "exclude" | "axis" | "optimized";

export type RegexChip = {
  id: string;
  label: string;
  tone: RegexChipTone;
  onRemove: () => void;
  removeLabel: string;
};

export function RegexRail({
  dock = true,
  pattern,
  length,
  overLimit,
  placeholder,
  alerts,
  notes,
  copied,
  onCopy,
  onReset,
  clearAllLabel,
  onClearAll,
  lang,
  onLang,
  optimize,
  chips,
  counts,
  caption,
}: {
  dock?: boolean;
  pattern: string;
  length: number;
  overLimit: boolean;
  placeholder: string;
  alerts: string[];
  notes?: string[];
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
  clearAllLabel?: string;
  onClearAll?: () => void;
  lang: MatchLang;
  onLang: (lang: MatchLang) => void;
  optimize?: {
    pressed: boolean;
    onToggle: () => void;
    label: string;
    title: string;
  };
  chips?: RegexChip[];
  counts?: string;
  caption?: string;
}) {
  const { t } = useLocale();
  const lengthPct = Math.min(100, (length / MAX_LENGTH) * 100);
  const filled = chips?.length ?? 0;

  return (
    <div
      className={
        dock
          ? "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel/95 backdrop-blur"
          : "mt-4 rounded-sm border border-line bg-panel"
      }
      role="region"
      aria-label={t.regexRailLabel}
      data-regex-rail={dock ? "dock" : "inline"}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3 sm:px-6">
        {caption && <p className="text-xs text-gold-dim">{caption}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-16 text-xs text-muted">
            <span className={overLimit ? "text-exclude" : "text-gold"}>{length}</span>/{MAX_LENGTH}
          </div>
          <div className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-raised">
            <div
              className={`h-full ${overLimit ? "bg-exclude" : "bg-gold"}`}
              style={{ width: `${lengthPct}%` }}
            />
          </div>
          {counts && (
            <p className="text-xs text-gold" data-selection-counts="">
              {counts}
            </p>
          )}
          <div className="flex overflow-hidden rounded-sm border border-line text-xs">
            <button
              type="button"
              onClick={() => onLang("zh-Hant")}
              className={`px-2 py-1 ${lang === "zh-Hant" ? "bg-gold text-ink" : "text-muted"}`}
            >
              {t.matchZhHant}
            </button>
            <button
              type="button"
              onClick={() => onLang("en")}
              className={`px-2 py-1 ${lang === "en" ? "bg-gold text-ink" : "text-muted"}`}
            >
              {t.matchEn}
            </button>
          </div>
          {optimize && (
            <button
              type="button"
              aria-pressed={optimize.pressed}
              title={optimize.title}
              onClick={optimize.onToggle}
              className={`rounded-sm border px-2 py-1 text-xs ${
                optimize.pressed
                  ? "border-gold bg-gold text-ink"
                  : "border-line text-muted hover:text-paper"
              }`}
            >
              {optimize.label}
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted hover:text-paper"
          >
            {t.reset}
          </button>
          {clearAllLabel && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={filled === 0}
              className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted hover:text-paper disabled:opacity-40"
            >
              {clearAllLabel}
            </button>
          )}
          <button
            type="button"
            disabled={!pattern}
            onClick={onCopy}
            className="rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
          >
            {copied ? t.copied : t.copy}
          </button>
        </div>
        {chips && chips.length > 0 && (
          <div className="flex gap-1 overflow-x-auto" aria-label={t.regexChipList}>
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="regex-chip"
                data-tone={chip.tone}
                onClick={chip.onRemove}
                aria-label={chip.removeLabel}
              >
                <span>{chip.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
        <div className="overflow-x-auto rounded-sm border border-line bg-ink px-3 py-2 font-mono text-sm text-gold">
          {pattern || <span className="text-muted">{placeholder}</span>}
        </div>
        {notes && notes.length > 0 && (
          <ul className="space-y-0.5 text-xs text-gold">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
        {alerts.length > 0 && <p className="text-xs text-exclude">{alerts.join(" · ")}</p>}
      </div>
    </div>
  );
}
