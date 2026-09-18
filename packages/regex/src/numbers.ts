import toRegexRange from "to-regex-range";

function wrapAlt(inner: string): string {
  return inner.includes("|") ? `(${inner})` : inner;
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
 * from `to-regex-range` so several waystone axes still fit in 250 chars.
 */
export function compactAtLeast(min: number): string {
  const n = Math.max(0, Math.round(min));
  if (n <= 0) return "\\d+";
  if (n === 1) return "[1-9]\\d*";
  if (n < 10) return `([${n}-9]|\\d{2,})`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const twoDigit =
      ones === 0
        ? `[${tens}-9]\\d`
        : tens < 9
          ? `${tens}[${ones}-9]|[${tens + 1}-9]\\d`
          : `${tens}[${ones}-9]`;
    return `(${twoDigit}|\\d{3,})`;
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (rest === 0) {
      return `([${hundreds}-9]\\d{2}|\\d{4,})`;
    }
    const tens = Math.floor(rest / 10);
    const ones = rest % 10;
    const sameHundred =
      ones === 0 ? `${hundreds}${tens}\\d` : `${hundreds}${tens}[${ones}-9]`;
    const higherTens =
      tens < 9 ? `|${hundreds}[${tens + 1}-9]\\d` : "";
    const higherHundreds =
      hundreds < 9 ? `|[${hundreds + 1}-9]\\d{2}` : "";
    return `(${sameHundred}${higherTens}${higherHundreds}|\\d{4,})`;
  }
  return atLeast(n);
}

/**
 * Compact integer matcher for min and/or max. Empty side = unbounded.
 */
export function compactIntegerRange(min?: number, max?: number): string {
  const hasMin = min != null && Number.isFinite(min);
  const hasMax = max != null && Number.isFinite(max);
  if (!hasMin && !hasMax) return "\\d+";
  if (!hasMax) return compactAtLeast(min as number);
  return integerRangePattern(hasMin ? min : 0, max);
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
