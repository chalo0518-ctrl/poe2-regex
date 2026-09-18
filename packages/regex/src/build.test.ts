import { describe, expect, it } from "vitest";
import { buildRegex } from "./build.js";
import { MAX_LENGTH } from "./constants.js";
import { matchesItem } from "./match.js";
import type { RegexMod } from "./types.js";

const FIRE: RegexMod = {
  id: "fire",
  match: "to Fire Resistance",
  polarity: "include",
  kind: "numeric",
  numeric: { format: "plusPercent" },
};

const COLD: RegexMod = {
  id: "cold",
  match: "to Cold Resistance",
  polarity: "include",
  kind: "numeric",
  numeric: { format: "plusPercent" },
};

const LIFE: RegexMod = {
  id: "life",
  match: "to maximum Life",
  polarity: "include",
  kind: "numeric",
  numeric: { format: "plusFlat" },
};

const CORPUS = [
  "to Fire Resistance",
  "to Cold Resistance",
  "to Lightning Resistance",
  "to Chaos Resistance",
  "to maximum Life",
  "to maximum Mana",
  "increased Movement Speed",
];

describe("buildRegex", () => {
  it("returns empty output for an empty selection", () => {
    const r = buildRegex([]);
    expect(r.pattern).toBe("");
    expect(r.length).toBe(0);
    expect(r.overLimit).toBe(false);
  });

  it("exports a 250-character display cap", () => {
    expect(MAX_LENGTH).toBe(250);
  });

  it("ORs included mods inside one quoted group", () => {
    const r = buildRegex(
      [FIRE, COLD],
      { corpus: CORPUS, combine: "or" },
    );
    expect(r.pattern.startsWith('"')).toBe(true);
    expect(r.pattern.includes("|")).toBe(true);
    expect(r.length).toBe(r.pattern.length);

    const fireItem = "+35% to Fire Resistance\n+20 to maximum Life";
    const coldItem = "+40% to Cold Resistance";
    const lifeOnly = "+80 to maximum Life";
    expect(matchesItem(r.pattern, fireItem)).toBe(true);
    expect(matchesItem(r.pattern, coldItem)).toBe(true);
    expect(matchesItem(r.pattern, lifeOnly)).toBe(false);
  });

  it("ANDs included mods as separate quoted groups", () => {
    const r = buildRegex([FIRE, LIFE], { corpus: CORPUS, combine: "and" });
    expect(r.pattern.split(" ").length).toBeGreaterThanOrEqual(2);

    const both = "+35% to Fire Resistance\n+80 to maximum Life";
    const fireOnly = "+35% to Fire Resistance";
    expect(matchesItem(r.pattern, both)).toBe(true);
    expect(matchesItem(r.pattern, fireOnly)).toBe(false);
  });

  it("excludes mods with a PoE2 ! group", () => {
    const r = buildRegex(
      [
        LIFE,
        { ...FIRE, polarity: "exclude" },
      ],
      { corpus: CORPUS },
    );
    expect(r.pattern).toContain("!");

    const lifeFire = "+80 to maximum Life\n+20% to Fire Resistance";
    const lifeOnly = "+80 to maximum Life";
    expect(matchesItem(r.pattern, lifeOnly)).toBe(true);
    expect(matchesItem(r.pattern, lifeFire)).toBe(false);
  });

  it("applies a numeric minimum to +% mods", () => {
    const r = buildRegex(
      [{ ...FIRE, numeric: { format: "plusPercent", min: 30 } }],
      { corpus: CORPUS },
    );
    expect(r.pattern).toMatch(/\+/);
    expect(r.pattern).toMatch(/%/);

    expect(matchesItem(r.pattern, "+35% to Fire Resistance")).toBe(true);
    expect(matchesItem(r.pattern, "+12% to Fire Resistance")).toBe(false);
    expect(matchesItem(r.pattern, "+40% to Cold Resistance")).toBe(false);
  });

  it("applies a numeric min and max", () => {
    const r = buildRegex(
      [{ ...LIFE, numeric: { format: "plusFlat", min: 60, max: 90 } }],
      { corpus: CORPUS },
    );
    expect(matchesItem(r.pattern, "+70 to maximum Life")).toBe(true);
    expect(matchesItem(r.pattern, "+40 to maximum Life")).toBe(false);
    expect(matchesItem(r.pattern, "+120 to maximum Life")).toBe(false);
  });

  it("escapes regex metacharacters in match text", () => {
    const r = buildRegex(
      [
        {
          id: "dot",
          match: "rare.item",
          polarity: "include",
          kind: "flag",
        },
      ],
      { corpus: ["rare item", "rare-item"] },
    );
    expect(r.pattern).toMatch(/\\\./);
    expect(() => new RegExp(r.pattern.slice(1, -1))).not.toThrow();
  });

  it("marks overLimit when the pattern exceeds 250 characters", () => {
    const many: RegexMod[] = Array.from({ length: 80 }, (_, i) => ({
      id: `m${i}`,
      match: `unique affix fragment number ${i} xyz`,
      polarity: "include",
      kind: "flag",
    }));
    const r = buildRegex(many, { combine: "or" });
    expect(r.length).toBeGreaterThan(250);
    expect(r.overLimit).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("shortens fragments using the corpus to avoid false positives", () => {
    const r = buildRegex([FIRE], { corpus: CORPUS });
    const inner = r.pattern.slice(1, -1);
    expect(inner.length).toBeLessThan("to Fire Resistance".length);
    expect(matchesItem(r.pattern, "+10% to Fire Resistance")).toBe(true);
    expect(matchesItem(r.pattern, "+10% to Cold Resistance")).toBe(false);
  });

  it("places numeric bounds after the fragment for 简中 suffix stats", () => {
    const r = buildRegex(
      [
        {
          id: "fire-cn",
          match: "火焰抗性",
          polarity: "include",
          kind: "numeric",
          numeric: { format: "plusPercent", min: 30, placement: "after" },
        },
      ],
      { corpus: ["火焰抗性", "冰霜抗性", "闪电抗性"] },
    );
    expect(matchesItem(r.pattern, "火焰抗性 +35%")).toBe(true);
    expect(matchesItem(r.pattern, "火焰抗性 +12%")).toBe(false);
    expect(matchesItem(r.pattern, "+35% to Fire Resistance")).toBe(false);
  });

  it("keeps default placement before the fragment for EN/繁中", () => {
    const r = buildRegex(
      [{ ...FIRE, numeric: { format: "plusPercent", min: 30 } }],
      { corpus: CORPUS },
    );
    expect(matchesItem(r.pattern, "+35% to Fire Resistance")).toBe(true);
    expect(matchesItem(r.pattern, "火焰抗性 +35%")).toBe(false);
  });
});
