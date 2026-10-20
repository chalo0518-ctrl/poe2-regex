import { describe, expect, it } from "vitest";
import { previewHistoryUrl } from "./previewPath.ts";

const previewBase = "/poe2-regex/pr-preview/pr-13/";

describe("previewHistoryUrl", () => {
  it("restores a crafting deep link under the preview base", () => {
    expect(previewHistoryUrl(previewBase, "?spa=%2Fendgame%2Fcrafting")).toBe(
      "/poe2-regex/pr-preview/pr-13/endgame/crafting",
    );
  });

  it("keeps the route query and hash that were packed into spa", () => {
    expect(previewHistoryUrl(previewBase, "?spa=%2Fendgame%2Fcrafting%3Fslot%3Dhelm%23top")).toBe(
      "/poe2-regex/pr-preview/pr-13/endgame/crafting?slot=helm#top",
    );
  });

  it("leaves an ordinary preview load alone", () => {
    expect(previewHistoryUrl(previewBase, "")).toBeNull();
  });

  it("rejects a protocol-relative spa value", () => {
    expect(previewHistoryUrl(previewBase, "?spa=%2F%2Fevil.example")).toBeNull();
  });
});
