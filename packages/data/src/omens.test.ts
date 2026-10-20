import { describe, expect, it } from "vitest";
import {
  REMOVAL_OMENS,
  classifyNonTarget,
  evaluateGreater,
  evaluateLight,
  evaluateSide,
  evaluateWhittling,
  recommendRemoval,
  type RemovalMod,
} from "./omens.ts";

function mod(partial: RemovalMod): RemovalMod {
  return partial;
}

describe("removal omens", () => {
  it("lists the poe2db removal omens and no dark annulment", () => {
    expect(REMOVAL_OMENS.map((omen) => omen.id)).toEqual([
      "whittle",
      "sinistral-erasure",
      "dextral-erasure",
      "sinistral-annulment",
      "dextral-annulment",
      "greater-annulment",
      "light",
    ]);
    const whittle = REMOVAL_OMENS[0]!;
    expect(whittle.nameZh).toBe("削切之兆");
    expect(whittle.ruleZh).toContain("最低等級");
    expect(whittle.ruleEn.toLowerCase()).toContain("lowest level");
    expect(whittle.sources).toContain("https://poe2db.tw/tw/Omen_of_Whittling");
    expect(REMOVAL_OMENS.find((omen) => omen.id === "sinistral-erasure")?.nameZh).toBe("左旋抺除之兆");
    expect(REMOVAL_OMENS.find((omen) => omen.id === "sinistral-annulment")?.currencyZh).toBe("無效石");
    expect(REMOVAL_OMENS.some((omen) => omen.id.includes("dark"))).toBe(false);
  });

  it("classifies non-targets by level against every target tier", () => {
    expect(classifyNonTarget(8, [44, 60])).toBe("acceptable");
    expect(classifyNonTarget(44, [44, 60])).toBe("bad");
    expect(classifyNonTarget(70, [44])).toBe("bad");
    expect(classifyNonTarget(null, [44])).toBe("unknown");
    expect(classifyNonTarget(8, [])).toBe("unknown");
  });

  it("whittles the unique lowest non-target and refuses a target or a tie with one", () => {
    expect(evaluateWhittling([
      mod({ id: "junk", generation: "prefix", level: 8, target: false }),
      mod({ id: "life", generation: "suffix", level: 44, target: true }),
    ])).toEqual({ outcome: "safe", removes: "junk" });

    expect(evaluateWhittling([
      mod({ id: "life", generation: "prefix", level: 44, target: true }),
      mod({ id: "fire", generation: "suffix", level: 64, target: false }),
    ])).toEqual({ outcome: "hits-target", removes: "life" });

    expect(evaluateWhittling([
      mod({ id: "a", generation: "prefix", level: 20, target: false }),
      mod({ id: "b", generation: "suffix", level: 20, target: false }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ]).outcome).toBe("safe-tie");

    expect(evaluateWhittling([
      mod({ id: "junk", generation: "prefix", level: 20, target: false }),
      mod({ id: "life", generation: "suffix", level: 20, target: true }),
    ]).outcome).toBe("risky-tie");

    expect(evaluateWhittling([
      mod({ id: "junk", generation: "prefix", level: null, target: false }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ]).outcome).toBe("unknown-level");

    expect(evaluateWhittling([]).outcome).toBe("empty");
  });

  it("ignores fractured mods when choosing the lowest level", () => {
    const result = evaluateWhittling([
      mod({ id: "locked", generation: "prefix", level: 1, target: false, fractured: true }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ]);
    expect(result).toEqual({ outcome: "hits-target", removes: "life" });
  });

  it("treats a side as safe only when every removable mod there is junk", () => {
    const mods = [
      mod({ id: "junk", generation: "prefix", level: 70, target: false }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ];
    expect(evaluateSide(mods, "prefix")).toBe("safe");
    expect(evaluateSide(mods, "suffix")).toBe("risky");
    expect(evaluateSide([
      mod({ id: "locked", generation: "prefix", level: 10, target: true, fractured: true }),
    ], "prefix")).toBe("empty");
  });

  it("lets Light hit only a non-target desecrated mod", () => {
    expect(evaluateLight([
      mod({ id: "junk", generation: "prefix", level: 80, target: false, desecrated: true }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ])).toBe("safe");
    expect(evaluateLight([
      mod({ id: "life", generation: "prefix", level: 40, target: true, desecrated: true }),
    ])).toBe("hits-target");
    expect(evaluateLight([
      mod({ id: "life", generation: "prefix", level: 40, target: true }),
    ])).toBe("none");
  });

  it("does not recommend Greater Annulment when a more precise omen exists", () => {
    expect(evaluateGreater([
      mod({ id: "a", generation: "prefix", level: 8, target: false }),
      mod({ id: "b", generation: "suffix", level: 12, target: false }),
    ])).toBe("safe");
    expect(evaluateGreater([
      mod({ id: "a", generation: "prefix", level: 8, target: false }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ])).toBe("risky");
    const recommended = recommendRemoval([
      mod({ id: "a", generation: "prefix", level: 8, target: false }),
      mod({ id: "b", generation: "suffix", level: 12, target: false }),
    ], [40]);
    expect(recommended.greater).toBe("safe");
    expect(recommended.recommendation).toBe("whittle");
  });

  it("prefers whittle, then the safe side, then light, then stop", () => {
    expect(recommendRemoval([
      mod({ id: "junk", generation: "prefix", level: 8, target: false }),
      mod({ id: "life", generation: "suffix", level: 44, target: true }),
    ], [44]).recommendation).toBe("whittle");

    const side = recommendRemoval([
      mod({ id: "junk", generation: "prefix", level: 80, target: false }),
      mod({ id: "life", generation: "suffix", level: 40, target: true }),
    ], [40]);
    expect(side.recommendation).toBe("sinistral-annulment");
    expect(side.classes).toEqual([{ id: "junk", classification: "bad" }]);

    expect(recommendRemoval([
      mod({ id: "junk", generation: "suffix", level: 80, target: false }),
      mod({ id: "life", generation: "prefix", level: 40, target: true }),
    ], [40]).recommendation).toBe("dextral-annulment");

    expect(recommendRemoval([
      mod({ id: "keep", generation: "suffix", level: 40, target: true, fractured: true }),
      mod({ id: "open", generation: "suffix", level: 15, target: true }),
      mod({ id: "bad", generation: "suffix", level: 70, target: false, desecrated: true }),
    ], [40, 15]).recommendation).toBe("light");

    expect(recommendRemoval([
      mod({ id: "life", generation: "prefix", level: 44, target: true }),
      mod({ id: "res", generation: "suffix", level: 50, target: true }),
      mod({ id: "fire", generation: "suffix", level: 64, target: false }),
    ], [44, 50]).recommendation).toBe("stop");
  });
});
