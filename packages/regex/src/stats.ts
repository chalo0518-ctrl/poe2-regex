import { MAX_LENGTH } from "./constants.js";
import { escapeRegex } from "./escape.js";
import { compactIntegerRange } from "./numbers.js";
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

function numberToken(stat: StatThreshold): { num: string; suffix: string } {
  const num = compactIntegerRange(stat.min, stat.max);
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

function fragmentsForStat(stat: StatThreshold): string[] {
  if (stat.flag) {
    const text = escapeRegex(stat.flag);
    return text ? [text] : [];
  }

  const { num, suffix } = numberToken(stat);
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

/**
 * AND-combine numeric min/max thresholds (and optional flags) into a short
 * stash regex. Each active axis is one quoted group; fragments inside an
 * axis are ORed.
 */
export function buildStatThresholdRegex(
  stats: StatThreshold[],
  options: { maxLength?: number } = {},
): BuildResult {
  const warnings: string[] = [];
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const active = stats.filter(isActive);

  const groups: string[] = [];
  for (const stat of active) {
    const alts = fragmentsForStat(stat);
    if (alts.length === 0) {
      warnings.push("missing-match");
      continue;
    }
    const inner = alts.length === 1 ? alts[0] : `(${alts.join("|")})`;
    groups.push(quoteGroup(inner));
  }

  const pattern = groups.join(" ");
  const length = pattern.length;
  const overLimit = length > maxLength;
  if (overLimit) warnings.push("over-limit");

  return { pattern, length, overLimit, warnings };
}
