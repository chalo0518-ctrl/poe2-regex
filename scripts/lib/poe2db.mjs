/**
 * Shared poe2db.tw ModsView scrape helpers.
 * Public pages, no login. RePoE-fork is match-text fallback only.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { POE2DB_ORIGIN, REPOE_INDEX_URL, REPOE_MODS_URL } from "./catalogs.mjs";
import { fetchText as httpFetchText, FetchError } from "./http.mjs";

export { FetchError } from "./http.mjs";

export const UA = "Mozilla/5.0 (compatible; poe2-regex/0.1; +https://poe2db.tw)";

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = "ParseError";
  }
}

export const TAG_ORDER = [
  "ulaman_mod",
  "amanamu_mod",
  "kurgal_mod",
  "armour",
  "gem",
  "caster",
  "fire",
  "cold",
  "lightning",
  "chaos",
  "physical",
  "life",
  "elemental",
  "attack",
  "minion",
  "aura",
  "mana",
  "speed",
  "critical",
  "evasion",
  "energy_shield",
  "damage",
  "resistance",
  "attribute",
  "ailment",
  "curse",
  "charm",
];

export function extractModsView(html, label = "") {
  const idx = html.indexOf("new ModsView(");
  if (idx < 0) {
    throw new ParseError(`ModsView not found${label ? ` in ${label}` : ""}`);
  }
  const start = html.indexOf("{", idx);
  let i = start;
  let depth = 0;
  let inStr = false;
  let quote = "";
  let prev = "";
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === quote && prev !== "\\") inStr = false;
      prev = c;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
      prev = c;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") depth--;
    prev = c;
    if (depth === 0) {
      i++;
      break;
    }
  }
  try {
    return JSON.parse(html.slice(start, i));
  } catch (err) {
    throw new ParseError(
      `ModsView JSON parse failed${label ? ` in ${label}` : ""}: ${err?.message || err}`,
    );
  }
}

export function extractHarvestTags(html) {
  const found = [];
  const seen = new Set();
  for (const m of html.matchAll(
    /class="harvest-tag[^"]*"[^>]*data-harvest="([^"]+)"[^>]*>([^<]*)/g,
  )) {
    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    found.push({ id, labelZh: m[2].trim() });
  }
  if (found.length === 0) {
    for (const m of html.matchAll(/data-harvest="([^"]+)"[^>]*>([^<]*)/g)) {
      const id = m[1];
      if (seen.has(id)) continue;
      seen.add(id);
      found.push({ id, labelZh: m[2].trim() });
    }
  }
  found.sort((a, b) => {
    const ia = TAG_ORDER.indexOf(a.id);
    const ib = TAG_ORDER.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return found;
}

export function stripHtml(html) {
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseBadges(modNo) {
  const tags = [];
  for (const html of modNo || []) {
    const id = (html.match(/data-tag="([^"]+)"/) || [])[1];
    const labelZh = stripHtml(html);
    if (id) tags.push({ id, labelZh });
  }
  return tags;
}

export function inferTagsFromText(textZh, textEn) {
  const blob = `${textZh} ${textEn}`;
  const found = [];
  const rules = [
    [/護甲|Armour/i, "armour", "護甲"],
    [/閃避|Evasion/i, "evasion", "閃避"],
    [/能量護盾|Energy Shield/i, "energy_shield", "能量護盾"],
    [/最大生命|to maximum Life|生命/i, "life", "生命"],
    [/火焰|Fire/i, "fire", "火焰"],
    [/冰冷|Cold/i, "cold", "冰冷"],
    [/閃電|Lightning/i, "lightning", "閃電"],
    [/混沌|Chaos/i, "chaos", "混沌"],
    [/抗性|Resistance/i, "resistance", "抗性"],
    [/元素|Elemental/i, "elemental", "元素"],
    [/物理|Physical/i, "physical", "物理"],
    [/傷害|Damage/i, "damage", "傷害"],
    [/力量|敏捷|智慧|Strength|Dexterity|Intelligence|能力/i, "attribute", "能力"],
    [/暴擊|Critical/i, "critical", "暴擊"],
    [/法術|Spell/i, "caster", "法術"],
    [/魔力|Mana/i, "mana", "魔力"],
    [/攻擊|Attack/i, "attack", "攻擊"],
    [/召喚|召喚物|Minion/i, "minion", "召喚物"],
    [/速度|Speed/i, "speed", "速度"],
    [/寶石|Gem/i, "gem", "寶石"],
  ];
  for (const [re, id, labelZh] of rules) {
    if (re.test(blob)) found.push({ id, labelZh });
  }
  return found;
}

export function detect(cleaned) {
  if (/^\+\s*(\([^)]+\)|\d+)\s*%/.test(cleaned)) {
    return {
      format: "plusPercent",
      rest: cleaned.replace(/^\+\s*(\([^)]+\)|\d+)\s*%\s*/, "").trim(),
    };
  }
  if (/^\+\s*(\([^)]+\)|\d+)/.test(cleaned)) {
    return {
      format: "plusFlat",
      rest: cleaned.replace(/^\+\s*(\([^)]+\)|\d+)\s*/, "").trim(),
    };
  }
  if (/(\([^)]+\)|\d+)\s*%/.test(cleaned)) {
    return {
      format: "percentPrefix",
      rest: cleaned.replace(/(\([^)]+\)|\d+)\s*%\s*/, "").trim(),
    };
  }
  if (/\([^)]*[—–\-][^)]*\)/.test(cleaned)) {
    return {
      format: "bare",
      rest: cleaned.replace(/\([^)]+\)/g, "").replace(/\s+/g, " ").trim(),
    };
  }
  return { format: undefined, rest: cleaned };
}

