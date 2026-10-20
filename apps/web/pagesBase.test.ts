import { describe, expect, it } from "vitest";
import { resolvePagesBase } from "./pagesBase.ts";

describe("resolvePagesBase", () => {
  it("keeps local dev at the site root", () => {
    expect(resolvePagesBase({})).toBe("/");
  });

  it("uses the production project path when GitHub Pages builds main", () => {
    expect(resolvePagesBase({ GITHUB_PAGES: "true" })).toBe("/poe2-regex/");
  });

  it("lets a pull request preview override the production base", () => {
    expect(resolvePagesBase({ PAGES_BASE: "/poe2-regex/pr-preview/pr-13", GITHUB_PAGES: "true" })).toBe(
      "/poe2-regex/pr-preview/pr-13/",
    );
  });

  it("rejects a protocol-relative base", () => {
    expect(() => resolvePagesBase({ PAGES_BASE: "//evil.example/poe2-regex/" })).toThrow(/absolute path/);
  });
});
