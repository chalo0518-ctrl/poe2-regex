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

  it("detects real poe2db 简中 suffix numbers as after", () => {
    expect(inferNumericPlacement("火焰抗性 +(6—10)%", "火焰抗性")).toBe("after");
    expect(inferNumericPlacement("移动速度提高 10%", "移动速度提高")).toBe("after");
    expect(inferNumericPlacement("所有元素抗性 +(3—5)%", "所有元素抗性")).toBe("after");
  });

  it("keeps plus-flat 简中 life/attributes as before", () => {
    expect(inferNumericPlacement("+(10—19) 生命上限", "生命上限")).toBe("before");
    expect(inferNumericPlacement("+(5—8) 力量", "力量")).toBe("before");
  });
});