export function parseRangeNums(text) {
  const m = text.match(/(\d+)\s*[—–\-]\s*(\d+)/);
  if (!m) return {};
  return { min: Number(m[1]), max: Number(m[2]) };
}

export function familyKey(mod) {
  return `${(mod.ModFamilyList || []).join("|")}|${mod.ModGenerationTypeID}`;
}

export async function fetchText(url, options = {}) {
  return httpFetchText(url, {
    ua: options.ua || UA,
    accept: options.accept || "text/html",
    ...options,
  });
}

export function parseRepoeByType(mods) {
  const byType = new Map();
  for (const mod of Object.values(mods || {})) {
    if (!mod?.type || !mod.text) continue;
    if (!byType.has(mod.type)) byType.set(mod.type, stripHtml(mod.text).split("\n")[0]);
  }
  return byType;
}

export function parseRepoeVersion(html) {
  const m = String(html).match(/PoE2 version\s+([0-9.]+)/i);
  return m ? m[1] : null;
}

export async function loadRepoeByType(options = {}) {
  const url = options.repoeModsUrl || options.url || REPOE_MODS_URL;
  const fetchFn = options.fetchText || fetchText;
  try {
    const text = await fetchFn(url, { accept: "application/json" });
    const mods = JSON.parse(text);
    return parseRepoeByType(mods);
  } catch (err) {
    if (options.required) {
      throw err instanceof FetchError
        ? err
        : new FetchError(`RePoE mods failed: ${err?.message || err}`, {
            url,
            code: "repoe",
            cause: err,
          });
    }
    console.warn(`RePoE fallback skipped (${url}): ${err?.message || err}`);
    return new Map();
  }
}

export async function loadRepoeVersion(options = {}) {
  const url = options.repoeIndexUrl || REPOE_INDEX_URL;
  const fetchFn = options.fetchText || fetchText;
  try {
    const html = await fetchFn(url, { accept: "text/html" });
    return parseRepoeVersion(html);
  } catch (err) {
    if (options.required) throw err;
    console.warn(`RePoE version skipped (${url}): ${err?.message || err}`);
    return null;
  }
}

export function indexByTier(view) {
  const map = new Map();
  for (const mod of view.normal || []) {
    map.set(`${(mod.ModFamilyList || []).join("|")}|${mod.ModGenerationTypeID}|${mod.Level}`, mod);
  }
  return map;
}

function sortFamilies(list) {
  list.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });
  return list;
}

export function finalizeFamilyRow(row) {
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
}

