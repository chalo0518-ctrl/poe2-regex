#!/usr/bin/env node
/**
 * Scrape poe2db.tw/tw (and /us) Shields ModifiersCalc into frozen JSON.
 * Public pages, no login. Families are unioned across shield bases.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyRepoeFallback,
  detect,
  extractHarvestTags,
  extractModsView,
  familyKey,
  fetchText,
  indexByTier,
  inferTagsFromText,
  loadRepoeByType,
  parseBadges,
  parseRangeNums,
  stripHtml,
} from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "packages/data/generated");

const BASES = [
  { id: "str", labelZh: "力量塔盾", path: "Shields_str" },
  { id: "str_dex", labelZh: "力／敏盾", path: "Shields_str_dex" },
  { id: "str_int", labelZh: "力／智盾", path: "Shields_str_int" },
  { id: "buckler", labelZh: "輕盾", path: "Bucklers" },
];

async function main() {
  const [repoe, pages] = await Promise.all([
    loadRepoeByType(),
    Promise.all(
      BASES.map(async (base) => {
        const twUrl = `https://poe2db.tw/tw/${base.path}`;
        const usUrl = `https://poe2db.tw/us/${base.path}`;
        const [twHtml, usHtml] = await Promise.all([fetchText(twUrl), fetchText(usUrl)]);
        return {
          base,
          twHtml,
          usHtml,
          twView: extractModsView(twHtml),
          usView: extractModsView(usHtml),
          tags: extractHarvestTags(twHtml),
        };
      }),
    ),
  ]);

  const harvestTags = pages[0].tags;
  const families = new Map();

  for (const page of pages) {
    const usIndex = indexByTier(page.usView);
    for (const tw of page.twView.normal || []) {
      const fam = familyKey(tw);
      const us =
        usIndex.get(`${(tw.ModFamilyList || []).join("|")}|${tw.ModGenerationTypeID}|${tw.Level}`) ||
        null;
      const textZh = stripHtml(tw.str);
      const textEn = us ? stripHtml(us.str) : "";
      const detected = detect(textEn || textZh);
      const matchEn = detected.rest || textEn;
      const matchZh = detect(textZh).rest || textZh;
      const badges = parseBadges(tw.mod_no);
      const inferred = inferTagsFromText(textZh, textEn);
      const harvestIds = [
        ...new Set([
          ...(tw.fossil_no || []),
          ...badges.map((b) => b.id),
          ...inferred.map((b) => b.id),
        ]),
      ];
      const tagsZh = [
        ...new Set([...badges.map((b) => b.labelZh), ...inferred.map((b) => b.labelZh)]),
      ];
      const nums = parseRangeNums(textZh);
      const tier = {
        nameZh: tw.Name,
        nameEn: us?.Name || "",
        level: Number(tw.Level) || 0,
        textZh,
        textEn,
        dropChance: Number(tw.DropChance) || 0,
        statMin: nums.min,
        statMax: nums.max,
      };

      if (!families.has(fam)) {
        const familyName = (tw.ModFamilyList || [])[0] || fam;
        const repoeText = repoe.get(familyName);
        const repoeMatch = repoeText ? detect(repoeText).rest : "";
        families.set(fam, {
          id: fam,
          family: familyName,
          generation: tw.ModGenerationTypeID === "2" ? "suffix" : "prefix",
          bases: [],
          tags: harvestIds,
          tagsZh,
          labelZh: tw.Name,
          labelEn: us?.Name || familyName,
          textZh,
          textEn: textEn || repoeText || "",
          match: matchEn || repoeMatch || matchZh,
          matchZh,
          kind: detected.format ? "numeric" : "flag",
          numeric: detected.format
            ? { format: detected.format, suggestedMin: nums.min, suggestedMax: nums.max }
            : undefined,
          tiers: [],
          seenTiers: new Set(),
        });
      }

      const row = families.get(fam);
      if (!row.bases.includes(page.base.id)) row.bases.push(page.base.id);
      row.tags = [...new Set([...row.tags, ...harvestIds])];
      for (const label of tagsZh) {
        if (!row.tagsZh.includes(label)) row.tagsZh.push(label);
      }
      const tk = `${tier.level}|${tier.nameZh}|${tier.textZh}`;
      if (!row.seenTiers.has(tk)) {
        row.seenTiers.add(tk);
        row.tiers.push(tier);
      }
      if (row.numeric && nums.min != null) {
        row.numeric.suggestedMin =
          row.numeric.suggestedMin == null
            ? nums.min
            : Math.min(row.numeric.suggestedMin, nums.min);
      }
      if (row.numeric && nums.max != null) {
        row.numeric.suggestedMax =
          row.numeric.suggestedMax == null
            ? nums.max
            : Math.max(row.numeric.suggestedMax, nums.max);
      }
    }
  }

  const list = [...families.values()].map((row) => {
    row.tiers.sort((a, b) => a.level - b.level || a.nameZh.localeCompare(b.nameZh, "zh-Hant"));
    const first = row.tiers[0];
    const last = row.tiers[row.tiers.length - 1];
    delete row.seenTiers;
    return {
      ...row,
      labelZh: first?.nameZh || row.labelZh,
      labelEn: first?.nameEn || row.labelEn,
      textZh: first?.textZh || row.textZh,
      textEn: first?.textEn || row.textEn,
      minLevel: first?.level ?? 0,
      maxLevel: last?.level ?? 0,
      tierCount: row.tiers.length,
      weight: row.tiers.reduce((s, t) => s + (t.dropChance || 0), 0),
    };
  });
  applyRepoeFallback(list, repoe);

  list.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });

  const meta = {
    source: "https://poe2db.tw/tw/",
    pages: BASES.map((b) => `https://poe2db.tw/tw/${b.path}#ModifiersCalc`),
    gameVersion: "poe2db.tw scrape",
    generatedAt: new Date().toISOString(),
    familyCount: list.length,
    tierCount: list.reduce((s, f) => s + f.tiers.length, 0),
    bases: BASES,
    notes: "Frozen Chronicles ModifiersCalc scrape for str / str_dex / str_int shields and Bucklers. EN names from /us; RePoE used only as match-id fallback.",
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, "shields.json"), JSON.stringify(list, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "tags.json"), JSON.stringify(harvestTags, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  console.log(
    `Wrote ${list.length} families / ${meta.tierCount} tiers; tags ${harvestTags.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
