import { describe, expect, it } from "vitest";
import {
  augmentById,
  augmentsForSlot,
  effectForSlot,
  inferExceptionalBase,
  normalSocketMax,
  socketCountMax,
} from "./sockets.ts";

describe("inferExceptionalBase", () => {
  it("treats a count above the slot cap as an extra augment socket", () => {
    expect(normalSocketMax("body")).toBe(2);
    expect(inferExceptionalBase("body", 2)).toBe(false);
    expect(inferExceptionalBase("body", 3)).toBe(true);

    expect(normalSocketMax("helmet")).toBe(1);
    expect(inferExceptionalBase("helmet", 1)).toBe(false);
    expect(inferExceptionalBase("helmet", 2)).toBe(true);

    expect(inferExceptionalBase("bow", 3)).toBe(true);
    expect(inferExceptionalBase("spear", 1)).toBe(false);
    expect(inferExceptionalBase("spear", 2)).toBe(true);
    expect(inferExceptionalBase("staff", 2)).toBe(false);
    expect(inferExceptionalBase("staff", 3)).toBe(true);

    expect(inferExceptionalBase("ring", 0)).toBe(false);
    expect(inferExceptionalBase("ring", 3)).toBe(false);
    expect(inferExceptionalBase("amulet", 1)).toBe(false);
    expect(inferExceptionalBase("belt", 1)).toBe(false);
    expect(inferExceptionalBase("trap", 4)).toBe(false);
    expect(inferExceptionalBase(undefined, 4)).toBe(false);
  });

  it("lets the selector go two past the cap only on slots that can take an extra socket", () => {
    expect(socketCountMax("body")).toBe(4);
    expect(socketCountMax("helmet")).toBe(3);
    expect(socketCountMax("ring")).toBe(0);
    expect(socketCountMax("trap")).toBe(0);
  });
});

describe("augmentsForSlot", () => {
  it("keeps Desert Rune on body armour and drops a helmet-only soul core", () => {
    const body = augmentsForSlot("body");
    const desert = body.find((row) => row.id === "Desert_Rune");
    expect(desert?.nameZh).toBe("沙漠符文");
    expect(desert?.nameEn).toBe("Desert Rune");
    expect(desert?.effectZh).toBe("護甲: +14%火焰抗性");
    expect(desert?.effectEn).toBe("Armour: +14% to Fire Resistance");
    expect(body.some((row) => row.id === "Atziris_Soul_Core_of_Devotion")).toBe(false);

    const helmet = augmentsForSlot("helmet");
    expect(helmet.some((row) => row.id === "Atziris_Soul_Core_of_Devotion")).toBe(true);
    expect(helmet.find((row) => row.id === "Desert_Rune")?.effectZh).toBe("護甲: +14%火焰抗性");
  });

  it("picks the smaller slot line, and Shields over Bucklers", () => {
    const desert = augmentById("Desert_Rune");
    expect(desert).toBeTruthy();
    expect(effectForSlot(desert!, "bow")?.en).toBe("Martial Weapon: Adds 7 to 11 Fire Damage");
    expect(effectForSlot(desert!, "wand")?.en).toBe("Wand or Staff: Gain 8% of Damage as Extra Fire Damage");
    const greust = augmentById("Idol_of_Greust");
    expect(effectForSlot(greust!, "shield")?.en.startsWith("Shields:")).toBe(true);
    expect(augmentsForSlot("ring")).toEqual([]);
    expect(augmentsForSlot("trap")).toEqual([]);
  });
});
