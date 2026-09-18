export type ModKind = "flag" | "numeric";

export type NumericFormat =
  | "plusPercent"
  | "plusFlat"
  | "percentPrefix"
  | "bare";

export type ShieldBaseId = "str" | "str_dex" | "str_int" | "buckler";

export type WaystoneTierId = "low" | "mid" | "top";

export type TabletKindId =
  | "breach"
  | "expedition"
  | "delirium"
  | "ritual"
  | "irradiated"
  | "overseer"
  | "abyss"
  | "temple";

export type HarvestTag = {
  id: string;
  labelZh: string;
};

export type AffixTier = {
  nameZh: string;
  nameEn: string;
  level: number;
  textZh: string;
  textEn: string;
  dropChance: number;
  statMin?: number;
  statMax?: number;
};

export type AffixFamily = {
  id: string;
  family: string;
  generation: "prefix" | "suffix";
  tags: string[];
  tagsZh: string[];
  labelZh: string;
  labelEn: string;
  textZh: string;
  textEn: string;
  match: string;
  matchZh: string;
  kind: ModKind;
  numeric?: {
    format: NumericFormat;
    suggestedMin?: number;
    suggestedMax?: number;
  };
  tiers: AffixTier[];
  minLevel: number;
  maxLevel: number;
  tierCount: number;
  weight: number;
};

export type ShieldTier = AffixTier;

export type ShieldFamily = AffixFamily & {
  bases: ShieldBaseId[];
};

export type WaystoneFamily = AffixFamily & {
  tier: WaystoneTierId;
};

export type TabletFamily = AffixFamily & {
  tabletKind: TabletKindId;
};

export type ShieldBaseMeta = {
  id: ShieldBaseId;
  labelZh: string;
  path: string;
};

export type PoolMeta<Id extends string = string> = {
  id: Id;
  labelZh: string;
  path: string;
};

export type PoolCount = {
  families: number;
  tiers: number;
  skippedEmpty: number;
  rawNormal: number;
};

export type DataMeta = {
  source: string;
  pages: string[];
  gameVersion: string;
  generatedAt: string;
  familyCount: number;
  tierCount: number;
  bases: ShieldBaseMeta[];
  notes: string;
};

export type WaystoneCatalog = {
  source: string;
  generatedAt: string;
  notes: string;
  harvestTags: HarvestTag[];
  tiers: PoolMeta<WaystoneTierId>[];
  counts: Record<WaystoneTierId, PoolCount>;
  byTier: Record<WaystoneTierId, WaystoneFamily[]>;
};

export type TabletCatalog = {
  source: string;
  generatedAt: string;
  notes: string;
  harvestTags: HarvestTag[];
  kinds: PoolMeta<TabletKindId>[];
  counts: Record<TabletKindId, PoolCount>;
  byKind: Record<TabletKindId, TabletFamily[]>;
};

export type TagState = "off" | "include" | "exclude";

export type ChapterId = "act-1" | "act-2" | "act-3" | "act-4" | "act-5";

export type CampaignMapNode = {
  id: string;
  labelZh: string;
  labelEn: string;
};

export type ShopMod = {
  id: string;
  family: string;
  generation: "prefix" | "suffix";
  labelZh: string;
  labelEn: string;
  textZh: string;
  textEn: string;
  match: string;
  matchZh: string;
  kind: ModKind;
  numeric?: {
    format: NumericFormat;
    suggestedMin?: number;
    suggestedMax?: number;
  };
  tags: string[];
  tagsZh: string[];
  /** poe2db / frozen JSON paths this match string was checked against */
  sources: string[];
};

export type ChapterShopPick = {
  modId: string;
  polarity: "include" | "exclude";
  min?: number;
  max?: number;
};

export type CampaignChapter = {
  id: ChapterId;
  labelZh: string;
  labelEn: string;
  summaryZh: string;
  /** Town / map shop nodes. Empty until campaign map data exists. */
  maps: CampaignMapNode[];
  defaultPicks: ChapterShopPick[];
};

export type ShopPickState = {
  polarity: "include" | "exclude";
  min: string;
  max: string;
};
