import { describe, expect, it } from "vitest";
import { shopModById, shopModToFamily } from "./campaign.ts";
import { effectText, matchText } from "./locale.ts";

describe("locale field accessors", () => {
  it("falls back from 简中 to 繁中 to EN without inventing text", () => {
    const family = shopModToFamily(shopModById("cold_res"));
    expect(effectText(family, "zh-Hans")).toBe("冰霜抗性 +(6—10)%");
    expect(effectText(family, "zh-Hant")).toBe("+(6—10)%冰冷抗性");
    expect(effectText(family, "en")).toBe("+(6—10)% to Cold Resistance");
    expect(matchText(family, "zh-Hans")).toBe("冰霜抗性");
    expect(matchText(family, "zh-Hant")).toBe("冰冷抗性");
    expect(matchText(family, "en")).toBe("to Cold Resistance");
  });

  it("uses 繁中 when 简中 is missing", () => {
    const family = shopModToFamily(shopModById("life"));
    const stripped = { ...family, textZhHans: undefined, matchZhHans: undefined };
    expect(effectText(stripped, "zh-Hans")).toBe(family.textZh);
    expect(matchText(stripped, "zh-Hans")).toBe(family.matchZh);
  });
});
