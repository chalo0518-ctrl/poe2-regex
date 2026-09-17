import { describe, expect, it } from "vitest";
import { integerRangePattern } from "./numbers.js";

function matches(pattern: string, n: number): boolean {
  return new RegExp(`^${pattern}$`).test(String(n));
}

describe("integerRangePattern", () => {
  it("matches any digits when unbounded", () => {
    expect(integerRangePattern()).toBe("\\d+");
    expect(matches("\\d+", 0)).toBe(true);
    expect(matches("\\d+", 42)).toBe(true);
  });

  it("matches an exact value", () => {
    expect(integerRangePattern(30, 30)).toBe("30");
    expect(matches("30", 30)).toBe(true);
    expect(matches("30", 31)).toBe(false);
  });

  it("matches a closed range", () => {
    const p = integerRangePattern(30, 39);
    for (let n = 30; n <= 39; n++) expect(matches(p, n), String(n)).toBe(true);
    expect(matches(p, 29)).toBe(false);
    expect(matches(p, 40)).toBe(false);
  });

  it("matches 10-25 inclusive", () => {
    const p = integerRangePattern(10, 25);
    for (let n = 10; n <= 25; n++) expect(matches(p, n), String(n)).toBe(true);
    expect(matches(p, 9)).toBe(false);
    expect(matches(p, 26)).toBe(false);
  });

  it("matches min-only as that value or higher", () => {
    const p = integerRangePattern(30);
    expect(matches(p, 30)).toBe(true);
    expect(matches(p, 99)).toBe(true);
    expect(matches(p, 100)).toBe(true);
    expect(matches(p, 29)).toBe(false);
    expect(matches(p, 3)).toBe(false);
  });

  it("swaps inverted bounds", () => {
    const p = integerRangePattern(40, 30);
    expect(matches(p, 30)).toBe(true);
    expect(matches(p, 40)).toBe(true);
    expect(matches(p, 29)).toBe(false);
  });
});
