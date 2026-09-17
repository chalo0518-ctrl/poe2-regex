export type Polarity = "include" | "exclude";
export type ModKind = "flag" | "numeric";
export type CombineMode = "or" | "and";

export type NumericFormat =
  | "plusPercent"
  | "plusFlat"
  | "percentPrefix"
  | "bare";

export type NumericConstraint = {
  min?: number;
  max?: number;
  format?: NumericFormat;
};

export type RegexMod = {
  id: string;
  match: string;
  polarity: Polarity;
  kind: ModKind;
  numeric?: NumericConstraint;
};

export type BuildOptions = {
  maxLength?: number;
  combine?: CombineMode;
  /** Other known affix strings; used so shortened fragments stay unique. */
  corpus?: string[];
};

export type BuildResult = {
  pattern: string;
  length: number;
  overLimit: boolean;
  warnings: string[];
};
