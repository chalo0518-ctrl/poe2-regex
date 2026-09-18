export type Polarity = "include" | "or" | "exclude";
export type ModKind = "flag" | "numeric";
export type CombineMode = "or" | "and";

export type NumericFormat =
  | "plusPercent"
  | "plusFlat"
  | "percentPrefix"
  | "bare";

/** Where the rolled number sits relative to the unique match fragment. */
export type NumericPlacement = "before" | "after";

export type NumericConstraint = {
  min?: number;
  max?: number;
  format?: NumericFormat;
  /**
   * EN/繁中 resists are `+N% rest`. Some effect strings put the number
   * after the unique fragment (`rest +N%`). Default `before` keeps existing
   * stash patterns.
   */
  placement?: NumericPlacement;
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
