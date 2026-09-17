/**
 * Shared poe2db.tw ModsView scrape helpers.
 * Public pages, no login.
 */

export const UA = "Mozilla/5.0 (compatible; poe2-regex/0.1; +https://poe2db.tw)";

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

export function extractModsView(html) {
  const idx = html.indexOf("new ModsView(");
  if (idx < 0) throw new Error("ModsView not found");
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
  return JSON.parse(html.slice(start, i));
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

export async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

export async function loadRepoeByType() {
  try {
    const res = await fetch("https://repoe-fork.github.io/poe2/mods.min.json", {
      headers: { "user-agent": UA },
    });
    if (!res.ok) return new Map();
    const mods = await res.json();
    const byType = new Map();
    for (const mod of Object.values(mods)) {
      if (!mod.type || !mod.text) continue;
      if (!byType.has(mod.type)) byType.set(mod.type, stripHtml(mod.text).split("\n")[0]);
    }
    return byType;
  } catch {
    return new Map();
  }
}

export function indexByTier(view) {
  const map = new Map();
  for (const mod of view.normal || []) {
    map.set(`${(mod.ModFamilyList || []).join("|")}|${mod.ModGenerationTypeID}|${mod.Level}`, mod);
  }
  return map;
}

export function parsePageFamilies(twView, usView, harvestIdsFromText, options = {}) {
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
      ...new Set([
        ...(tw.fossil_no || []),
        ...badges.map((b) => b.id),
        ...inferred.map((b) => b.id),
        ...(harvestIdsFromText ? [] : []),
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

  list.sort((a, b) => {
    if (a.generation !== b.generation) return a.generation === "prefix" ? -1 : 1;
    return a.textZh.localeCompare(b.textZh, "zh-Hant");
  });

  return { list, skippedEmpty };
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

export async function scrapeModifiersPage(path) {
  const twUrl = `https://poe2db.tw/tw/${path}`;
  const usUrl = `https://poe2db.tw/us/${path}`;
  const [twHtml, usHtml] = await Promise.all([fetchText(twUrl), fetchText(usUrl)]);
  return {
    path,
    twUrl,
    usUrl,
    twHtml,
    usHtml,
    twView: extractModsView(twHtml),
    usView: extractModsView(usHtml),
    tags: extractHarvestTags(twHtml),
  };
}
