import type {
  AffixFamily,
  AffixTier,
  CampaignChapter,
  HarvestTag,
  MatchLang,
  PoolMeta,
  UiLocale,
} from "./types.ts";

export function effectText(
  family: Pick<AffixFamily, "textZh" | "textEn" | "textZhHans">,
  locale: UiLocale,
): string {
  if (locale === "zh-Hans") return family.textZhHans || family.textZh || family.textEn;
  if (locale === "en") return family.textEn || family.textZhHans || family.textZh;
  return family.textZh || family.textZhHans || family.textEn;
}

export function effectTextSecondary(
  family: Pick<AffixFamily, "textZh" | "textEn" | "textZhHans">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.textZhHans || family.textZh;
  return family.textEn;
}

export function familyLabel(
  family: Pick<AffixFamily, "labelZh" | "labelEn" | "labelZhHans">,
  locale: UiLocale,
): string {
  if (locale === "zh-Hans") return family.labelZhHans || family.labelZh || family.labelEn;
  if (locale === "en") return family.labelEn || family.labelZhHans || family.labelZh;
  return family.labelZh || family.labelZhHans || family.labelEn;
}

export function familyLabelSecondary(
  family: Pick<AffixFamily, "labelZh" | "labelEn" | "labelZhHans">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.labelZhHans || family.labelZh;
  return family.labelEn;
}

export function matchText(
  family: Pick<AffixFamily, "match" | "matchZh" | "matchZhHans">,
  lang: MatchLang,
): string {
  if (lang === "zh-Hans") return family.matchZhHans || family.matchZh || family.match;
  if (lang === "en") return family.match || family.matchZhHans || family.matchZh;
  return family.matchZh || family.matchZhHans || family.match;
}

export function matchLangForLocale(locale: UiLocale): MatchLang {
  return locale;
}

export function tagLabel(tag: HarvestTag, locale: UiLocale): string {
  if (locale === "zh-Hans") return tag.labelZhHans || tag.labelZh || tag.labelEn || tag.id;
  if (locale === "en") return tag.labelEn || tag.labelZhHans || tag.labelZh || tag.id;
  return tag.labelZh || tag.labelZhHans || tag.labelEn || tag.id;
}

export function affixTagLabels(family: Pick<AffixFamily, "tagsZh" | "tagsZhHans">, locale: UiLocale): string[] {
  if (locale === "zh-Hans" && family.tagsZhHans?.length) return family.tagsZhHans;
  if (locale === "en") return family.tagsZhHans?.length ? family.tagsZhHans : family.tagsZh;
  return family.tagsZh;
}

export function poolLabel(pool: Pick<PoolMeta, "labelZh" | "labelZhHans" | "labelEn">, locale: UiLocale): string {
  if (locale === "zh-Hans") return pool.labelZhHans || pool.labelZh || pool.labelEn || "";
  if (locale === "en") return pool.labelEn || pool.labelZhHans || pool.labelZh;
  return pool.labelZh || pool.labelZhHans || pool.labelEn || "";
}

export function chapterLabel(chapter: CampaignChapter, locale: UiLocale): string {
  if (locale === "zh-Hans") return chapter.labelZhHans || chapter.labelZh || chapter.labelEn;
  if (locale === "en") return chapter.labelEn || chapter.labelZhHans || chapter.labelZh;
  return chapter.labelZh || chapter.labelZhHans || chapter.labelEn;
}

export function chapterSummary(chapter: CampaignChapter, locale: UiLocale): string {
  if (locale === "zh-Hans") return chapter.summaryZhHans || chapter.summaryZh || chapter.summaryEn || "";
  if (locale === "en") return chapter.summaryEn || chapter.summaryZhHans || chapter.summaryZh;
  return chapter.summaryZh || chapter.summaryZhHans || chapter.summaryEn || "";
}

export function tierName(tier: AffixTier, locale: UiLocale): string {
  if (locale === "zh-Hans") return tier.nameZhHans || tier.nameZh || tier.nameEn;
  if (locale === "en") return tier.nameEn || tier.nameZhHans || tier.nameZh;
  return tier.nameZh || tier.nameZhHans || tier.nameEn;
}

export function tierEffect(tier: AffixTier, locale: UiLocale): string {
  if (locale === "zh-Hans") return tier.textZhHans || tier.textZh || tier.textEn;
  if (locale === "en") return tier.textEn || tier.textZhHans || tier.textZh;
  return tier.textZh || tier.textZhHans || tier.textEn;
}

/** Clipboard / search needles for import matching — every real locale we have. */
export function importNeedles(family: AffixFamily): string[] {
  return [
    family.matchZhHans,
    family.textZhHans,
    family.matchZh,
    family.textZh,
    family.match,
    family.textEn,
  ].filter((s): s is string => Boolean(s));
}
