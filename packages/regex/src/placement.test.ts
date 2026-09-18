import { describe, expect, it } from "vitest";
import { inferNumericPlacement } from "./placement.js";

describe("inferNumericPlacement", () => {
  it("detects EN/繁中 leading numbers as before", () => {
    expect(inferNumericPlacement("+(6—10)% to Fire Resistance", "to Fire Resistance")).toBe(
      "before",
    );
    expect(inferNumericPlacement("+(6—10)%火焰抗性", "火焰抗性")).toBe("before");
    expect(inferNumericPlacement("+(10—19)最大生命", "最大生命")).toBe("before");
    expect(inferNumericPlacement("增加10%移動速度", "移動速度")).toBe("before");
  });

  it("detects suffix numbers as after", () => {
    expect(inferNumericPlacement("Fire Resistance +(6—10)%", "Fire Resistance")).toBe("after");
    expect(inferNumericPlacement("Movement Speed increased 10%", "Movement Speed increased")).toBe(
      "after",
    );
  });

  it("keeps plus-flat life/attributes as before", () => {
    expect(inferNumericPlacement("+(10—19) to maximum Life", "to maximum Life")).toBe("before");
    expect(inferNumericPlacement("+(5—8) to Strength", "to Strength")).toBe("before");
  });
});
