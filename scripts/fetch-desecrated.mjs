#!/usr/bin/env node
/**
 * Build desecrated.json from poe2db ModsView.desecrated.
 * That table is the 褻瀆詞綴 pool (poe2db keyword Abyssalify). Not part of the fixture update path.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EARLY_GEAR_CATEGORIES,
  SHIELD_BASES,
  WEAPON_CATEGORIES,
} from "./lib/catalogs.mjs";
import { mergeFamilyRow, parsePageFamilies, scrapeModifiersPage } from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/data/generated/desecrated.json");

const SLOTS = [
  ...EARLY_GEAR_CATEGORIES.map((category) => ({
    id: category.id,
    paths: category.pools.map((pool) => pool.path),
  })),
  { id: "shield", paths: SHIELD_BASES.map((base) => base.path) },
  ...WEAPON_CATEGORIES.map((category) => ({
    id: category.id,
    paths: category.pools.map((pool) => pool.path),
  })),
];

function familiesFrom(page) {
  return parsePageFamilies(
    { normal: page.twView.desecrated || [] },
    { normal: page.usView.desecrated || [] },
  ).list;
}

function unionSlot(slotId, lists) {
  const merged = new Map();
  for (const list of lists) {
    for (const row of list) {
      const key = `${row.generation}|${row.family}|${row.matchZh}|${row.match}`;
      const prev = merged.get(key);
      if (!prev) {
        merged.set(key, {
          ...row,
          id: `desecrated:${slotId}|${row.family}|${row.generation}|${row.matchZh}`,
        });
        continue;
      }
      merged.set(key, mergeFamilyRow(prev, row, { id: prev.id }));
    }
  }
  return [...merged.values()].sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, () => worker()));
  return out;
}

const pages = [...new Set(SLOTS.flatMap((slot) => slot.paths))];
console.log(`fetching ${pages.length} desecrated pages`);
const scraped = new Map();
await mapPool(pages, 4, async (path) => {
  const page = await scrapeModifiersPage(path);
  scraped.set(path, familiesFrom(page));
  console.log(`${path}: ${scraped.get(path).length}`);
});

const bySlot = {};
for (const slot of SLOTS) {
  bySlot[slot.id] = unionSlot(slot.id, slot.paths.map((path) => scraped.get(path) || []));
  console.log(`slot ${slot.id}: ${bySlot[slot.id].length}`);
}

const doc = {
  source: "https://poe2db.tw ModsView.desecrated (褻瀆詞綴 / Abyssalify)",
  labelZh: "褻瀆詞綴",
  labelEn: "Desecrated affixes",
  bySlot,
};
writeFileSync(OUT, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`wrote ${OUT}`);
