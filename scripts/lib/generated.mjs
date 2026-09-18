/**
 * Atomic writes, idempotent compare (ignore generatedAt), and catalog checks.
 * Never invents affix text — only validates / writes what parsers produced.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { GENERATED_FILES } from "./catalogs.mjs";

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

export function stripGeneratedAt(value) {
  if (Array.isArray(value)) return value.map(stripGeneratedAt);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "generatedAt") continue;
      out[k] = stripGeneratedAt(v);
    }
    return out;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(stripGeneratedAt(value));
}

export function stringifyGenerated(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

export async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Write JSON if the canonical payload changed. `generatedAt` alone does not count.
 * @returns {Promise<{ written: boolean, reason: string }>}
 */
export async function writeGeneratedJson(path, value, { dryRun = false, idempotent = true } = {}) {
  const nextText = stringifyGenerated(value);
  if (idempotent) {
    const prev = await readJsonIfExists(path);
    if (prev && canonicalJson(prev) === canonicalJson(value)) {
      return { written: false, reason: "unchanged" };
    }
  }
  if (dryRun) {
    return { written: false, reason: "dry-run" };
  }
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, nextText);
  await rename(tmp, path);
  return { written: true, reason: "updated" };
}

export function assertFamilyShape(family, label) {
  if (!family || typeof family !== "object") {
    throw new ValidationError(`${label}: not an object`);
  }
  if (!family.id || !family.family) {
    throw new ValidationError(`${label}: missing id/family`);
  }
  if (family.generation !== "prefix" && family.generation !== "suffix") {
    throw new ValidationError(`${label}: bad generation ${family.generation}`);
  }
  if (!family.matchZh) {
    throw new ValidationError(`${label}: empty matchZh`);
  }
  if (!family.textZh && !family.textEn) {
    throw new ValidationError(`${label}: missing effect text`);
  }
  if (!Array.isArray(family.tiers) || family.tiers.length === 0) {
    throw new ValidationError(`${label}: no tiers`);
  }
}

export function assertFamilyList(list, label) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new ValidationError(`${label}: empty family list`);
  }
  const ids = new Set();
  for (const family of list) {
    assertFamilyShape(family, `${label} ${family?.id || "?"}`);
    if (ids.has(family.id)) {
      throw new ValidationError(`${label}: duplicate id ${family.id}`);
    }
    ids.add(family.id);
  }
}

/**
 * Refuse to overwrite a healthy snapshot with a collapsed scrape.
 * @param {number | null | undefined} previous
 * @param {number} next
 * @param {string} label
 * @param {{ maxDropRatio?: number, force?: boolean }} [opts]
 */
export function assertNoCatastrophicDrop(previous, next, label, opts = {}) {
  if (opts.force) return;
  if (previous == null || previous <= 0) return;
  const maxDropRatio = opts.maxDropRatio ?? 0.3;
  if (next < previous * (1 - maxDropRatio)) {
    throw new ValidationError(
      `${label}: count ${next} dropped from ${previous} (max drop ${Math.round(maxDropRatio * 100)}%). Re-run with --force if this game patch really removed that many families.`,
    );
  }
}

export function assertShieldPayload(list, tags, meta) {
  assertFamilyList(list, "shields");
  for (const family of list) {
    if (!Array.isArray(family.bases) || family.bases.length === 0) {
      throw new ValidationError(`shields ${family.id}: missing bases`);
    }
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new ValidationError("tags.json is empty");
  }
  if (!meta?.source || !meta.bases?.length) {
    throw new ValidationError("meta.json missing source/bases");
  }
  if (meta.familyCount !== list.length) {
    throw new ValidationError(`meta.familyCount ${meta.familyCount} != ${list.length}`);
  }
}

export function assertWaystoneCatalog(catalog) {
  if (!catalog?.byTier || !catalog.tiers?.length) {
    throw new ValidationError("waystones.json missing byTier/tiers");
  }
  for (const tier of catalog.tiers) {
    const list = catalog.byTier[tier.id];
    assertFamilyList(list, `waystones.${tier.id}`);
    if (!list.every((f) => f.tier === tier.id)) {
      throw new ValidationError(`waystones.${tier.id}: family.tier mismatch`);
    }
    if (!list.every((f) => String(f.id).startsWith(`waystone:${tier.id}|`))) {
      throw new ValidationError(`waystones.${tier.id}: id prefix mismatch`);
    }
    const counted = catalog.counts?.[tier.id]?.families;
    if (counted != null && counted !== list.length) {
      throw new ValidationError(`waystones.${tier.id}: counts.families ${counted} != ${list.length}`);
    }
  }
}

export function assertTabletCatalog(catalog) {
  if (!catalog?.byKind || !catalog.kinds?.length) {
    throw new ValidationError("tablets.json missing byKind/kinds");
  }
  for (const kind of catalog.kinds) {
    const list = catalog.byKind[kind.id];
    assertFamilyList(list, `tablets.${kind.id}`);
    if (!list.every((f) => f.tabletKind === kind.id)) {
      throw new ValidationError(`tablets.${kind.id}: family.tabletKind mismatch`);
    }
    if (!list.every((f) => String(f.id).startsWith(`tablet:${kind.id}|`))) {
      throw new ValidationError(`tablets.${kind.id}: id prefix mismatch`);
    }
    const counted = catalog.counts?.[kind.id]?.families;
    if (counted != null && counted !== list.length) {
      throw new ValidationError(`tablets.${kind.id}: counts.families ${counted} != ${list.length}`);
    }
  }
}

export async function checkGeneratedDir(dir) {
  const missing = [];
  const data = {};
  for (const name of GENERATED_FILES) {
    const value = await readJsonIfExists(join(dir, name));
    if (value == null) missing.push(name);
    else data[name.replace(/\.json$/, "")] = value;
  }
  if (missing.length) {
    throw new ValidationError(`missing generated files: ${missing.join(", ")}`);
  }
  assertShieldPayload(data.shields, data.tags, data.meta);
  assertWaystoneCatalog(data.waystones);
  assertTabletCatalog(data.tablets);
  return {
    shields: data.shields.length,
    waystones: Object.fromEntries(
      data.waystones.tiers.map((t) => [t.id, data.waystones.byTier[t.id].length]),
    ),
    tablets: Object.fromEntries(
      data.tablets.kinds.map((k) => [k.id, data.tablets.byKind[k.id].length]),
    ),
  };
}
