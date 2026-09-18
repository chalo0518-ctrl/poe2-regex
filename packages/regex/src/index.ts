export { MAX_LENGTH } from "./constants.js";
export { buildRegex } from "./build.js";
export {
  integerRangePattern,
  compactAtLeast,
  compactIntegerRange,
  numericPrefix,
} from "./numbers.js";
export { inferNumericPlacement } from "./placement.js";
export { shortestUnique } from "./shorten.js";
export { escapeRegex } from "./escape.js";
export { matchesItem } from "./match.js";
export { buildStatThresholdRegex } from "./stats.js";
export type {
  StatEffectFragment,
  StatNumberSide,
  StatThreshold,
} from "./stats.js";
export type {
  BuildOptions,
  BuildResult,
  CombineMode,
  ModKind,
  NumericConstraint,
  NumericFormat,
  NumericPlacement,
  Polarity,
  RegexMod,
} from "./types.js";
