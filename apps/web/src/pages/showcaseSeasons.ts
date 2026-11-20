import { SEASON_BD_V1, type BdShowcase } from "@poe2-regex/data";

export type ShowcaseSeason = {
  id: string;
  snapshot: BdShowcase;
  updateImage?: string;
  previewImage?: string;
  previewStyle?: "canvas";
};

export const SHOWCASE_SEASONS: readonly ShowcaseSeason[] = [
  {
    id: "runes-of-aldur",
    snapshot: SEASON_BD_V1,
    updateImage: "https://cdn.mos.cms.futurecdn.net/P4uB2XdCnUnyvRC4k4GSDk.png",
    previewStyle: "canvas",
  },
];

export function seasonHref(path: string, seasonId?: string | null) {
  return seasonId && seasonId !== "current" && seasonId !== SHOWCASE_SEASONS[0].id
    ? `${path}?season=${encodeURIComponent(seasonId)}`
    : path;
}
