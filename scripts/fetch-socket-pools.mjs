#!/usr/bin/env node
/**
 * Build socket-pools.json from the poe2db item pages of augments that change
 * affix counts or unlock a modifier pool. Not part of the fixture update path.
 *
 * Sources: https://poe2db.tw/tw/<slug> and /us/<slug> for each id below.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detect, parseRangeNums } from "./lib/poe2db.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/data/generated/socket-pools.json");

const TAG_ZH = {
  physical: "物理",
  fire: "火焰",
  cold: "冰冷",
  lightning: "閃電",
  chaos: "混沌",
  elemental: "元素",
  life: "生命",
  mana: "魔力",
  armour: "護甲",
  evasion: "閃避",
  energy_shield: "能量護盾",
  speed: "速度",
  critical: "暴擊",
  damage: "傷害",
  ailment: "異常狀態",
  resistance: "抗性",
  attack: "攻擊",
  caster: "法術",
  curse: "詛咒",
};

/** Augments whose implicit changes how many mods can roll, or unlocks a pool. */
const PAGES = [
  "Serles_Triumph",
  "Astrids_Creativity",
  "Thruds_Might",
  "Voranas_Carnage",
  "Uhtreds_Sidereus",
  "Medveds_Tending",
  "Kolrs_Hunt",
  "Katlas_Gloom",
];

