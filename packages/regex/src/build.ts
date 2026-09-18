import { MAX_LENGTH } from "./constants.js";
import { escapeRegex } from "./escape.js";
import { numericPrefix } from "./numbers.js";
import { shortestUnique } from "./shorten.js";
import type { BuildOptions, BuildResult, RegexMod } from "./types.js";

function quoteGroup(inner: string): string {
  return `"${inner}"`;
}

function fragmentFor(mod: RegexMod, corpus: string[]): string {
  const others = corpus.filter((s) => s !== mod.match);
  const unique = shortestUnique(mod.match, others);
  const escaped = escapeRegex(unique);

  const hasNumeric =
    mod.kind === "numeric" &&
    (mod.numeric?.min != null || mod.numeric?.max != null);

  if (!hasNumeric) return escaped;

  const prefix = numericPrefix(
    mod.numeric?.format,
    mod.numeric?.min,
    mod.numeric?.max,
  );
  if (mod.numeric?.placement === "after") {
    return `${escaped}.+${prefix}`;
  }
  return `${prefix}.+${escaped}`;
}

function joinOr(parts: string[]): string {
  return parts.join("|");
}

/**
 * Build a Path of Exile 2 stash/vendor search string.
 *
 * Includes are combined with `|` (OR) or as separate quoted groups (AND).
 * Excludes use PoE2's `!` operator: `"!(a|b)"`.
 */
export function buildRegex(
  selection: RegexMod[],
  options: BuildOptions = {},
): BuildResult {
  const warnings: string[] = [];
  const maxLength = options.maxLength ?? MAX_LENGTH;
  const combine = options.combine ?? "or";

  const includes = selection.filter((m) => m.polarity === "include" && m.match);
  const excludes = selection.filter((m) => m.polarity === "exclude" && m.match);

  if (selection.some((m) => !m.match)) {
    warnings.push("missing-match");
  }

  if (includes.length === 0 && excludes.length === 0) {
    return { pattern: "", length: 0, overLimit: false, warnings };
  }

  const selectedMatches = selection.map((m) => m.match).filter(Boolean);
  const corpus = [...new Set([...(options.corpus ?? []), ...selectedMatches])];

  const includeParts = includes.map((m) => fragmentFor(m, corpus));
  const excludeParts = excludes.map((m) => fragmentFor(m, corpus));

  const groups: string[] = [];

  if (includeParts.length > 0) {
    if (combine === "and") {
      for (const part of includeParts) groups.push(quoteGroup(part));
    } else {
      groups.push(quoteGroup(joinOr(includeParts)));
    }
  }

  if (excludeParts.length > 0) {
    const inner =
      excludeParts.length === 1 ? excludeParts[0] : `(${joinOr(excludeParts)})`;
    groups.push(quoteGroup(`!${inner}`));
  }

  const pattern = groups.join(" ");
  const length = pattern.length;
  const overLimit = length > maxLength;
  if (overLimit) {
    warnings.push("over-limit");
  }

  return { pattern, length, overLimit, warnings };
}
