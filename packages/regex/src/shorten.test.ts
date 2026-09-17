import { describe, expect, it } from "vitest";
import { shortestUnique } from "./shorten.js";

describe("shortestUnique", () => {
  it("returns a slice that does not appear in others", () => {
    const fire = shortestUnique("to Fire Resistance", [
      "to Cold Resistance",
      "to Lightning Resistance",
      "to Chaos Resistance",
    ]);
    expect(fire.length).toBeLessThan("to Fire Resistance".length);
    expect("to Cold Resistance".includes(fire)).toBe(false);
    expect("to Fire Resistance".includes(fire)).toBe(true);
  });

  it("falls back to the full string when nothing is unique", () => {
    expect(shortestUnique("life", ["lifetime", "lifeline"])).toBe("life");
  });

  it("does not shorten CJK to a single character", () => {
    const slice = shortestUnique("最大生命", [
      "火焰抗性",
      "冰冷抗性",
      "護甲值",
      "最大火焰抗性",
      "最大全元素抗性",
    ]);
    expect(slice).toBe("生命");
  });

  it("keeps Latin fragments at least 3 characters", () => {
    const fire = shortestUnique("to Fire Resistance", [
      "to Cold Resistance",
      "to Lightning Resistance",
    ]);
    expect(fire.length).toBeGreaterThanOrEqual(3);
  });
});
