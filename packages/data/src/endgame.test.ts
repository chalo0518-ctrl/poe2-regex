import { describe, expect, it } from "vitest";
import {
  tabletCatalog,
  tabletFamilies,
  tabletKinds,
  waystoneCatalog,
  waystoneFamilies,
  waystoneTiers,
} from "./index.ts";

describe("waystone pools", () => {
  it("keeps low / mid / top as independent scrapes", () => {
    expect(waystoneTiers.map((t) => t.id)).toEqual(["low", "mid", "top"]);
    const low = waystoneFamilies("low");
    const mid = waystoneFamilies("mid");
    const top = waystoneFamilies("top");
    expect(low.length).toBeGreaterThan(0);
    expect(mid.length).toBeGreaterThan(0);
    expect(top.length).toBeGreaterThan(0);
    expect(low.every((f) => f.tier === "low")).toBe(true);
    expect(mid.every((f) => f.tier === "mid")).toBe(true);
    expect(top.every((f) => f.tier === "top")).toBe(true);
    expect(low.every((f) => f.id.startsWith("waystone:low|"))).toBe(true);
  });

  it("does not reuse one union list for every tier", () => {
    const lowIds = waystoneFamilies("low").map((f) => f.family).sort();
    const midIds = waystoneFamilies("mid").map((f) => f.family).sort();
    expect(lowIds).not.toEqual(midIds);
    expect(waystoneCatalog.counts.low.families).toBe(waystoneFamilies("low").length);
  });
});

describe("tablet kind pools", () => {
  it("scrapes each kind into its own array", () => {
    expect(tabletKinds.map((k) => k.id)).toEqual([
      "breach",
      "expedition",
      "delirium",
      "ritual",
      "irradiated",
      "overseer",
      "abyss",
      "temple",
    ]);
    for (const kind of tabletKinds) {
      const pool = tabletFamilies(kind.id);
      expect(pool.length, kind.id).toBeGreaterThan(0);
      expect(pool.every((f) => f.tabletKind === kind.id)).toBe(true);
      expect(pool.every((f) => f.id.startsWith(`tablet:${kind.id}|`))).toBe(true);
      expect(tabletCatalog.counts[kind.id].families).toBe(pool.length);
    }
  });

  it("does not expose a union-all list as the kind filter", () => {
    const unionSize = new Set(
      tabletKinds.flatMap((k) => tabletFamilies(k.id).map((f) => f.family)),
    ).size;
    const irradiated = tabletFamilies("irradiated");
    expect(irradiated.length).toBeLessThan(unionSize);
    expect(tabletFamilies("breach").length).not.toBe(unionSize);
    const breachOnly = tabletFamilies("breach").filter((f) =>
      /裂痕|裂隙|Breach|巢裔|胎贈/.test(`${f.textZh} ${f.textEn} ${f.textZhHans ?? ""}`),
    );
    const expeditionHasBreach = tabletFamilies("expedition").filter((f) =>
      /裂痕|巢裔之血|胎贈/.test(f.textZh),
    );
    expect(breachOnly.length).toBeGreaterThan(0);
    expect(expeditionHasBreach.length).toBe(0);
  });
});
