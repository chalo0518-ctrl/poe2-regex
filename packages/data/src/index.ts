import type {
  AffixFamily,
  DataMeta,
  HarvestTag,
  ShieldFamily,
  TabletCatalog,
  TabletFamily,
  TabletKindId,
  WaystoneCatalog,
  WaystoneFamily,
  WaystoneTierId,
} from "./types.ts";
import shieldsJson from "../generated/shields.json";
import tagsJson from "../generated/tags.json";
import metaJson from "../generated/meta.json";
import waystonesJson from "../generated/waystones.json";
import tabletsJson from "../generated/tablets.json";

export type {
  AffixFamily,
  AffixTier,
  CampaignChapter,
  CampaignMapNode,
  ChapterId,
  ChapterShopPick,
  DataMeta,
  EarlyGearCatalog,
  EarlyGearCategoryId,
  EarlyGearCategoryMeta,
  EarlyGearFamily,
  EarlyGearSlotId,
  HarvestTag,
  MatchLang,
  ModKind,
  NumericFormat,
  PoolCount,
  PoolMeta,
  ShieldBaseId,
  ShieldBaseMeta,
  ShieldFamily,
  ShieldTier,
  ShopMod,
  ShopPickState,
  TabletCatalog,
  TabletFamily,
  TabletKindId,
  TagState,
  UiLocale,
  WaystoneCatalog,
  WaystoneFamily,
  WaystoneTierId,
} from "./types.ts";

export {
  cycleTagState,
  hasHarvestTag,
  matchesIlvl,
  matchesTagFilter,
  matchesText,
} from "./filter.ts";

export {
  affixTagLabels,
  chapterLabel,
  chapterSummary,
  effectText,
  effectTextSecondary,
  familyLabel,
  familyLabelSecondary,
  importNeedles,
  matchLangForLocale,
  matchText,
  poolLabel,
  tagLabel,
  tierEffect,
  tierName,
} from "./locale.ts";

export {
  CAMPAIGN_GAPS,
  CAMPAIGN_GAPS_I18N,
  campaignChapters,
  defaultPicksForChapter,
  getChapter,
  isChapterId,
  shopFamilies,
  shopFamilyId,
  shopModById,
  shopMods,
  shopModToFamily,
} from "./campaign.ts";

export {
  WAYSTONE_RANGE_AXES,
  WAYSTONE_STAT_AXES,
  isWaystoneRangeAxis,
  waystoneAllFamilies,
  waystoneStatHits,
  waystoneStatRange,
  waystoneStatThresholds,
} from "./waystones.ts";
export type {
  WaystoneAffixAxisId,
  WaystoneFilterInput,
  WaystoneRangeBounds,
  WaystoneRangeId,
  WaystoneStatAxis,
  WaystoneStatEffect,
  WaystoneStatHit,
  WaystoneStatId,
  WaystoneStatThresholdInput,
} from "./waystones.ts";

export {
  earlyGearCatalog,
  earlyGearFamiliesFor,
  earlyGearSlotMeta,
  earlyGearSlots,
  earlyGearSourcePath,
  isEarlyGearCategoryId,
  isEarlyGearSlotId,
  unionAffixLists,
} from "./earlyGear.ts";
export type { EarlyGearSlot } from "./earlyGear.ts";

export const shieldFamilies = shieldsJson as ShieldFamily[];
export const harvestTags = tagsJson as HarvestTag[];
export const dataMeta = metaJson as DataMeta;

export const waystoneCatalog = waystonesJson as WaystoneCatalog;
export const tabletCatalog = tabletsJson as TabletCatalog;

export const waystoneTiers = waystoneCatalog.tiers;
export const waystoneFamiliesByTier = waystoneCatalog.byTier;
export const waystoneHarvestTags = waystoneCatalog.harvestTags;

export const tabletKinds = tabletCatalog.kinds;
export const tabletFamiliesByKind = tabletCatalog.byKind;
export const tabletHarvestTags = tabletCatalog.harvestTags;

export function waystoneFamilies(tier: WaystoneTierId): WaystoneFamily[] {
  return waystoneFamiliesByTier[tier] ?? [];
}

export function tabletFamilies(kind: TabletKindId): TabletFamily[] {
  return tabletFamiliesByKind[kind] ?? [];
}

/** Families for one tablet kind only — never a cross-kind union. */
export function tabletPoolForKind(kind: TabletKindId): AffixFamily[] {
  return tabletFamilies(kind);
}
