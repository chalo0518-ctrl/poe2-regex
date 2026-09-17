import { useMemo, useState } from "react";
import {
  cycleTagState,
  matchesIlvl,
  matchesTagFilter,
  matchesText,
  type AffixFamily,
  type HarvestTag,
  type PoolMeta,
  type TagState,
} from "@poe2-regex/data";
import {
  buildRegex,
  MAX_LENGTH,
  type Polarity,
  type RegexMod,
} from "@poe2-regex/regex";

type PickState = {
  polarity: Polarity;
  min: string;
  max: string;
};

type MatchLang = "zh" | "en";

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
  return {
    id: family.id,
    match: lang === "zh" ? family.matchZh || family.match : family.match,
    polarity: pick.polarity,
    kind: family.kind,
    numeric:
      family.kind === "numeric" && pick.polarity === "include"
        ? { format: family.numeric?.format, min, max }
        : undefined,
  };
}

export function ChroniclesModBuilder({
  kicker,
  title,
  description,
  sourceNote,
  statsNote,
  harvestTags,
  families,
  pools,
  pool,
  onPoolChange,
  poolAriaLabel,
  importHint,
  prefixTitle = "基礎前綴",
  suffixTitle = "基礎後綴",
}: {
  kicker: string;
  title: string;
  description: string;
  sourceNote: string;
  statsNote: string;
  harvestTags: HarvestTag[];
  families: AffixFamily[];
  pools?: PoolMeta[];
  pool?: string;
  onPoolChange?: (id: string) => void;
  poolAriaLabel?: string;
  importHint?: string;
  prefixTitle?: string;
  suffixTitle?: string;
}) {
  const [tagStates, setTagStates] = useState<Record<string, TagState>>({});
  const [query, setQuery] = useState("");
  const [minIlvl, setMinIlvl] = useState("");
  const [maxIlvl, setMaxIlvl] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [picks, setPicks] = useState<Record<string, PickState>>({});
  const [lang, setLang] = useState<MatchLang>("zh");
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

  const corpus = useMemo(
    () => families.map((f) => (lang === "zh" ? f.matchZh || f.match : f.match)),
    [families, lang],
  );

  const selected = useMemo(
    () => families.filter((f) => picks[f.id]),
    [families, picks],
  );

  const result = useMemo(() => {
    return buildRegex(
      selected.map((f) => toRegexMod(f, picks[f.id], lang)),
      { combine: "or", corpus },
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
      setCopyError("複製失敗，請手動選取");
    }
  }

  function cycleTag(id: string) {
    setTagStates((prev) => ({
      ...prev,
      [id]: cycleTagState(prev[id] ?? "off"),
    }));
  }

  function cyclePick(family: AffixFamily) {
    setPicks((prev) => {
      const cur = prev[family.id];
      if (!cur) {
        return { ...prev, [family.id]: { polarity: "include", min: "", max: "" } };
      }
      if (cur.polarity === "include") {
        return { ...prev, [family.id]: { ...cur, polarity: "exclude" } };
      }
      const next = { ...prev };
      delete next[family.id];
      return next;
    });
  }

  function importItem() {
    const blob = importText.toLowerCase();
    if (!blob.trim()) return;
    setPicks((prev) => {
      const next = { ...prev };
      for (const family of families) {
        const needles = [
          family.matchZh,
          family.textZh,
          family.match,
          family.textEn,
          family.labelZh,
        ]
          .filter(Boolean)
          .map((s) => s.toLowerCase());
        if (needles.some((n) => n.length >= 2 && blob.includes(n))) {
          next[family.id] = next[family.id] ?? {
            polarity: "include",
            min: "",
            max: "",
          };
        }
      }
      return next;
    });
    setImportOpen(false);
  }

  function changePool(id: string) {
    onPoolChange?.(id);
    setPicks({});
    setExpanded({});
  }

  const includeN = selected.filter((f) => picks[f.id]?.polarity === "include").length;
  const excludeN = selected.filter((f) => picks[f.id]?.polarity === "exclude").length;
  const lengthPct = Math.min(100, (result.length / MAX_LENGTH) * 100);

  return (
    <div className="pb-40">
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
              {item.labelZh}
            </button>
          ))}
        </div>
      )}

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
              {tag.labelZh}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted">
          Filter:
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
          />
        </label>
        <label className="flex items-center gap-1 text-sm text-muted">
          Min iLvL:
          <input
            inputMode="numeric"
            value={minIlvl}
            onChange={(e) => setMinIlvl(e.target.value)}
            className="w-20 rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
          />
        </label>
        <label className="flex items-center gap-1 text-sm text-muted">
          Max iLvL:
          <input
            inputMode="numeric"
            value={maxIlvl}
            onChange={(e) => setMaxIlvl(e.target.value)}
            className="w-20 rounded-sm border border-line bg-raised px-2 py-1.5 text-paper outline-none focus:border-gold"
          />
        </label>
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="rounded-sm bg-[#2f6fbf] px-3 py-1.5 text-sm text-white"
        >
          匯入物品
        </button>
        <button
          type="button"
          onClick={() => setShowHidden((v) => !v)}
          className={`rounded-sm px-3 py-1.5 text-sm ${
            showHidden ? "bg-gold text-ink" : "bg-[#8a6a3a] text-paper"
          }`}
        >
          切換隱藏
        </button>
      </div>

      <p className="mb-3 text-xs text-muted">
        顯示 {listed.filter((r) => r.matched).length} 列
        {showHidden ? `（另顯示 ${listed.filter((r) => !r.matched).length} 列隱藏）` : ""}
        。正則包含 {includeN} · 排除 {excludeN}
        。標籤：第一次包含（紫）· 第二次排除 · 第三次還原；多個包含為聯集。
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <AffixColumn
          title={prefixTitle}
          rows={prefixes}
          picks={picks}
          expanded={expanded}
          onCycle={cyclePick}
          onExpand={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
          onBound={(id, key, value) =>
            setPicks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [key]: value } } : prev))
          }
        />
        <AffixColumn
          title={suffixTitle}
          rows={suffixes}
          picks={picks}
          expanded={expanded}
          onCycle={cyclePick}
          onExpand={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
          onBound={(id, key, value) =>
            setPicks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], [key]: value } } : prev))
          }
        />
      </div>

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
                onClick={() => setLang("zh")}
                className={`px-2 py-1 ${lang === "zh" ? "bg-gold text-ink" : "text-muted"}`}
              >
                繁中匹配
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-1 ${lang === "en" ? "bg-gold text-ink" : "text-muted"}`}
              >
                EN match
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPicks({})}
              className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted hover:text-paper"
            >
              重置
            </button>
            <button
              type="button"
              disabled={!result.pattern}
              onClick={() => void copyPattern()}
              className="rounded-sm bg-gold px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-40"
            >
              {copied ? "已複製" : "複製"}
            </button>
          </div>
          <div className="overflow-x-auto rounded-sm border border-line bg-ink px-3 py-2 font-mono text-sm text-gold">
            {result.pattern || (
              <span className="text-muted">點選詞綴列以包含／排除，正則會顯示在這裡</span>
            )}
          </div>
          {(result.warnings.length > 0 || copyError) && (
            <p className="text-xs text-exclude">
              {[...result.warnings, copyError].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-md border border-line bg-panel p-4">
            <h2 className="mb-2 text-lg text-gold">匯入物品</h2>
            <p className="mb-2 text-xs text-muted">
              {importHint ?? "貼上倉庫複製的物品文字，將自動勾選目前清單上對得上的基礎詞綴。"}
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={8}
              className="mb-3 w-full rounded-sm border border-line bg-ink px-2 py-2 font-mono text-sm text-paper outline-none focus:border-gold"
              placeholder={"+73 最大生命\n+40% 火焰抗性"}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-sm border border-line px-3 py-1.5 text-sm text-muted"
              >
                取消
              </button>
              <button
                type="button"
                onClick={importItem}
                className="rounded-sm bg-[#2f6fbf] px-3 py-1.5 text-sm text-white"
              >
                匯入
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
  onCycle,
  onExpand,
  onBound,
}: {
  title: string;
  rows: { family: AffixFamily; matched: boolean }[];
  picks: Record<string, PickState>;
  expanded: Record<string, boolean>;
  onCycle: (family: AffixFamily) => void;
  onExpand: (id: string) => void;
  onBound: (id: string, key: "min" | "max", value: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-sm border border-line bg-panel">
      <h2 className="flex items-center justify-between border-b border-line bg-raised px-3 py-2 text-sm font-medium text-gold">
        <span>{title}</span>
        <span className="text-xs font-normal text-muted">{rows.filter((r) => r.matched).length}</span>
      </h2>
      {rows.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted">沒有符合的詞綴</p>
      ) : (
        <ul>
          {rows.map(({ family, matched }) => (
            <AffixRow
              key={family.id}
              family={family}
              dimmed={!matched}
              pick={picks[family.id]}
              open={Boolean(expanded[family.id])}
              onCycle={() => onCycle(family)}
              onExpand={() => onExpand(family.id)}
              onBound={(key, value) => onBound(family.id, key, value)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AffixRow({
  family,
  dimmed,
  pick,
  open,
  onCycle,
  onExpand,
  onBound,
}: {
  family: AffixFamily;
  dimmed: boolean;
  pick?: PickState;
  open: boolean;
  onCycle: () => void;
  onExpand: () => void;
  onBound: (key: "min" | "max", value: string) => void;
}) {
  const include = pick?.polarity === "include";

  return (
    <li
      className={`affix-row border-b border-line last:border-b-0 ${dimmed ? "opacity-40" : ""}`}
      data-pick={pick?.polarity ?? ""}
    >
      <div className="flex items-start gap-2 px-2 py-2">
        <button type="button" onClick={onCycle} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm text-gold">{family.labelZh}</span>
            <span className="text-sm text-paper">{family.textZh}</span>
            {family.tagsZh.map((tag) => (
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
            {family.labelEn}
            {family.textEn ? ` · ${family.textEn}` : ""}
          </div>
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="shrink-0 px-1 text-xs text-muted"
          aria-label="展開階層"
        >
          {open ? "▴" : "▾"}
        </button>
      </div>
      {pick && (
        <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pl-2 text-xs">
          <span className={include ? "text-include" : "text-exclude"}>
            {include ? "正則包含" : "正則排除"}
          </span>
          {family.kind === "numeric" && include && (
            <>
              <input
                inputMode="numeric"
                value={pick.min}
                onChange={(e) => onBound("min", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="最小"
                className="w-16 rounded-sm border border-line bg-ink px-1.5 py-1 text-paper outline-none placeholder:text-muted focus:border-gold"
              />
              <span>–</span>
              <input
                inputMode="numeric"
                value={pick.max}
                onChange={(e) => onBound("max", e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="最大"
                className="w-16 rounded-sm border border-line bg-ink px-1.5 py-1 text-paper outline-none placeholder:text-muted focus:border-gold"
              />
              {family.numeric?.suggestedMin != null && (
                <span className="text-muted">
                  常見 {family.numeric.suggestedMin}–{family.numeric.suggestedMax}
                </span>
              )}
            </>
          )}
        </div>
      )}
      {open && (
        <ul className="border-t border-line bg-ink/40 px-3 py-2 text-xs text-muted">
          {family.tiers.map((tier) => (
            <li key={`${tier.level}-${tier.nameZh}`} className="flex flex-wrap gap-x-2 py-0.5">
              <span className="text-gold-dim">iLvL {tier.level}</span>
              <span className="text-paper">{tier.nameZh}</span>
              <span>{tier.textZh}</span>
              <span className="text-muted">{tier.nameEn}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
