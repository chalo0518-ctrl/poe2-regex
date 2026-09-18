import { describe, expect, it } from "vitest";
import { shopModById, shopModToFamily } from "./campaign.ts";
import { effectText, matchText } from "./locale.ts";

describe("locale field accessors", () => {
  it("uses 繁中 and EN without inventing text", () => {
    const family = shopModToFamily(shopModById("cold_res"));
    expect(effectText(family, "zh-Hant")).toBe("+(6—10)%冰冷抗性");
    expect(effectText(family, "en")).toBe("+(6—10)% to Cold Resistance");
    expect(matchText(family, "zh-Hant")).toBe("冰冷抗性");
    expect(matchText(family, "en")).toBe("to Cold Resistance");
  });

  it("falls back to the other locale when a field is missing", () => {
    const family = shopModToFamily(shopModById("life"));
    const noEn = { ...family, textEn: "", match: "" };
    expect(effectText(noEn, "en")).toBe(family.textZh);
    expect(matchText(noEn, "en")).toBe(family.matchZh);
  });
});
