import { describe, expect, it } from "vitest";
import { recognizeMemorialTier } from "./memorialTier.ts";

const life = {
  family: "Life",
  generation: "prefix" as const,
  tiers: [
    { nameZh: "", nameEn: "", level: 12, dropChance: 1, textEn: "+(20–29) to maximum Life", textZh: "+(20–29)最大生命" },
    { nameZh: "", nameEn: "", level: 32, dropChance: 1, textEn: "+(29–39) to maximum Life", textZh: "+(29–39)最大生命" },
  ],
};

describe("automatic memorial affix tiers", () => {
  it("matches English or Traditional Chinese rolls to the original pool ranking", () => {
    expect(recognizeMemorialTier({ textEn: "+34 to maximum Life", textZh: "" }, [[life]], 40, "prefix")).toBe(1);
    expect(recognizeMemorialTier({ textEn: "", textZh: "+24最大生命" }, [[life]], 40)).toBe(2);
  });

  it("keeps overlapping rolls unknown unless the item level disambiguates them", () => {
    const mod = { textEn: "+29 to maximum Life", textZh: "" };
    expect(recognizeMemorialTier(mod, [[life]], 40)).toBeUndefined();
    expect(recognizeMemorialTier(mod, [[life]], 25)).toBe(2);
    expect(recognizeMemorialTier(mod, [[life]], 25, "suffix")).toBeUndefined();
  });
});
