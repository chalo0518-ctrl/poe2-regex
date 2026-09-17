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
