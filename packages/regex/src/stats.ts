import { MAX_LENGTH } from "./constants.js";
import { escapeRegex } from "./escape.js";
import { compactIntegerRange, dotDigitShorthand } from "./numbers.js";
import type { BuildResult } from "./types.js";

export type StatNumberSide = "before" | "after";

export type StatEffectFragment = {
  /** Effect text with the rolled number removed, e.g. `更多稀有度`. */
  text: string;
  /** `before` = `14%更多稀有度`; `after` = `物品稀有度: +14%`. */
  numberSide: StatNumberSide;
};

export type StatNumberStyle = "percent" | "bare";

/**
 * One stash-searchable axis (e.g. waystone item rarity).
 * `header` is the aggregate item label; `effects` are affix reward lines.
 * `flag` is a non-numeric dropdown/literal match.
 */
export type StatThreshold = {
  id: string;
  min?: number;
  max?: number;
  header?: string;
  /** Where the rolled number sits relative to `header`. Default `after`. */
  headerNumberSide?: StatNumberSide;
  headerGap?: "tight" | "loose";
  effects?: StatEffectFragment[];
  numberStyle?: StatNumberStyle;
  flag?: string;
};

function isActive(stat: StatThreshold): boolean {
  if (stat.flag) return Boolean(stat.flag);
  return (
    (stat.min != null && Number.isFinite(stat.min) && stat.min >= 0) ||
    (stat.max != null && Number.isFinite(stat.max) && stat.max >= 0)
  );
}

function numberToken(stat: StatThreshold, shorten: boolean): { num: string; suffix: string } {
  const precise = compactIntegerRange(stat.min, stat.max);
  const num = shorten ? dotDigitShorthand(precise) : precise;
  const suffix = stat.numberStyle === "bare" ? "([^0-9]|$)" : "%";
  return { num, suffix };
}

function beforePattern(text: string, num: string, suffix: string, loose: boolean): string {
  const gap = loose ? ".+" : "\\s?";
  return `[^0-9]${num}${suffix}${gap}${text}`;
}

function afterPattern(text: string, num: string, suffix: string): string {
  return `${text}.*[^0-9]${num}${suffix}`;
}

function fragmentsForStat(stat: StatThreshold, shorten: boolean): string[] {
  if (stat.flag) {
    const text = escapeRegex(stat.flag);
    return text ? [text] : [];
  }

  const { num, suffix } = numberToken(stat, shorten);
  const parts: string[] = [];
  if (stat.header) {
    const text = escapeRegex(stat.header);
    if (text) {
      if (stat.headerNumberSide === "before") {
        parts.push(beforePattern(text, num, suffix, stat.headerGap === "loose"));
      } else {
        parts.push(afterPattern(text, num, suffix));
      }
    }
  }
  for (const effect of stat.effects ?? []) {
    const text = escapeRegex(effect.text);
    if (!text) continue;
    if (effect.numberSide === "before") {
      // ZH is `14%更多稀有度`; EN is `14% more Rarity of Items`.
      parts.push(beforePattern(text, num, suffix, false));
    } else {
      parts.push(afterPattern(text, num, suffix));
    }
  }
  return parts;
}

function quoteGroup(inner: string): string {
  return `"${inner}"`;
}

/** A minimum that 優化長度 lowered so the stash string could fit. */
export type LoosenedMin = {
  id: string;
  typedMin: number;
  effectiveMin: number;
};

export type StatBuildResult = BuildResult & {
  loosened: LoosenedMin[];
};

export type StatBuildOptions = {
  maxLength?: number;
  /**
   * Off (default): precise `compactIntegerRange` tokens.
   * On: a lone `\d` becomes `.` (same integer floor; `.` may match a non-digit).
   * If that is still over `maxLength`, minimums step down — previous hundred, then
   * previous ten — and stop before collapsing to "any number". Lowered mins are `loosened`.
   */
  optimizeLength?: boolean;
};

type Assembled = {
  pattern: string;
  length: number;
  warnings: string[];
  loosened: LoosenedMin[];
};

function assemble(
  stats: StatThreshold[],
  shorten: boolean,
  mins: Readonly<Record<string, number>>,
): Assembled {
  const warnings: string[] = [];
  const groups: string[] = [];
  const loosened: LoosenedMin[] = [];
  for (const stat of stats) {
    const typedMin = stat.min;
    const effectiveMin = mins[stat.id];
    const used =
      effectiveMin != null && typedMin != null ? { ...stat, min: effectiveMin } : stat;
    if (effectiveMin != null && typedMin != null && effectiveMin < typedMin) {
      loosened.push({ id: stat.id, typedMin, effectiveMin });
    }
    const alts = fragmentsForStat(used, shorten);
    if (alts.length === 0) {
      warnings.push("missing-match");
      continue;
    }
    const inner = alts.length === 1 ? alts[0] : `(${alts.join("|")})`;
    groups.push(quoteGroup(inner));
  }
  const pattern = groups.join(" ");
  return { pattern, length: pattern.length, warnings, loosened };
}

/**
 * Next shorter bucket that can still name a minimum.
 * Three-digit values step to the previous hundred, then by hundreds.
 * Smaller values step once to the previous ten and stop: 40, 30, and 20
 * share a token length, and 0 would match any number.
 */
function nextCoarser(min: number): number | undefined {
  const n = Math.round(min);
  if (n <= 0) return undefined;
  if (n >= 100 && n % 100 !== 0) return Math.floor(n / 100) * 100;
  if (n > 100 && n % 100 === 0) return n - 100;
  if (n >= 10 && n % 10 !== 0) return Math.floor(n / 10) * 10;
  return undefined;
}

function coarserOptions(current: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  let n = current;
  while (out.length < 24) {
    const next = nextCoarser(n);
    if (next == null || seen.has(next)) break;
    seen.add(next);
    out.push(next);
    n = next;
    if (next === 0) break;
  }
  return out;
}

/**
 * AND-combine numeric min/max thresholds (and optional flags) into a short
 * stash regex. Each active axis is one quoted group; fragments inside an
 * axis are ORed.
 */
export function buildStatThresholdRegex(
  stats: StatThreshold[],
  options: StatBuildOptions = {},
): StatBuildResult {
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const active = stats.filter(isActive);
  const shorten = options.optimizeLength === true;
  const mins: Record<string, number> = {};
  let built = assemble(active, shorten, mins);

  if (shorten) {
    while (built.length > maxLength) {
      let best: { id: string; floor: number; drop: number; built: Assembled } | null = null;
      for (const stat of active) {
        if (stat.min == null || !Number.isFinite(stat.min)) continue;
        const typed = Math.round(stat.min);
        const current = mins[stat.id] ?? typed;
        for (const floor of coarserOptions(current)) {
          const trial = assemble(active, shorten, { ...mins, [stat.id]: floor });
          if (trial.length >= built.length) continue;
          const drop = typed - floor;
          const better =
            best == null ||
            drop < best.drop ||
            (drop === best.drop && trial.length < best.built.length) ||
            (drop === best.drop &&
              trial.length === best.built.length &&
              stat.id < best.id);
          if (better) best = { id: stat.id, floor, drop, built: trial };
        }
      }
      if (!best) break;
      mins[best.id] = best.floor;
      built = best.built;
    }
  }

  const overLimit = built.length > maxLength;
  const warnings = [...built.warnings];
  if (overLimit) warnings.push("over-limit");
  return {
    pattern: built.pattern,
    length: built.length,
    overLimit,
    warnings,
    loosened: built.loosened,
  };
}
