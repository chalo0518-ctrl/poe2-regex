import toRegexRange from "to-regex-range";

function wrapAlt(inner: string): string {
  return inner.includes("|") ? `(?:${inner})` : inner;
}

function atLeast(min: number): string {
  if (min <= 0) return "\\d+";
  if (min === 1) return "[1-9]\\d*";
  const digits = String(min).length;
  const cap = 10 ** digits - 1;
  const untilCap =
    min === cap ? String(min) : wrapAlt(toRegexRange(min, cap, { shorthand: true }));
  const longer = `[1-9]\\d{${digits},}`;
  return `(?:${untilCap}|${longer})`;
}

/**
 * Compact integer matcher for PoE search boxes.
 * `min`/`max` omitted means unbounded on that side.
 */
export function integerRangePattern(min?: number, max?: number): string {
  const hasMin = min != null && Number.isFinite(min);
  const hasMax = max != null && Number.isFinite(max);
  if (!hasMin && !hasMax) return "\\d+";

  const lo = hasMin ? Math.max(0, Math.round(min as number)) : 0;
  if (!hasMax) return atLeast(lo);

  const hi = Math.max(0, Math.round(max as number));
  if (lo === hi) return String(lo);
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  return wrapAlt(toRegexRange(a, b, { shorthand: true }));
}

/**
 * Shorter ≥N matcher for stash stat filters. Avoids nested `(?:(?:…))`
 * from `to-regex-range` so three waystone axes still fit in 250 chars.
 */
export function compactAtLeast(min: number): string {
  const n = Math.max(0, Math.round(min));
  if (n <= 0) return "\\d+";
  if (n === 1) return "[1-9]\\d*";
  if (n < 10) return `(?:[${n}-9]|[1-9]\\d+)`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const parts = [
      ones === 0 ? `${tens}\\d` : `${tens}[${ones}-9]`,
      tens < 9 ? `[${tens + 1}-9]\\d` : "",
      "[1-9]\\d{2,}",
    ].filter(Boolean);
    return `(?:${parts.join("|")})`;
  }
  return atLeast(n);
}

export function numericPrefix(
  format: "plusPercent" | "plusFlat" | "percentPrefix" | "bare" | undefined,
  min?: number,
  max?: number,
): string {
  const num = integerRangePattern(min, max);
  switch (format) {
    case "plusPercent":
      return `\\+${num}%`;
    case "plusFlat":
      return `\\+${num}`;
    case "percentPrefix":
      return `${num}%`;
    case "bare":
    default:
      return num;
  }
}
