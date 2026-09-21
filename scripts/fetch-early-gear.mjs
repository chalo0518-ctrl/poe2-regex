#!/usr/bin/env node
/**
 * Scrape poe2db.tw /tw /us early-gear ModifiersCalc into frozen JSON.
 * Each armour attribute page is its own pool (not unioned).
 * Missing/unparsable pages are skipped so a working subset can still ship.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./lib/args.mjs";
import { EARLY_GEAR_CATEGORIES } from "./lib/catalogs.mjs";
import {
  assertEarlyGearCatalog,
  assertNoCatastrophicDrop,
  readJsonIfExists,
  ValidationError,
  writeGeneratedJson,
} from "./lib/generated.mjs";
import { FetchError, mapLimit } from "./lib/http.mjs";
import {
  applyRepoeFallback,
  loadRepoeByType,
  loadRepoeVersion,
  parsePageFamilies,
  ParseError,
  scrapeModifiersPage,
} from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_OUT_DIR = join(ROOT, "packages/data/generated");

export { EARLY_GEAR_CATEGORIES };

function attachPools(row, pools) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "pools") continue;
    out[key] = value;
    if (key === "generation") out.pools = pools;
  }
  if (!("pools" in out)) out.pools = pools;
  return out;
}

function sortFamilyList(list) {
  list.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });
  return list;
}

async function tryScrapePage(path, io) {
  try {
    const page = await scrapeModifiersPage(path, io);
    return { ok: true, path, page };
  } catch (err) {
    if (err instanceof FetchError && err.status === 404) {
      console.warn(`skip missing page ${path} (404)`);
      return { ok: false, path, reason: "404" };
    }
    if (err instanceof ParseError) {
      console.warn(`skip unparsable page ${path}: ${err.message}`);
      return { ok: false, path, reason: "parse" };
    }
    throw err;
  }
}

function familiesFromPage(category, pool, page, repoe) {
  const { list, skippedEmpty } = parsePageFamilies(page.twView, page.usView, {
    skipEmpty: false,
    extraIdPrefix: `gear:${category.id}:${pool.id}`,
  });
  applyRepoeFallback(list, repoe);
  return {
    list: sortFamilyList(list.map((row) => attachPools(row, [pool.id]))),
    harvestTags: page.tags || [],
    skippedEmpty,
    rawNormal: (page.twView.normal || []).length,
  };
}

export async function refreshEarlyGear(options = {}) {
  const categories = options.earlyCategories || options.categories || EARLY_GEAR_CATEGORIES;
  const concurrency = Number(options.concurrency) || 3;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const origin = options.origin || "https://poe2db.tw";
  const io = {
    origin: options.origin,
    fetchText: options.fetchText,
    repoeModsUrl: options.repoeModsUrl,
    repoeIndexUrl: options.repoeIndexUrl,
    required: options.requireRepoe,
  };

  const [repoe, repoeVersion] = await Promise.all([
    loadRepoeByType(io),
    options.repoeVersion !== undefined ? Promise.resolve(options.repoeVersion) : loadRepoeVersion(io),
  ]);

  const jobs = [];
  for (const category of categories) {
    for (const pool of category.pools) {
      jobs.push({ category, pool });
    }
  }

  const scraped = await mapLimit(jobs, concurrency, async ({ category, pool }) => {
    const result = await tryScrapePage(pool.path, io);
    return { categoryId: category.id, pool, ...result };
  });

  const skippedPages = scraped
    .filter((row) => !row.ok)
    .map((row) => ({ path: row.path, reason: row.reason }));

  const byCategoryId = new Map();
  for (const row of scraped) {
    if (!row.ok) continue;
    if (!byCategoryId.has(row.categoryId)) byCategoryId.set(row.categoryId, []);
    byCategoryId.get(row.categoryId).push({ pool: row.pool, page: row.page });
  }

  const keptCategories = [];
  const byCategory = {};
  const counts = {};
  let harvestTags = [];

  for (const category of categories) {
    const pages = byCategoryId.get(category.id) || [];
    if (pages.length === 0) {
      console.warn(`skip empty category ${category.id} (no parsable pages)`);
      continue;
    }
    const keptPools = [];
    const familiesByPool = {};
    const countsByPool = {};
    for (const { pool, page } of pages) {
      const parsed = familiesFromPage(category, pool, page, repoe);
      if (parsed.list.length === 0) {
        console.warn(`skip empty pool ${category.id}/${pool.id}`);
        continue;
      }
      if (harvestTags.length === 0 && parsed.harvestTags.length) {
        harvestTags = parsed.harvestTags;
      }
      keptPools.push(pool);
      familiesByPool[pool.id] = parsed.list;
      countsByPool[pool.id] = {
        families: parsed.list.length,
        tiers: parsed.list.reduce((s, f) => s + f.tiers.length, 0),
        skippedEmpty: parsed.skippedEmpty,
        rawNormal: parsed.rawNormal,
      };
    }
    if (keptPools.length === 0) {
      console.warn(`skip empty category ${category.id} (no families)`);
      continue;
    }
    keptCategories.push({ ...category, pools: keptPools, path: keptPools[0]?.path || category.path });
    byCategory[category.id] = familiesByPool;
    counts[category.id] = countsByPool;
  }

  if (keptCategories.length === 0) {
    throw new ValidationError("early gear: no categories produced families");
  }

  const catalog = {
    source: `${origin}/tw/ + /us/`,
    generatedAt,
    notes:
      "Frozen Chronicles ModifiersCalc scrape for campaign gear slots. Each armour attribute page is its own pool (not unioned — local 護甲/閃避/能量護盾 text differs). Jewellery and one-handed maces are single pages. 繁中 `/tw`, EN `/us`; RePoE match fallback only. Wands omitted (mixed damage-type families).",
    harvestTags,
    categories: keptCategories,
    counts,
    byCategory,
    ...(skippedPages.length ? { skippedPages } : {}),
    ...(repoeVersion ? { repoeVersion } : {}),
  };

  return { catalog, skippedPages, repoeVersion };
}

export async function writeEarlyGearOutputs(result, options = {}) {
  const outDir = options.outDir || DEFAULT_OUT_DIR;
  const catalog = result.catalog || result;
  const prev = await readJsonIfExists(join(outDir, "early-gear.json"));
  assertEarlyGearCatalog(catalog);
  for (const category of catalog.categories) {
    for (const pool of category.pools) {
      assertNoCatastrophicDrop(
        prev?.counts?.[category.id]?.[pool.id]?.families,
        catalog.counts[category.id]?.[pool.id]?.families,
        `early-gear.${category.id}.${pool.id}`,
        { force: options.force },
      );
    }
  }

  return [
    await writeGeneratedJson(join(outDir, "early-gear.json"), catalog, {
      dryRun: options.dryRun,
    }),
  ];
}

export async function run(options = {}) {
  const result = await refreshEarlyGear(options);
  const writes = await writeEarlyGearOutputs(result, options);
  const changed = writes.some((w) => w.written);
  console.log("Early gear");
  for (const category of result.catalog.categories) {
    for (const pool of category.pools) {
      const c = result.catalog.counts[category.id][pool.id];
      console.log(
        `  ${category.labelZh}/${pool.labelZh} (${pool.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
      );
    }
  }
  if (result.skippedPages?.length) {
    console.log(
      `  skipped pages: ${result.skippedPages.map((p) => `${p.path}:${p.reason}`).join(", ")}`,
    );
  }
  if (!changed) console.log("Early-gear JSON unchanged (generatedAt ignored).");
  return { result, writes, changed };
}

if (isMainModule(import.meta.url)) {
  run({}).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
