import { describe, expect, it } from "vitest";
import { desecratedFamiliesFor } from "./desecrated.ts";
import { poolAugmentById } from "./socketPools.ts";

describe("desecrated affixes", () => {
  it("loads the poe2db desecrated table for body, apart from Medved's soul pool", () => {
    const rows = desecratedFamiliesFor("body");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.generation === "prefix" || row.generation === "suffix")).toBe(true);
    expect(rows.every((row) => row.id.startsWith("desecrated:body|"))).toBe(true);
    expect(rows.every((row) => row.textZh && !("textZhHans" in row))).toBe(true);
    const medved = poolAugmentById("Medveds_Tending");
    expect(medved?.families.length).toBeGreaterThan(0);
    const soulIds = new Set(medved?.families.map((row) => row.textZh));
    expect(rows.some((row) => soulIds.has(row.textZh))).toBe(false);
  });
});