export function parsePageFamilies(twView, usView, options = {}) {
  const { skipEmpty = true, extraIdPrefix = "" } = options;
  const usIndex = indexByTier(usView);
  const families = new Map();
  let skippedEmpty = 0;

  for (const tw of twView.normal || []) {
    const fam = familyKey(tw);
    const us =
      usIndex.get(`${(tw.ModFamilyList || []).join("|")}|${tw.ModGenerationTypeID}|${tw.Level}`) ||
      null;
    const textZh = stripHtml(tw.str);
    const textEn = us ? stripHtml(us.str) : "";
    if (skipEmpty && !textZh && !textEn) {
      skippedEmpty += 1;
      continue;
    }
    const detected = detect(textEn || textZh);
    const matchEn = detected.rest || textEn;
    const matchZh = detect(textZh).rest || textZh;
    const badges = parseBadges(tw.mod_no);
    const inferred = inferTagsFromText(textZh, textEn);
    const harvestIds = [
      ...new Set([...(tw.fossil_no || []), ...badges.map((b) => b.id), ...inferred.map((b) => b.id)]),
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
      families.set(fam, {
        id: extraIdPrefix ? `${extraIdPrefix}|${fam}` : fam,
        family: familyName,
        generation: tw.ModGenerationTypeID === "2" ? "suffix" : "prefix",
        tags: harvestIds,
        tagsZh,
        labelZh: tw.Name,
        labelEn: us?.Name || familyName,
        textZh,
        textEn,
        match: matchEn || matchZh,
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
        row.numeric.suggestedMin == null ? nums.min : Math.min(row.numeric.suggestedMin, nums.min);
    }
    if (row.numeric && nums.max != null) {
      row.numeric.suggestedMax =
        row.numeric.suggestedMax == null ? nums.max : Math.max(row.numeric.suggestedMax, nums.max);
    }
  }

  const list = sortFamilies([...families.values()].map(finalizeFamilyRow));
  return { list, skippedEmpty };
}

export function mergeNumeric(a, b) {
  if (!a && !b) return undefined;
  const out = { ...(a || b) };
  for (const src of [a, b]) {
    if (!src) continue;
    if (src.format) out.format = src.format;
    if (src.suggestedMin != null) {
      out.suggestedMin =
        out.suggestedMin == null ? src.suggestedMin : Math.min(out.suggestedMin, src.suggestedMin);
    }
    if (src.suggestedMax != null) {
      out.suggestedMax =
        out.suggestedMax == null ? src.suggestedMax : Math.max(out.suggestedMax, src.suggestedMax);
    }
  }
  return out;
}

export function mergeFamilyRow(a, b, extra = {}) {
  const seen = new Set(a.tiers.map((t) => `${t.level}|${t.nameZh}|${t.textZh}`));
  const tiers = [...a.tiers];
  for (const t of b.tiers) {
    const tk = `${t.level}|${t.nameZh}|${t.textZh}`;
    if (!seen.has(tk)) {
      seen.add(tk);
      tiers.push(t);
    }
  }
  const tagsZh = [...a.tagsZh];
  for (const label of b.tagsZh) {
    if (!tagsZh.includes(label)) tagsZh.push(label);
  }
  const merged = {
    ...a,
    ...extra,
    tags: [...new Set([...a.tags, ...b.tags])],
    tagsZh,
    match: a.match || b.match,
    matchZh: a.matchZh || b.matchZh,
    textEn: a.textEn || b.textEn,
    labelEn: a.labelEn || b.labelEn,
    kind: a.kind === "numeric" || b.kind === "numeric" ? "numeric" : a.kind,
    numeric: mergeNumeric(a.numeric, b.numeric),
    tiers,
    seenTiers: new Set(),
  };
  return finalizeFamilyRow(merged);
}

export function applyRepoeFallback(list, repoe) {
  for (const row of list) {
    if (row.textEn && row.match) continue;
    const repoeText = repoe.get(row.family);
    if (!repoeText) continue;
    const detected = detect(repoeText);
    if (!row.textEn) row.textEn = repoeText;
    if (!row.match) row.match = detected.rest || repoeText;
    if (!row.labelEn) row.labelEn = row.family;
  }
  return list;
}

export async function scrapeModifiersPage(path, options = {}) {
  const origin = options.origin || POE2DB_ORIGIN;
  const fetchFn = options.fetchText || fetchText;
  const twUrl = `${origin}/tw/${path}`;
  const usUrl = `${origin}/us/${path}`;
  const [twHtml, usHtml] = await Promise.all([fetchFn(twUrl), fetchFn(usUrl)]);
  return {
    path,
    twUrl,
    usUrl,
    twHtml,
    usHtml,
    twView: extractModsView(twHtml, twUrl),
    usView: extractModsView(usHtml, usUrl),
    tags: extractHarvestTags(twHtml),
  };
}

/**
 * Map https://poe2db.tw/{locale}/{Path} (and RePoE URLs) onto files under scripts/fixtures.
 */
export function createFixtureFetcher(fixtureDir) {
  return async function fetchFixture(url) {
    const text = String(url);
    if (/mods(\.min)?\.json/i.test(text) || text.endsWith("mods.sample.json")) {
      return readFile(join(fixtureDir, "repoe", "mods.sample.json"), "utf8");
    }
    if (/repoe-fork\.github\.io\/poe2\/?$/i.test(text) || /\/poe2\/?$/.test(text)) {
      return "<title>RePoE - PoE2 version 4.5.5.2</title>";
    }
    let locale;
    let page;
    try {
      const u = new URL(text);
      const parts = u.pathname.split("/").filter(Boolean);
      locale = parts[0];
      page = parts.slice(1).join("/");
    } catch {
      throw new FetchError(`Cannot map fixture URL ${url}`, { url, code: "fixture" });
    }
    if (!page || (locale !== "tw" && locale !== "us")) {
      throw new FetchError(`No fixture mapping for ${url}`, { url, code: "fixture" });
    }
    try {
      return await readFile(join(fixtureDir, "html", locale, `${page}.html`), "utf8");
    } catch (err) {
      throw new FetchError(`Missing fixture for ${url} (${err?.message || err})`, {
        url,
        code: "fixture",
        cause: err,
      });
    }
  };
}
