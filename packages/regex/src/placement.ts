import type { NumericPlacement } from "./types.js";

/**
 * Decide whether the rolled number sits before or after the unique match
 * fragment in a real effect string. Used so `rest +N%` (suffix numbers)
 * still works with numeric bounds (prefix `+N% rest` stays `before`).
 */
export function inferNumericPlacement(
  sourceText: string,
  rest: string,
): NumericPlacement {
  const text = sourceText.trim();
  const needle = rest.trim();
  if (!text || !needle) return "before";
  const idx = text.indexOf(needle);
  if (idx < 0) {
    return /^[+\d(]/.test(text) ? "before" : "after";
  }
  const before = text.slice(0, idx);
  const after = text.slice(idx + needle.length);
  const hasNum = (s: string) => /\d/.test(s);
  if (hasNum(before) && !hasNum(after)) return "before";
  if (hasNum(after) && !hasNum(before)) return "after";
  if (hasNum(before)) return "before";
  if (hasNum(after)) return "after";
  return /^[+\d(]/.test(text) ? "before" : "after";
}
