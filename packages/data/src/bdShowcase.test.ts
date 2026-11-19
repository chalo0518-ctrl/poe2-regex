import { describe, expect, it } from "vitest";
import { craftingFamiliesFor, earlyGearCatalog } from "./index.ts";
import {
  SEASON_BD_V1,
  SHOWCASE_SIDE_CAP,
  catalogForDollSlot,
  memorialGear,
  paperDollSlots,
  recommendedGear,
  setShowcasePick,
  showcaseCatalog,
  showcaseImageUrl,
  showcaseLines,
  type BdShowcase,
  type MemorialGear,
  type ShowcasePick,
} from "./bdShowcase.ts";

describe("season BD paper doll", () => {
  it("aligns slots with poe.ninja: weapon sets, armour, jewellery, two flasks, three charms", () => {
    expect(paperDollSlots.map((slot) => slot.id)).toEqual([
      "weapon-1-main",
      "weapon-1-off",
      "weapon-2-main",
      "weapon-2-off",
      "helmet",
      "body",
      "gloves",
      "boots",
      "amulet",
      "ring-1",
      "ring-2",
      "belt",
      "flask-life",
      "flask-mana",
      "charm-1",
      "charm-2",
      "charm-3",
    ]);
    expect(paperDollSlots.filter((slot) => slot.group === "weapon-1")).toHaveLength(2);
    expect(paperDollSlots.filter((slot) => slot.group === "weapon-2")).toHaveLength(2);
    expect(paperDollSlots.filter((slot) => slot.group === "flask")).toHaveLength(2);
    expect(paperDollSlots.filter((slot) => slot.group === "charm")).toHaveLength(3);
    expect(SHOWCASE_SIDE_CAP).toBe(3);
  });

  it("ships an empty shell and never invents memorial gear", () => {
    expect(SEASON_BD_V1.ninjaUrl).toBeNull();
    expect(SEASON_BD_V1.memorial).toBeNull();
    expect(SEASON_BD_V1.recommended).toEqual({});
    for (const slot of paperDollSlots) {
      expect(memorialGear(SEASON_BD_V1, slot.id)).toBeNull();
      const gear = recommendedGear(SEASON_BD_V1, slot.id);
      expect(gear.nameZh).toBe("");
      expect(gear.nameEn).toBe("");
      expect(gear.imageUrl).toBe("");
      expect(gear.baseZh).toBe("");
      expect(gear.implicits).toEqual([]);
      expect(gear.affixes).toEqual([]);
    }
  });

  it("returns a transcribed memorial item only for slots that were copied in", () => {
    const body: MemorialGear = {
      nameZh: "測試胸甲",
      nameEn: "Test body",
      imageUrl: "https://poe2db.tw/image/Art/2DItems/test.png",
      baseZh: "專家胸甲",
      baseEn: "Expert Robe",
      implicits: [{ textZh: "+10 護甲", textEn: "+10 to Armour" }],
      affixes: [{ generation: "prefix", textZh: "+80 最大生命", textEn: "+80 to maximum Life" }],
    };
    const snapshot: BdShowcase = { ...SEASON_BD_V1, memorial: { body } };
    expect(memorialGear(snapshot, "body")).toEqual(body);
    expect(memorialGear(snapshot, "helmet")).toBeNull();
    expect(memorialGear(snapshot, "charm-1")).toBeNull();
  });
});

