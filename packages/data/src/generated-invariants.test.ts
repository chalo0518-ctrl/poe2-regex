import { describe, expect, it } from "vitest";
import { harvestTags, shieldFamilies, tabletCatalog, waystoneCatalog } from "./index.ts";

describe("frozen generated JSON invariants", () => {
  it("keeps unique shield ids, bases, and match strings", () => {
    const ids = new Set(shieldFamilies.map((f) => f.id));
    expect(ids.size).toBe(shieldFamilies.length);
    expect(shieldFamilies.length).toBeGreaterThan(10);
    expect(shieldFamilies.every((f) => f.bases.length > 0)).toBe(true);
    expect(shieldFamilies.every((f) => Boolean(f.matchZh && (f.match || f.textEn)))).toBe(true);
    expect(harvestTags.some((t) => t.id === "fire")).toBe(true);
  });

  it("keeps independent waystone pools with matching counts", () => {
    for (const tier of waystoneCatalog.tiers) {
      const list = waystoneCatalog.byTier[tier.id];
      expect(list.length).toBe(waystoneCatalog.counts[tier.id].families);
      expect(list.every((f) => f.tier === tier.id)).toBe(true);
      expect(list.every((f) => f.id.startsWith(`waystone:${tier.id}|`))).toBe(true);
      expect(list.every((f) => f.matchZh && f.textZh)).toBe(true);
    }
  });

  it("keeps per-kind tablet pools with matching counts", () => {
    for (const kind of tabletCatalog.kinds) {
      const list = tabletCatalog.byKind[kind.id];
      expect(list.length).toBe(tabletCatalog.counts[kind.id].families);
      expect(list.every((f) => f.tabletKind === kind.id)).toBe(true);
      expect(list.every((f) => f.id.startsWith(`tablet:${kind.id}|`))).toBe(true);
      expect(list.every((f) => f.matchZh && f.textZh)).toBe(true);
    }
  });
});
