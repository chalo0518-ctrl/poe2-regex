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
  family: Pick<AffixFamily, "textZh" | "textEn">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.textEn || family.textZh;
  return family.textZh || family.textEn;
}

export function effectTextSecondary(
  family: Pick<AffixFamily, "textZh" | "textEn">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.textZh;
  return family.textEn;
}

export function familyLabel(
  family: Pick<AffixFamily, "labelZh" | "labelEn">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.labelEn || family.labelZh;
  return family.labelZh || family.labelEn;
}

export function familyLabelSecondary(
  family: Pick<AffixFamily, "labelZh" | "labelEn">,
  locale: UiLocale,
): string {
  if (locale === "en") return family.labelZh;
  return family.labelEn;
}

export function matchText(
  family: Pick<AffixFamily, "match" | "matchZh">,
  lang: MatchLang,
): string {
  if (lang === "en") return family.match || family.matchZh;
  return family.matchZh || family.match;
}

export function matchLangForLocale(locale: UiLocale): MatchLang {
  return locale;
}

export function tagLabel(tag: HarvestTag, locale: UiLocale): string {
  if (locale === "en") return tag.labelEn || tag.labelZh || tag.id;
  return tag.labelZh || tag.labelEn || tag.id;
}

export function affixTagLabels(family: Pick<AffixFamily, "tagsZh">, _locale: UiLocale): string[] {
  return family.tagsZh;
}

export function poolLabel(pool: Pick<PoolMeta, "labelZh" | "labelEn">, locale: UiLocale): string {
  if (locale === "en") return pool.labelEn || pool.labelZh || "";
  return pool.labelZh || pool.labelEn || "";
}

export function chapterLabel(chapter: CampaignChapter, locale: UiLocale): string {
  if (locale === "en") return chapter.labelEn || chapter.labelZh;
  return chapter.labelZh || chapter.labelEn;
}

export function chapterSummary(chapter: CampaignChapter, locale: UiLocale): string {
  if (locale === "en") return chapter.summaryEn || chapter.summaryZh || "";
  return chapter.summaryZh || chapter.summaryEn || "";
}

export function tierName(tier: AffixTier, locale: UiLocale): string {
  if (locale === "en") return tier.nameEn || tier.nameZh;
  return tier.nameZh || tier.nameEn;
}

export function tierEffect(tier: AffixTier, locale: UiLocale): string {
  if (locale === "en") return tier.textEn || tier.textZh;
  return tier.textZh || tier.textEn;
}

/** Clipboard / search needles for import matching — 繁中 + EN only. */
export function importNeedles(family: AffixFamily): string[] {
  return [family.matchZh, family.textZh, family.match, family.textEn].filter(
    (s): s is string => Boolean(s),
  );
}
