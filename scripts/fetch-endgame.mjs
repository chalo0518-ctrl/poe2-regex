#!/usr/bin/env node
/**
 * Scrape poe2db.tw waystone + tablet ModifiersCalc into frozen JSON.
 * Each tablet kind is scraped as its own pool (no union-then-filter).
 * Waystone tiers are independent pools.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./lib/args.mjs";
import { TABLET_KINDS, WAYSTONE_TIERS } from "./lib/catalogs.mjs";
import {
  assertNoCatastrophicDrop,
  assertTabletCatalog,
  assertWaystoneCatalog,
  readJsonIfExists,
  writeGeneratedJson,
} from "./lib/generated.mjs";
import { mapLimit } from "./lib/http.mjs";
import {
  applyRepoeFallback,
  loadRepoeByType,
  loadRepoeVersion,
  parsePageFamilies,
  scrapeModifiersPage,
} from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_OUT_DIR = join(ROOT, "packages/data/generated");

export { TABLET_KINDS, WAYSTONE_TIERS };

async function scrapePool(meta, extraField, extraValue, extraIdPrefix, repoe, io) {
  const page = await scrapeModifiersPage(meta.path, io);
  const { list, skippedEmpty } = parsePageFamilies(page.twView, page.usView, {
    skipEmpty: true,
    extraIdPrefix,
    cnView: page.cnView,
  });
  applyRepoeFallback(list, repoe);
  for (const row of list) {
    row[extraField] = extraValue;
  }
  return {
    meta,
    harvestTags: page.tags,
    families: list,
    skippedEmpty,
    rawNormal: (page.twView.normal || []).length,
  };
}

export async function refreshEndgame(options = {}) {
  const waystoneTiers = options.waystoneTiers || WAYSTONE_TIERS;
  const tabletKinds = options.tabletKinds || TABLET_KINDS;
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

  const waystonePages = await mapLimit(waystoneTiers, concurrency, (tier) =>
    scrapePool(tier, "tier", tier.id, `waystone:${tier.id}`, repoe, io),
  );
  const tabletPages = await mapLimit(tabletKinds, concurrency, (kind) =>
    scrapePool(kind, "tabletKind", kind.id, `tablet:${kind.id}`, repoe, io),
  );

  const harvestTags = waystonePages[0]?.harvestTags?.length
    ? waystonePages[0].harvestTags
    : tabletPages[0]?.harvestTags || [];

  const waystonesByTier = {};
  const waystoneCounts = {};
  for (const page of waystonePages) {
    waystonesByTier[page.meta.id] = page.families;
    waystoneCounts[page.meta.id] = {
      families: page.families.length,
      tiers: page.families.reduce((s, f) => s + f.tiers.length, 0),
      skippedEmpty: page.skippedEmpty,
      rawNormal: page.rawNormal,
    };
  }

  const tabletsByKind = {};
  const tabletCounts = {};
  for (const page of tabletPages) {
    tabletsByKind[page.meta.id] = page.families;
    tabletCounts[page.meta.id] = {
      families: page.families.length,
      tiers: page.families.reduce((s, f) => s + f.tiers.length, 0),
      skippedEmpty: page.skippedEmpty,
      rawNormal: page.rawNormal,
    };
  }

  const waystones = {
    source: `${origin}/tw/ + /cn/ + /us/`,
    generatedAt,
    notes:
      "Independent waystone pools from Waystones_low/mid/top_tier ModifiersCalc. Not unioned. 繁中 `/tw`, 简中 `/cn`, EN `/us`; RePoE match fallback only.",
    harvestTags,
    tiers: waystoneTiers,
    counts: waystoneCounts,
    byTier: waystonesByTier,
    ...(repoeVersion ? { repoeVersion } : {}),
  };

  const tablets = {
    source: `${origin}/tw/ + /cn/ + /us/`,
    generatedAt,
    notes:
      "Each tablet kind is a separate ModsView scrape. UI must gate on kind; do not union-all then fake-filter. 繁中 `/tw`, 简中 `/cn`, EN `/us`; RePoE match fallback only.",
    harvestTags,
    kinds: tabletKinds,
    counts: tabletCounts,
    byKind: tabletsByKind,
    ...(repoeVersion ? { repoeVersion } : {}),
  };

  return { waystones, tablets, repoeVersion };
}

export async function writeEndgameOutputs(result, options = {}) {
  const outDir = options.outDir || DEFAULT_OUT_DIR;
  const prevWaystones = await readJsonIfExists(join(outDir, "waystones.json"));
  const prevTablets = await readJsonIfExists(join(outDir, "tablets.json"));

  assertWaystoneCatalog(result.waystones);
  assertTabletCatalog(result.tablets);

  for (const tier of result.waystones.tiers) {
    assertNoCatastrophicDrop(
      prevWaystones?.counts?.[tier.id]?.families,
      result.waystones.counts[tier.id].families,
      `waystones.${tier.id}`,
      { force: options.force },
    );
  }
  for (const kind of result.tablets.kinds) {
    assertNoCatastrophicDrop(
      prevTablets?.counts?.[kind.id]?.families,
      result.tablets.counts[kind.id].families,
      `tablets.${kind.id}`,
      { force: options.force },
    );
  }

  const writes = [
    await writeGeneratedJson(join(outDir, "waystones.json"), result.waystones, {
      dryRun: options.dryRun,
    }),
    await writeGeneratedJson(join(outDir, "tablets.json"), result.tablets, {
      dryRun: options.dryRun,
    }),
  ];
  return writes;
}

export async function run(options = {}) {
  const result = await refreshEndgame(options);
  const writes = await writeEndgameOutputs(result, options);
  const changed = writes.some((w) => w.written);
  console.log("Waystones");
  for (const t of result.waystones.tiers) {
    const c = result.waystones.counts[t.id];
    console.log(
      `  ${t.labelZh} (${t.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
    );
  }
  console.log("Tablets");
  for (const k of result.tablets.kinds) {
    const c = result.tablets.counts[k.id];
    console.log(
      `  ${k.labelZh} (${k.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
    );
  }
  if (!changed) console.log("Endgame JSON unchanged (generatedAt ignored).");
  return { result, writes, changed };
}

if (isMainModule(import.meta.url)) {
  run({}).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
