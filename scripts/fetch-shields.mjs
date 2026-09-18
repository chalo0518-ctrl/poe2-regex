#!/usr/bin/env node
/**
 * Scrape poe2db.tw /tw /cn /us Shields ModifiersCalc into frozen JSON.
 * Public pages, no login. Families are unioned across shield bases.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./lib/args.mjs";
import { SHIELD_BASES } from "./lib/catalogs.mjs";
import {
  assertNoCatastrophicDrop,
  assertShieldPayload,
  readJsonIfExists,
  writeGeneratedJson,
} from "./lib/generated.mjs";
import { mapLimit } from "./lib/http.mjs";
import {
  applyRepoeFallback,
  loadRepoeByType,
  loadRepoeVersion,
  mergeFamilyRow,
  parsePageFamilies,
  scrapeModifiersPage,
} from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DEFAULT_OUT_DIR = join(ROOT, "packages/data/generated");

export { SHIELD_BASES as BASES };

function attachShieldBases(row, bases) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "bases") continue;
    out[key] = value;
    if (key === "generation") out.bases = bases;
  }
  if (!("bases" in out)) out.bases = bases;
  return out;
}

function sortShieldList(list) {
  list.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });
  return list;
}

export async function refreshShields(options = {}) {
  const bases = options.bases || SHIELD_BASES;
  const concurrency = Number(options.concurrency) || 3;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const io = {
    origin: options.origin,
    fetchText: options.fetchText,
    repoeModsUrl: options.repoeModsUrl,
    repoeIndexUrl: options.repoeIndexUrl,
    required: options.requireRepoe,
  };

  const [repoe, repoeVersion, pages] = await Promise.all([
    loadRepoeByType(io),
    options.repoeVersion !== undefined ? Promise.resolve(options.repoeVersion) : loadRepoeVersion(io),
    mapLimit(bases, concurrency, async (base) => {
      const page = await scrapeModifiersPage(base.path, io);
      return { base, ...page };
    }),
  ]);

  const harvestTags = pages[0]?.tags || [];
  const merged = new Map();
  for (const page of pages) {
    const { list } = parsePageFamilies(page.twView, page.usView, {
      skipEmpty: false,
      cnView: page.cnView,
    });
    for (const row of list) {
      const withBase = attachShieldBases(row, [page.base.id]);
      if (!merged.has(withBase.id)) {
        merged.set(withBase.id, withBase);
        continue;
      }
      const prev = merged.get(withBase.id);
      const bases = [...new Set([...(prev.bases || []), ...(withBase.bases || [])])];
      merged.set(withBase.id, attachShieldBases(mergeFamilyRow(prev, withBase), bases));
    }
  }

  const list = sortShieldList([...merged.values()]);
  applyRepoeFallback(list, repoe);

  const meta = {
    source: `${options.origin || "https://poe2db.tw"}/tw/ + /cn/ + /us/`,
    pages: bases.map((b) => `${options.origin || "https://poe2db.tw"}/tw/${b.path}#ModifiersCalc`),
    gameVersion: repoeVersion ? `RePoE ${repoeVersion}` : "poe2db.tw scrape",
    generatedAt,
    familyCount: list.length,
    tierCount: list.reduce((s, f) => s + f.tiers.length, 0),
    bases,
    notes:
      "Frozen Chronicles ModifiersCalc scrape for str / str_dex / str_int shields and Bucklers. 繁中 `/tw`, 简中 `/cn`, EN `/us`; RePoE used only as match-id fallback.",
    ...(repoeVersion ? { repoeVersion } : {}),
  };

  return { list, harvestTags, meta, repoeVersion };
}

export async function writeShieldOutputs(result, options = {}) {
  const outDir = options.outDir || DEFAULT_OUT_DIR;
  const prevList = await readJsonIfExists(join(outDir, "shields.json"));
  assertShieldPayload(result.list, result.harvestTags, result.meta);
  assertNoCatastrophicDrop(prevList?.length, result.list.length, "shields", {
    force: options.force,
  });

  const writes = [];
  writes.push(
    await writeGeneratedJson(join(outDir, "shields.json"), result.list, {
      dryRun: options.dryRun,
    }),
  );
  writes.push(
    await writeGeneratedJson(join(outDir, "tags.json"), result.harvestTags, {
      dryRun: options.dryRun,
    }),
  );
  writes.push(
    await writeGeneratedJson(join(outDir, "meta.json"), result.meta, {
      dryRun: options.dryRun,
    }),
  );
  return writes;
}

export async function run(options = {}) {
  const result = await refreshShields(options);
  const writes = await writeShieldOutputs(result, options);
  const changed = writes.some((w) => w.written);
  console.log(
    `Shields: ${result.list.length} families / ${result.meta.tierCount} tiers; tags ${result.harvestTags.length}` +
      (changed ? "" : " (unchanged)"),
  );
  return { result, writes, changed };
}

if (isMainModule(import.meta.url)) {
  run({}).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
