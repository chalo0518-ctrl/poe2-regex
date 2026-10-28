/** Compact chrome for endgame tablet builders. Shields keep defaults. */
export const endgameModBuilderChrome = {
  showTags: false,
  showFilter: false,
  showImport: false,
  showHideToggle: false,
  showFamilyNames: false,
  showAffixTags: false,
} as const;

/** Tablet list polish: search, click-to-include, inline ranges, sticky chips. */
export const endgameTabletChrome = {
  ...endgameModBuilderChrome,
  showSearch: true,
  hanFold: true,
  quickPolarity: true,
  showInlineRange: true,
  showSelectionChips: true,
  pinSelectionCounts: true,
  polarityStyle: "yon",
} as const;
