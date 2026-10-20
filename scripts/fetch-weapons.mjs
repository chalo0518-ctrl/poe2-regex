#!/usr/bin/env node
/**
 * Scrape poe2db.tw /tw /us weapon ModifiersCalc pages into weapons.json.
 * One page per major weapon class. One-handed maces stay in early-gear.json.
 * Not part of the fixture update path — those HTML fixtures do not cover weapons.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./lib/args.mjs";
import { WEAPON_CATEGORIES } from "./lib/catalogs.mjs";
import {
  assertEarlyGearCatalog,
  assertNoCatastrophicDrop,
  readJsonIfExists,
  writeGeneratedJson,
} from "./lib/generated.mjs";
import { refreshEarlyGear } from "./fetch-early-gear.mjs";
import { detect } from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_OUT_DIR = join(ROOT, "packages/data/generated");

const NOTES =
  "Frozen Chronicles ModifiersCalc scrape for major weapon classes. One page per class, no str/dex/int split. 繁中 `/tw`, EN `/us`; RePoE match fallback only. One-handed maces stay in early-gear.json. Combined Swords/Axes/Maces index pages and fishing rods are not slots.";

function stem(text) {
  return String(text || "").replace(/[0-9０-９%％+\-—–()（）\s,，]/g, "");
}

function matchOf(text) {
  const detected = detect(text || "");
  return detected.rest || text || "";
}

/**
 * poe2db stores every damage type of WeaponDamageTypePrefix (and similar gem-level
 * groups) under one ModFamilyList. Split those into one row per Chinese effect so
 * the checklist can target fire vs cold, and keep `family` so they still conflict.
 * Number-only differences (tier floors, "+1" vs "+2") stay on the same row.
 */
function splitMixedFamilies(list) {
  const out = [];
  for (const row of list) {
    const groups = new Map();
    for (const tier of row.tiers || []) {
      const key = stem(matchOf(tier.textZh));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(tier);
    }
    if (groups.size <= 1) {
      out.push(row);
      continue;
    }
    let part = 0;
    for (const tiers of groups.values()) {
      part += 1;
      const sorted = [...tiers].sort(
        (a, b) => a.level - b.level || String(a.nameZh).localeCompare(b.nameZh, "zh-Hant"),
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const textZh = first.textZh || "";
      const textEn = first.textEn || "";
      const statMins = sorted.map((tier) => tier.statMin).filter((n) => n != null);
      const statMaxs = sorted.map((tier) => tier.statMax).filter((n) => n != null);
      out.push({
        ...row,
        id: `${row.id}#${part}`,
        tiers: sorted,
        labelZh: first.nameZh || row.labelZh,
        labelEn: first.nameEn || row.labelEn,
        textZh,
        textEn,
        matchZh: matchOf(textZh),
        match: matchOf(textEn) || row.match,
        minLevel: first.level ?? 0,
        maxLevel: last.level ?? 0,
        tierCount: sorted.length,
        weight: sorted.reduce((sum, tier) => sum + (tier.dropChance || 0), 0),
        ...(row.numeric
          ? {
              numeric: {
                format: row.numeric.format,
                ...(statMins.length ? { suggestedMin: Math.min(...statMins) } : {}),
                ...(statMaxs.length ? { suggestedMax: Math.max(...statMaxs) } : {}),
              },
            }
          : {}),
      });
    }
  }
  out.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return String(a.textZh).localeCompare(b.textZh, "zh-Hant");
  });
  return out;
}

function keepUsableFamilies(catalog) {
  const dropped = [];
  for (const category of [...catalog.categories]) {
    const byPool = catalog.byCategory[category.id];
    for (const pool of category.pools) {
      const before = splitMixedFamilies(byPool[pool.id] || []);
      const kept = before.filter((family) => {
        if (family.matchZh && family.textZh && family.tiers?.length) return true;
        dropped.push(`${category.id}:${family.family}:${family.textZh || family.textEn || "?"}`);
        return false;
      });
      byPool[pool.id] = kept;
      const counts = catalog.counts[category.id][pool.id];
      counts.families = kept.length;
      counts.tiers = kept.reduce((sum, family) => sum + family.tiers.length, 0);
    }
    const livePools = category.pools.filter((pool) => (byPool[pool.id] || []).length > 0);
    if (livePools.length === 0) {
      catalog.categories = catalog.categories.filter((row) => row.id !== category.id);
      delete catalog.byCategory[category.id];
      delete catalog.counts[category.id];
      console.warn(`skip empty weapon category ${category.id}`);
      continue;
    }
    category.pools = livePools;
  }
  if (dropped.length) {
    console.warn(`dropped ${dropped.length} weapon rows without a Traditional Chinese match:`);
    for (const row of dropped) console.warn(`  ${row}`);
  }
}

export async function refreshWeapons(options = {}) {
  const result = await refreshEarlyGear({
    ...options,
    categories: options.categories || WEAPON_CATEGORIES,
  });
  keepUsableFamilies(result.catalog);
  result.catalog.notes = NOTES;
  return result;
}

export async function writeWeaponOutputs(result, options = {}) {
  const outDir = options.outDir || DEFAULT_OUT_DIR;
  const catalog = result.catalog || result;
  const prev = await readJsonIfExists(join(outDir, "weapons.json"));
  assertEarlyGearCatalog(catalog);
  for (const category of catalog.categories) {
    for (const pool of category.pools) {
      assertNoCatastrophicDrop(
        prev?.counts?.[category.id]?.[pool.id]?.families,
        catalog.counts[category.id]?.[pool.id]?.families,
        `weapons.${category.id}.${pool.id}`,
        { force: options.force },
      );
    }
  }
  return [
    await writeGeneratedJson(join(outDir, "weapons.json"), catalog, {
      dryRun: options.dryRun,
    }),
  ];
}

export async function run(options = {}) {
  const result = await refreshWeapons(options);
  const writes = await writeWeaponOutputs(result, options);
  const changed = writes.some((w) => w.written);
  console.log("Weapons");
  for (const category of result.catalog.categories) {
    for (const pool of category.pools) {
      const c = result.catalog.counts[category.id][pool.id];
      console.log(
        `  ${category.labelZh} (${pool.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
      );
    }
  }
  if (result.skippedPages?.length) {
    console.log(`  skipped pages: ${result.skippedPages.map((p) => `${p.path}:${p.reason}`).join(", ")}`);
  }
  if (!changed) console.log("Weapons JSON unchanged (generatedAt ignored).");
  return { result, writes, changed };
}

if (isMainModule(import.meta.url)) {
  run({}).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
