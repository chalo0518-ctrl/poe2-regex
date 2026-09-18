import { MAX_LENGTH } from "./constants.js";
import { escapeRegex } from "./escape.js";
import { compactAtLeast } from "./numbers.js";
import type { BuildResult } from "./types.js";

export type StatNumberSide = "before" | "after";

export type StatEffectFragment = {
  /** Effect text with the rolled number removed, e.g. `更多稀有度`. */
  text: string;
  /** `before` = `14%更多稀有度`; `after` = `物品稀有度: +14%`. */
  numberSide: StatNumberSide;
};

/**
 * One stash-searchable axis (e.g. waystone item rarity).
 * `header` is the aggregate item label; `effects` are affix reward lines.
 */
export type StatThreshold = {
  id: string;
  min: number;
  header?: string;
  effects?: StatEffectFragment[];
};

function percentAtLeast(min: number): string {
  return compactAtLeast(min);
}

function fragmentsForStat(stat: StatThreshold): string[] {
  const num = percentAtLeast(stat.min);
  const parts: string[] = [];
  if (stat.header) {
    parts.push(`${escapeRegex(stat.header)}.*${num}%`);
  }
  for (const effect of stat.effects ?? []) {
    const text = escapeRegex(effect.text);
    if (!text) continue;
    if (effect.numberSide === "before") {
      // ZH is `14%更多稀有度`; EN is `14% more Rarity of Items`.
      parts.push(`${num}%\\s?${text}`);
    } else {
      parts.push(`${text}.*${num}%`);
    }
  }
  return parts;
}

function quoteGroup(inner: string): string {
  return `"${inner}"`;
}

/**
 * AND-combine numeric min thresholds into a short stash regex.
 * Each active axis is one quoted group; fragments inside an axis are ORed.
 */
export function buildStatThresholdRegex(
  stats: StatThreshold[],
  options: { maxLength?: number } = {},
): BuildResult {
  const warnings: string[] = [];
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const active = stats.filter(
    (stat) => Number.isFinite(stat.min) && stat.min >= 0,
  );

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
