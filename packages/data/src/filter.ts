import type { AffixFamily, TagState } from "./types.ts";

export function hasHarvestTag(family: Pick<AffixFamily, "tags">, harvestId: string): boolean {
  return family.tags.some(
    (tag) =>
      tag === harvestId ||
      tag.endsWith(`_${harvestId}`) ||
      tag.startsWith(`${harvestId}_`),
  );
}

export function cycleTagState(state: TagState): TagState {
  if (state === "off") return "include";
  if (state === "include") return "exclude";
  return "off";
}

/** Include tags OR-union; exclude tags remove matches. */
export function matchesTagFilter(
  family: Pick<AffixFamily, "tags">,
  tagStates: Record<string, TagState>,
): boolean {
  const includes = Object.entries(tagStates)
    .filter(([, s]) => s === "include")
    .map(([id]) => id);
  const excludes = Object.entries(tagStates)
    .filter(([, s]) => s === "exclude")
    .map(([id]) => id);

  if (excludes.some((id) => hasHarvestTag(family, id))) return false;
  if (includes.length === 0) return true;
  return includes.some((id) => hasHarvestTag(family, id));
}

export function matchesText(family: AffixFamily, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const blob = [
    family.labelZh,
    family.labelEn,
    family.labelZhHans,
    family.textZh,
    family.textEn,
    family.textZhHans,
    family.match,
    family.matchZh,
    family.matchZhHans,
    family.family,
    ...family.tagsZh,
    ...(family.tagsZhHans ?? []),
    ...family.tiers.flatMap((t) => [
      t.nameZh,
      t.nameEn,
      t.nameZhHans,
      t.textZh,
      t.textEn,
      t.textZhHans,
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

export function matchesIlvl(
  family: Pick<AffixFamily, "tiers">,
  minIlvl?: number,
  maxIlvl?: number,
): boolean {
  return family.tiers.some((tier) => {
    if (minIlvl != null && tier.level < minIlvl) return false;
    if (maxIlvl != null && tier.level > maxIlvl) return false;
    return true;
  });
}