describe("recommended affix catalog", () => {
  it("reuses the crafting library and filters it by base pool", () => {
    expect(showcaseCatalog("helmet", null).map((family) => family.id)).toEqual(
      craftingFamiliesFor("helmet").map((family) => family.id),
    );
    const strBodies = earlyGearCatalog.byCategory.body.str;
    expect(showcaseCatalog("body", "str").map((family) => family.id)).toEqual(
      strBodies.map((family) => family.id),
    );
    expect(strBodies.length).toBeGreaterThan(0);
    expect(showcaseCatalog("body", "str").length).toBeLessThan(showcaseCatalog("body", null).length);
    expect(showcaseCatalog("body", "not-a-pool")).toEqual([]);
    expect(catalogForDollSlot("helmet", recommendedGear(SEASON_BD_V1, "helmet")).map((family) => family.id)).toEqual(
      craftingFamiliesFor("helmet").map((family) => family.id),
    );
    expect(catalogForDollSlot("weapon-1-main", recommendedGear(SEASON_BD_V1, "weapon-1-main"))).toEqual([]);
    expect(catalogForDollSlot("flask-life", recommendedGear(SEASON_BD_V1, "flask-life"))).toEqual([]);
    expect(catalogForDollSlot("charm-2", recommendedGear(SEASON_BD_V1, "charm-2"))).toEqual([]);
  });

  it("uses a recorded weapon class without inventing one", () => {
    const gear = {
      ...recommendedGear(SEASON_BD_V1, "weapon-1-main"),
      craftSlot: "bow" as const,
      basePoolId: null,
    };
    expect(catalogForDollSlot("weapon-1-main", gear).map((family) => family.id)).toEqual(
      craftingFamiliesFor("bow").map((family) => family.id),
    );
  });

  it("pads unspecified prefixes and suffixes and does not rank inside a rank", () => {
    const catalog = showcaseCatalog("body", null);
    const prefixes = distinctSide(catalog, "prefix", 2);
    const suffix = distinctSide(catalog, "suffix", 1)[0];
    const [first, second] = prefixes;
    const insertedLater: ShowcasePick[] = [
      { familyId: second.id, rank: "required" },
      { familyId: first.id, rank: "required" },
      { familyId: suffix.id, rank: "optional" },
    ];
    const insertedEarlier: ShowcasePick[] = [
      { familyId: first.id, rank: "required" },
      { familyId: suffix.id, rank: "optional" },
      { familyId: second.id, rank: "required" },
    ];
    const lines = showcaseLines(insertedLater, catalog);
    expect(showcaseLines(insertedEarlier, catalog)).toEqual(lines);
    const prefixIds = lines.prefixes.flatMap((line) => (line.kind === "affix" ? [line.familyId] : []));
    const catalogOrder = [...prefixes].sort(
      (a, b) => catalog.indexOf(a) - catalog.indexOf(b),
    );
    expect(prefixIds).toEqual(catalogOrder.map((family) => family.id));
    expect(lines.prefixes.filter((line) => line.kind === "empty")).toHaveLength(1);
    expect(lines.suffixes.filter((line) => line.kind === "affix").every((line) => line.kind === "affix" && line.rank === "optional")).toBe(true);
    expect(lines.suffixes.filter((line) => line.kind === "empty")).toHaveLength(2);
    expect(lines.prefixes.every((line) => !("tier" in line))).toBe(true);

    const empty = showcaseLines([], catalog);
    expect(empty.prefixes.filter((line) => line.kind === "empty")).toHaveLength(3);
    expect(empty.suffixes.filter((line) => line.kind === "empty")).toHaveLength(3);
    expect(empty.prefixes[0]).toEqual({ kind: "empty", generation: "prefix" });
    expect(empty.suffixes[0]).toEqual({ kind: "empty", generation: "suffix" });
  });

  it("keeps at most three prefixes and three suffixes, and only two ranks", () => {
    const catalog = showcaseCatalog("ring", null);
    const prefixes = distinctSide(catalog, "prefix", 4);
    let picks: ShowcasePick[] = [];
    for (const family of prefixes) {
      picks = setShowcasePick(picks, family, catalog, "required");
    }
    expect(picks).toHaveLength(3);
    expect(picks.every((pick) => pick.rank === "required")).toBe(true);
    expect(Object.keys(picks[0]).sort()).toEqual(["familyId", "rank"]);

    picks = setShowcasePick(picks, prefixes[0], catalog, "optional");
    expect(picks.find((pick) => pick.familyId === prefixes[0].id)?.rank).toBe("optional");
    expect(picks).toHaveLength(3);

    picks = setShowcasePick(picks, prefixes[0], catalog, null);
    expect(picks.some((pick) => pick.familyId === prefixes[0].id)).toBe(false);

    const suffixes = distinctSide(catalog, "suffix", 4);
    let suffixPicks: ShowcasePick[] = [];
    for (const family of suffixes) {
      suffixPicks = setShowcasePick(suffixPicks, family, catalog, "optional");
    }
    expect(suffixPicks).toHaveLength(3);
  });
});

describe("chronicle images", () => {
  it("accepts poe2db.tw and rejects poe.ninja and PoE1 poedb", () => {
    expect(showcaseImageUrl("https://poe2db.tw/image/Art/2DItems/Armours/x.png")).toBe(
      "https://poe2db.tw/image/Art/2DItems/Armours/x.png",
    );
    expect(showcaseImageUrl("https://www.poe2db.tw/image/x.webp")).toBe("https://www.poe2db.tw/image/x.webp");
    expect(showcaseImageUrl("https://poe.ninja/image/item.png")).toBeNull();
    expect(showcaseImageUrl("https://web.poe.ninja/image/item.png")).toBeNull();
    expect(showcaseImageUrl("https://poedb.tw/image/item.png")).toBeNull();
    expect(showcaseImageUrl("http://poe2db.tw/image/x.png")).toBeNull();
    expect(showcaseImageUrl("")).toBeNull();
  });
});

function distinctSide(
  catalog: ReturnType<typeof showcaseCatalog>,
  generation: "prefix" | "suffix",
  limit: number,
) {
  const picked = [];
  const seen = new Set<string>();
  for (const family of catalog) {
    if (family.generation !== generation || seen.has(family.family)) continue;
    seen.add(family.family);
    picked.push(family);
    if (picked.length === limit) return picked;
  }
  throw new Error(`need ${limit} distinct ${generation} groups`);
}