function decode(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function textify(fragment) {
  const withBreaks = fragment
    .replace(/<br\s*\/?>/gi, " / ")
    .replace(/<span class="secondary">[\s\S]*?<\/span>/gi, "")
    .replace(/<span class="badge[\s\S]*?<\/span>/gi, "");
  return decode(withBreaks.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function stem(text) {
  return text.replace(/[0-9０-９%％+\-—–()（）\s,，./／]/g, "");
}

async function page(locale, slug) {
  const res = await fetch(`https://poe2db.tw/${locale}/${slug}`, {
    headers: { "user-agent": "poe2-regex-socket-pools" },
  });
  if (!res.ok) throw new Error(`${locale}/${slug} ${res.status}`);
  return res.text();
}

function implicit(html) {
  const m = html.match(/<div class="implicitMod">([\s\S]*?)<\/div>/);
  if (!m) return "";
  return textify(m[1]).replace(/,\s*$/, "").trim();
}

function nameOf(html) {
  const m = html.match(/<a class="whiteitem[^"]*"[^>]*>([^<]+)<\/a>/);
  return m ? decode(m[1]) : "";
}

function modifierRows(html) {
  const body = html.match(/id="Modifiers"[\s\S]*?<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  if (!body) return [];
  const rows = [];
  for (const tr of body[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const tds = [...tr[1].matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (tds.length < 4) continue;
    const side = textify(tds[2]);
    rows.push({
      name: textify(tds[0]),
      level: Number(textify(tds[1])) || 0,
      generation: side === "前綴" || side === "Prefix" ? "prefix" : "suffix",
      text: textify(tds[3]),
      tags: [...tds[3].matchAll(/data-tag="([^"]+)"/g)].map((m) => m[1]),
    });
  }
  return rows;
}

function familiesFor(slug, twRows, enRows) {
  if (twRows.length !== enRows.length) throw new Error(`${slug} row mismatch ${twRows.length}/${enRows.length}`);
  const groups = [];
  for (let i = 0; i < twRows.length; i += 1) {
    const tw = twRows[i];
    const en = enRows[i];
    const key = `${tw.generation}|${stem(tw.text)}`;
    let group = groups.find((row) => row.key === key);
    if (!group) {
      group = { key, generation: tw.generation, nameZh: tw.name, nameEn: en.name, tags: new Set(), tiers: [] };
      groups.push(group);
    }
    for (const tag of tw.tags) group.tags.add(tag);
    const zhRange = parseRangeNums(tw.text);
    const detected = detect(tw.text.split(" / ")[0] || tw.text);
    group.tiers.push({
      nameZh: tw.name,
      nameEn: en.name,
      level: tw.level,
      textZh: tw.text,
      textEn: en.text,
      dropChance: 0,
      ...(zhRange.min != null ? { statMin: zhRange.min, statMax: zhRange.max } : {}),
      format: detected.format,
      matchZh: detected.rest || tw.text,
      matchEn: detect(en.text.split(" / ")[0] || en.text).rest || en.text,
    });
  }
  return groups.map((group, index) => {
    const tiers = group.tiers.sort((a, b) => a.level - b.level || a.statMin - b.statMin);
    const top = tiers[tiers.length - 1];
    const tags = [...group.tags];
    const format = tiers.find((tier) => tier.format)?.format;
    const id = `${slug}:${index}`;
    return {
      id,
      family: id,
      generation: group.generation,
      tags,
      tagsZh: tags.map((tag) => TAG_ZH[tag] || tag),
      labelZh: group.nameZh,
      labelEn: group.nameEn,
      textZh: top.textZh,
      textEn: top.textEn,
      match: top.matchEn,
      matchZh: top.matchZh,
      kind: format ? "numeric" : "flag",
      ...(format
        ? {
            numeric: {
              format,
              ...(top.statMin != null ? { suggestedMin: top.statMin, suggestedMax: top.statMax } : {}),
            },
          }
        : {}),
      tiers: tiers.map(({ format: _format, matchZh: _zh, matchEn: _en, ...tier }) => tier),
      minLevel: tiers[0].level,
      maxLevel: top.level,
      tierCount: tiers.length,
      weight: tiers.length,
    };
  });
}

function bonuses(effectEn) {
  return {
    prefixBonus: /Prefix Modifier allowed/i.test(effectEn) ? 1 : 0,
    suffixBonus: /Suffix Modifier allowed/i.test(effectEn) ? 1 : 0,
    craftedBonus: /additional Crafted/i.test(effectEn) ? 1 : 0,
  };
}

function slotsFor(effectEn) {
  const martial = ["claw", "dagger", "sword1h", "axe1h", "mace1h", "sword2h", "axe2h", "mace2h", "spear", "quarterstaff", "flail", "bow", "crossbow"];
  const caster = ["wand", "staff", "sceptre"];
  const armour = ["body", "helmet", "gloves", "boots"];
  const weapons = [...martial, ...caster];
  const label = effectEn.split(":")[0].trim();
  if (label === "All Equipment") return [...armour, "shield", ...weapons];
  if (label === "Weapon") return weapons;
  if (label === "Body Armours") return ["body"];
  if (label === "Helmets") return ["helmet"];
  if (label === "Gloves") return ["gloves"];
  if (label === "Boots") return ["boots"];
  throw new Error(`unmapped slot label ${label}`);
}

async function main() {
  const augments = [];
  for (const slug of PAGES) {
    const [tw, us] = await Promise.all([page("tw", slug), page("us", slug)]);
    const effectZh = implicit(tw);
    const effectEn = implicit(us);
    const families = familiesFor(slug, modifierRows(tw), modifierRows(us));
    augments.push({
      id: slug,
      nameZh: nameOf(tw),
      nameEn: nameOf(us),
      socketBound: tw.includes("Socket-bound_Augments") || tw.includes("插槽綁定"),
      limitOne: /僅限:\s*1|Limited to:\s*<span[^>]*>1</.test(tw) || /Limited to:/.test(us),
      slots: slotsFor(effectEn),
      effectZh,
      effectEn,
      ...bonuses(effectEn),
      families,
    });
  }
  writeFileSync(OUT, `${JSON.stringify({ source: "https://poe2db.tw/tw/ + /us/ augment item pages", augments }, null, 2)}\n`);
  for (const row of augments) {
    console.log(`${row.id} ${row.nameZh} / ${row.nameEn} families ${row.families.length} suffix+${row.suffixBonus} crafted+${row.craftedBonus}`);
    console.log(`  ${row.effectZh}`);
    console.log(`  ${row.effectEn}`);
  }
}

main();
