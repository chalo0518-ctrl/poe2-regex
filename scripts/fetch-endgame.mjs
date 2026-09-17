#!/usr/bin/env node
/**
 * Scrape poe2db.tw waystone + tablet ModifiersCalc into frozen JSON.
 * Each tablet kind is scraped as its own pool (no union-then-filter).
 * Waystone tiers are independent pools.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyRepoeFallback,
  loadRepoeByType,
  parsePageFamilies,
  scrapeModifiersPage,
} from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "packages/data/generated");

export const WAYSTONE_TIERS = [
  { id: "low", labelZh: "低階", path: "Waystones_low_tier" },
  { id: "mid", labelZh: "中階", path: "Waystones_mid_tier" },
  { id: "top", labelZh: "高階", path: "Waystones_top_tier" },
];

export const TABLET_KINDS = [
  { id: "breach", labelZh: "裂痕碑牌", path: "Breach_Tablet" },
  { id: "expedition", labelZh: "探險碑牌", path: "Expedition_Tablet" },
  { id: "delirium", labelZh: "譫妄碑牌", path: "Delirium_Tablet" },
  { id: "ritual", labelZh: "祭祀碑牌", path: "Ritual_Tablet" },
  { id: "irradiated", labelZh: "輻照碑牌", path: "Irradiated_Tablet" },
  { id: "overseer", labelZh: "總督碑牌", path: "Overseer_Tablet" },
  { id: "abyss", labelZh: "深淵碑牌", path: "Abyss_Tablet" },
  { id: "temple", labelZh: "神廟碑牌", path: "Temple_Tablet" },
];

async function scrapePool(meta, extraField, extraValue, extraIdPrefix, repoe) {
  const page = await scrapeModifiersPage(meta.path);
  const { list, skippedEmpty } = parsePageFamilies(page.twView, page.usView, null, {
    skipEmpty: true,
    extraIdPrefix,
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

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const repoe = await loadRepoeByType();

  const waystonePages = await mapLimit(WAYSTONE_TIERS, 3, (tier) =>
    scrapePool(tier, "tier", tier.id, `waystone:${tier.id}`, repoe),
  );
  const tabletPages = await mapLimit(TABLET_KINDS, 3, (kind) =>
    scrapePool(kind, "tabletKind", kind.id, `tablet:${kind.id}`, repoe),
  );

  const harvestTags = waystonePages[0]?.harvestTags?.length
    ? waystonePages[0].harvestTags
    : tabletPages[0].harvestTags;

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
    source: "https://poe2db.tw/tw/",
    generatedAt,
    notes:
      "Independent waystone pools from Waystones_low/mid/top_tier ModifiersCalc. Not unioned. EN from /us; RePoE match fallback only.",
    harvestTags,
    tiers: WAYSTONE_TIERS,
    counts: waystoneCounts,
    byTier: waystonesByTier,
  };

  const tablets = {
    source: "https://poe2db.tw/tw/",
    generatedAt,
    notes:
      "Each tablet kind is a separate ModsView scrape. UI must gate on kind; do not union-all then fake-filter. EN from /us; RePoE match fallback only.",
    harvestTags,
    kinds: TABLET_KINDS,
    counts: tabletCounts,
    byKind: tabletsByKind,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "waystones.json"), JSON.stringify(waystones, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "tablets.json"), JSON.stringify(tablets, null, 2) + "\n");

  console.log("Waystones");
  for (const t of WAYSTONE_TIERS) {
    const c = waystoneCounts[t.id];
    console.log(
      `  ${t.labelZh} (${t.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
    );
  }
  console.log("Tablets");
  for (const k of TABLET_KINDS) {
    const c = tabletCounts[k.id];
    console.log(
      `  ${k.labelZh} (${k.path}): ${c.families} families / ${c.tiers} tiers (raw ${c.rawNormal}, skipped empty ${c.skippedEmpty})`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
