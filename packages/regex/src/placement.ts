import type { NumericPlacement } from "./types.js";

/**
 * Decide whether the rolled number sits before or after the unique match
 * fragment in a real effect string. Used so 简中 `火焰抗性 +35%` still
 * works with numeric bounds (EN/繁中 keep `+35% …`).
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
