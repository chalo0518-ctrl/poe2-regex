#!/usr/bin/env node
/**
 * Data-update entrypoint.
 *
 * Live:
 *   pnpm fetch-data
 * Fixtures (CI / no egress):
 *   pnpm fetch-data -- --from-fixtures --out-dir /tmp/poe2-data
 * Validate frozen JSON without fetching:
 *   pnpm fetch-data -- --check
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { boolFlag, isMainModule, parseArgs } from "./lib/args.mjs";
import { POE2DB_ORIGIN } from "./lib/catalogs.mjs";
import { checkGeneratedDir, ValidationError } from "./lib/generated.mjs";
import { FetchError } from "./lib/http.mjs";
import { createFixtureFetcher, ParseError } from "./lib/poe2db.mjs";
import { DEFAULT_OUT_DIR as ENDGAME_OUT, refreshEndgame, writeEndgameOutputs } from "./fetch-endgame.mjs";
import { DEFAULT_OUT_DIR as SHIELD_OUT, refreshShields, writeShieldOutputs } from "./fetch-shields.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_GENERATED = SHIELD_OUT || ENDGAME_OUT;
const DEFAULT_FIXTURES = join(ROOT, "scripts/fixtures");

export const EXIT = {
  ok: 0,
  error: 1,
  network: 2,
  validate: 3,
};

function printHelp() {
  console.log(`Update frozen PoE2 affix JSON from public sources.

Usage:
  node scripts/update-data.mjs [options]

Sources:
  - poe2db.tw Chronicles unpack (public /tw, /cn, and /us ModsView HTML). No login.
  - RePoE-fork (https://repoe-fork.github.io/poe2/) — English match fallback + version label only.

Options:
  --shields              Refresh shields/tags/meta only
  --endgame              Refresh waystones + tablets only
  --check                Validate packages/data/generated (no network)
  --from-fixtures [dir]  Parse trimmed HTML under scripts/fixtures (default)
  --out-dir <dir>        Write JSON here (default packages/data/generated)
  --dry-run              Scrape/parse/validate but do not write
  --force                Allow large family-count drops
  --concurrency <n>      Parallel page fetches (default 3)
  --origin <url>         Override poe2db origin (default ${POE2DB_ORIGIN})
  --help                 Show this help

Env:
  POE2DB_ORIGIN, POE2DB_TIMEOUT_MS, POE2DB_RETRIES, POE2DB_RETRY_DELAY_MS, POE2DB_UA
  REPOE_ORIGIN, REPOE_MODS_URL, REPOE_INDEX_URL

Exit codes: 0 ok, 1 error, 2 network/blocked, 3 validation/parse.

Fixture mode never writes over packages/data/generated unless --force is also set.
`);
}

async function loadManifest(fixtureDir) {
  const raw = await readFile(join(fixtureDir, "manifest.json"), "utf8");
  return JSON.parse(raw);
}

function exitFor(err) {
  if (err instanceof FetchError) return EXIT.network;
  if (err instanceof ValidationError || err instanceof ParseError) return EXIT.validate;
  return EXIT.error;
}

export async function updateData(options) {
  const generatedDir = options.outDir || DEFAULT_GENERATED;
  const doShields = options.shields || (!options.shields && !options.endgame);
  const doEndgame = options.endgame || (!options.shields && !options.endgame);

  if (options.check) {
    const summary = await checkGeneratedDir(generatedDir);
    console.log("Generated data OK", summary);
    return { checked: true, summary };
  }

  if (options.fromFixtures) {
    const defaultGenerated = resolve(DEFAULT_GENERATED);
    if (resolve(generatedDir) === defaultGenerated && !options.force) {
      throw new ValidationError(
        "Refusing to write fixture/partial scrape over packages/data/generated. Pass --out-dir (and --force only if you really mean it).",
      );
    }
  }

  const shared = {
    origin: options.origin,
    fetchText: options.fetchText,
    concurrency: options.concurrency,
    dryRun: options.dryRun,
    force: options.force,
    outDir: generatedDir,
    requireRepoe: options.requireRepoe,
    generatedAt: options.generatedAt,
  };

  if (options.fromFixtures) {
    const fixtureDir = options.fixtureDir || DEFAULT_FIXTURES;
    const manifest = await loadManifest(fixtureDir);
    shared.fetchText = options.fetchText || createFixtureFetcher(fixtureDir);
    shared.origin = options.origin || manifest.origin || POE2DB_ORIGIN;
    if (doShields && manifest.shields) shared.bases = manifest.shields;
    if (doEndgame) {
      if (manifest.waystones) shared.waystoneTiers = manifest.waystones;
      if (manifest.tablets) shared.tabletKinds = manifest.tablets;
    }
  }

  // Fetch everything first, then write — avoid a half-updated generated dir.
  const payloads = {};
  if (doShields) {
    payloads.shields = await refreshShields(shared);
  }
  if (doEndgame) {
    payloads.endgame = await refreshEndgame(shared);
  }

  const writes = [];
  if (payloads.shields) {
    writes.push(...(await writeShieldOutputs(payloads.shields, shared)));
  }
  if (payloads.endgame) {
    writes.push(...(await writeEndgameOutputs(payloads.endgame, shared)));
  }

  const changed = writes.some((w) => w.written);
  if (payloads.shields) {
    console.log(
      `Shields: ${payloads.shields.list.length} families / ${payloads.shields.meta.tierCount} tiers; tags ${payloads.shields.harvestTags.length}`,
    );
  }
  if (payloads.endgame) {
    for (const t of payloads.endgame.waystones.tiers) {
      const c = payloads.endgame.waystones.counts[t.id];
      console.log(
        `Waystones ${t.labelZh}: ${c.families} families / ${c.tiers} tiers (skipped empty ${c.skippedEmpty})`,
      );
    }
    for (const k of payloads.endgame.tablets.kinds) {
      const c = payloads.endgame.tablets.counts[k.id];
      console.log(
        `Tablets ${k.labelZh}: ${c.families} families / ${c.tiers} tiers (skipped empty ${c.skippedEmpty})`,
      );
    }
  }
  if (options.dryRun) console.log("Dry run: no files written.");
  else if (!changed) console.log("No content change (generatedAt ignored).");
  else console.log(`Wrote ${generatedDir}`);
  return { payloads, writes, changed };
}

async function main(argv = process.argv.slice(2)) {
  const { flags } = parseArgs(argv);
  if (flags.help || flags.h) {
    printHelp();
    return EXIT.ok;
  }

  const fromFixtures = boolFlag(flags["from-fixtures"], flags["from-fixtures"] != null && flags["from-fixtures"] !== false);
  const fixtureDir =
    typeof flags["from-fixtures"] === "string" ? resolve(flags["from-fixtures"]) : DEFAULT_FIXTURES;

  try {
    await updateData({
      shields: boolFlag(flags.shields),
      endgame: boolFlag(flags.endgame),
      check: boolFlag(flags.check),
      fromFixtures,
      fixtureDir,
      outDir: flags["out-dir"] ? resolve(String(flags["out-dir"])) : undefined,
      dryRun: boolFlag(flags["dry-run"]),
      force: boolFlag(flags.force),
      concurrency: flags.concurrency ? Number(flags.concurrency) : 3,
      origin: flags.origin ? String(flags.origin) : undefined,
    });
    return EXIT.ok;
  } catch (err) {
    console.error(err instanceof Error ? `${err.name}: ${err.message}` : err);
    if (!(err instanceof FetchError || err instanceof ValidationError || err instanceof ParseError)) {
      if (err instanceof Error && err.stack) console.error(err.stack);
    }
    return exitFor(err);
  }
}

if (isMainModule(import.meta.url)) {
  main().then((code) => process.exit(code));
}

export { main };
