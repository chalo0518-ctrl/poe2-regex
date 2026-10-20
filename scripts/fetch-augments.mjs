#!/usr/bin/env node
/**
 * Scrape poe2db.tw /us and /tw Augment into packages/data/generated/augments.json.
 * Not part of the fixture update path. Run by hand when the augment list changes.
 *
 * Sources: https://poe2db.tw/us/Augment and https://poe2db.tw/tw/Augment
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/data/generated/augments.json");

const MARTIAL = ["claw", "dagger", "sword1h", "axe1h", "mace1h", "sword2h", "axe2h", "mace2h", "spear", "quarterstaff", "flail", "bow", "crossbow"];
const CASTER = ["wand", "staff", "sceptre"];
const ARMOUR = ["body", "helmet", "gloves", "boots"];
const WEAPONS = [...MARTIAL, ...CASTER];
const SOCKETED = [...ARMOUR, "shield", ...WEAPONS];

/** English implicit prefix → craft slots. Foci and talismans have no craft slot. */
const PREFIXES = {
  "Martial Weapon": MARTIAL,
  Armour: ARMOUR,
  "Wand or Staff": ["wand", "staff"],
  Helmets: ["helmet"],
  "Body Armours": ["body"],
  Gloves: ["gloves"],
  Sceptres: ["sceptre"],
  Boots: ["boots"],
  Weapon: WEAPONS,
  "All Equipment": SOCKETED,
  Shields: ["shield"],
  Wands: ["wand"],
  "One Hand Maces": ["mace1h"],
  Bows: ["bow"],
  Bucklers: ["shield"],
  "Two Hand Maces": ["mace2h"],
  "Shields and Bucklers": ["shield"],
  "Caster Weapon": CASTER,
  Quarterstaves: ["quarterstaff"],
  "Martial Weapon, Wand or Staff": [...MARTIAL, "wand", "staff"],
  Foci: [],
  Talismans: [],
  Spears: ["spear"],
  Staves: ["staff"],
  Crossbows: ["crossbow"],
  "One Hand Mace or Quarterstaff": ["mace1h", "quarterstaff"],
  "Crossbow, Bow or Spear": ["crossbow", "bow", "spear"],
  "One Hand Mace, Two Hand Mace or Talisman": ["mace1h", "mace2h"],
  "Quarterstaff or Spear": ["quarterstaff", "spear"],
};

/** When two size-1 lines both hit shield, prefer Shields over the combined line over Bucklers. */
const BIAS = {
  Shields: 0,
  "Shields and Bucklers": 1,
  Bucklers: 2,
};

function decode(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function textify(fragment) {
  const stripped = decode(fragment.replace(/<[^>]+>/g, ""));
  return stripped.replace(/\s+/g, " ").trim();
}

function cards(html) {
  const parts = html.split(/<a class="whiteitem[^"]*" data-hover="[^"]*" href="([^"]+)">([^<]+)<\/a>/);
  const out = [];
  for (let i = 1; i + 2 < parts.length; i += 3) {
    out.push({ slug: parts[i], name: decode(parts[i + 1]), body: parts[i + 2] });
  }
  return out;
}

function firstBySlug(list) {
  const map = new Map();
  for (const card of list) {
    if (!map.has(card.slug)) map.set(card.slug, card);
  }
  return map;
}

function kindOf(name) {
  if (/\bRune\b/.test(name)) return "rune";
  if (name.includes("Soul Core")) return "soul-core";
  if (/\bIdol\b/.test(name)) return "idol";
  if (/\bGaze\b/.test(name)) return "abyssal-eye";
  return "augment";
}

function prefixOf(line) {
  const split = line.split(/[:：]/);
  if (split.length < 2) return null;
  return split[0].trim();
}

async function main() {
  const [usHtml, twHtml] = await Promise.all([
    fetch("https://poe2db.tw/us/Augment").then((res) => {
      if (!res.ok) throw new Error(`us Augment ${res.status}`);
      return res.text();
    }),
    fetch("https://poe2db.tw/tw/Augment").then((res) => {
      if (!res.ok) throw new Error(`tw Augment ${res.status}`);
      return res.text();
    }),
  ]);
  const us = firstBySlug(cards(usHtml));
  const tw = firstBySlug(cards(twHtml));
  if (us.size !== tw.size) throw new Error(`slug count ${us.size} vs ${tw.size}`);

  const unknown = new Set();
  const augments = [];
  for (const [slug, card] of us) {
    const zh = tw.get(slug);
    if (!zh) throw new Error(`missing zh ${slug}`);
    if (card.name.includes("[DNT") || card.name.includes("Unused")) continue;
    const enLines = [...card.body.matchAll(/<div class="implicitMod">(.*?)<\/div>/gs)].map((m) => textify(m[1]));
    const zhLines = [...zh.body.matchAll(/<div class="implicitMod">(.*?)<\/div>/gs)].map((m) => textify(m[1]));
    if (enLines.length !== zhLines.length) throw new Error(`effect mismatch ${slug}`);
    const effects = [];
    for (let i = 0; i < enLines.length; i += 1) {
      const label = prefixOf(enLines[i]);
      if (!label || !(label in PREFIXES)) {
        if (label) unknown.add(label);
        continue;
      }
      const slots = PREFIXES[label];
      if (slots.length === 0) continue;
      effects.push({
        slots,
        zh: zhLines[i],
        en: enLines[i],
        bias: BIAS[label] ?? 0,
      });
    }
    if (effects.length === 0) continue;
    const levelMatch = card.body.match(/Level\s+(\d+)/);
    const limited = card.body.match(/Limited to:\s*<span[^>]*>([^<]+)<\/span>/);
    augments.push({
      id: slug,
      nameZh: zh.name,
      nameEn: card.name,
      kind: kindOf(card.name),
      level: levelMatch ? Number(levelMatch[1]) : 0,
      socketBound: card.body.includes("Socket-bound_Augments"),
      limitOne: limited?.[1].trim() === "1",
      effects,
    });
  }

  augments.sort((a, b) => a.kind.localeCompare(b.kind) || a.nameEn.localeCompare(b.nameEn) || a.id.localeCompare(b.id));
  const payload = {
    source: "https://poe2db.tw/us/Augment + https://poe2db.tw/tw/Augment",
    augments,
  };
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  const kinds = {};
  for (const row of augments) kinds[row.kind] = (kinds[row.kind] ?? 0) + 1;
  console.log(`wrote ${augments.length} augments`);
  console.log(kinds);
  console.log("socket-bound", augments.filter((row) => row.socketBound).length);
  if (unknown.size) console.log("unknown prefixes", [...unknown]);
}

main();
