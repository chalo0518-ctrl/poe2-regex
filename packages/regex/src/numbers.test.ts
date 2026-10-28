import { describe, expect, it } from "vitest";
import {
  integerRangePattern,
  compactAtLeast,
  compactIntegerRange,
  dotDigitShorthand,
} from "./numbers.js";

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

  it("compactAtLeast matches the same integers with a shorter pattern", () => {
    const p = compactAtLeast(40);
    expect(p.length).toBeLessThan(integerRangePattern(40).length);
    expect(matches(p, 40)).toBe(true);
    expect(matches(p, 99)).toBe(true);
    expect(matches(p, 100)).toBe(true);
    expect(matches(p, 39)).toBe(false);
    expect(matches(compactAtLeast(20), 20)).toBe(true);
    expect(matches(compactAtLeast(20), 19)).toBe(false);
  });

  it("compactIntegerRange handles min, max, and both", () => {
    expect(compactIntegerRange()).toBe("\\d+");
    const minOnly = compactIntegerRange(40);
    expect(matches(minOnly, 40)).toBe(true);
    expect(matches(minOnly, 39)).toBe(false);
    const closed = compactIntegerRange(14, 16);
    expect(matches(closed, 14)).toBe(true);
    expect(matches(closed, 16)).toBe(true);
    expect(matches(closed, 13)).toBe(false);
    expect(matches(closed, 17)).toBe(false);
    const maxOnly = compactIntegerRange(undefined, 2);
    expect(matches(maxOnly, 0)).toBe(true);
    expect(matches(maxOnly, 2)).toBe(true);
    expect(matches(maxOnly, 3)).toBe(false);
    expect(matches(compactAtLeast(200), 200)).toBe(true);
    expect(matches(compactAtLeast(200), 199)).toBe(false);
    expect(matches(compactAtLeast(500), 800)).toBe(true);
    expect(matches(compactAtLeast(500), 499)).toBe(false);
  });

  it("dotDigitShorthand keeps the same integers and is never longer", () => {
    const samples = [0, 1, 2, 9, 10, 11, 15, 20, 23, 40, 47, 99, 100, 101, 200, 250, 500, 999];
    for (const min of samples) {
      const precise = compactIntegerRange(min);
      const short = dotDigitShorthand(precise);
      expect(short.length).toBeLessThanOrEqual(precise.length);
      for (let n = 0; n <= 1200; n++) {
        expect(matches(short, n), `${min} @ ${n}`).toBe(matches(precise, n));
      }
    }
    const closed: Array<[number, number]> = [
      [14, 16],
      [0, 2],
      [30, 39],
      [10, 25],
      [500, 1000],
    ];
    for (const [min, max] of closed) {
      const precise = compactIntegerRange(min, max);
      const short = dotDigitShorthand(precise);
      expect(short.length).toBeLessThanOrEqual(precise.length);
      for (let n = 0; n <= max + 5; n++) {
        expect(matches(short, n), `${min}-${max} @ ${n}`).toBe(matches(precise, n));
      }
    }
  });

  it("swaps inverted bounds", () => {
    const p = integerRangePattern(40, 30);
    expect(matches(p, 30)).toBe(true);
    expect(matches(p, 40)).toBe(true);
    expect(matches(p, 29)).toBe(false);
  });
});
