import type { AffixFamily, CraftSlotId } from "./types.ts";

import { weaponCatalog } from "./weapons.ts";

const wandRecipes = [
  {
    "nameEn": "Essence of Alacrity",
    "nameZh": "輕快精髓",
    "textEn": "(17—20)% increased Cast Speed",
    "textZh": "增加(17—20)%施法速度",
    "generation": "suffix",
    "level": 24
  },
  {
    "nameEn": "Essence of Seeking",
    "nameZh": "探尋精髓",
    "textEn": "(40—46)% increased Critical Hit Chance for Spells",
    "textZh": "增加(40—46)%法術暴擊率",
    "generation": "suffix",
    "level": 22
  },
  {
    "nameEn": "Essence of Sorcery",
    "nameZh": "巫術精髓",
    "textEn": "(55—64)% increased Spell Damage",
    "textZh": "增加(55—64)%法術傷害",
    "generation": "prefix",
    "level": 26
  },
  {
    "nameEn": "Greater Essence of Alacrity",
    "nameZh": "高階輕快精髓",
    "textEn": "(25—28)% increased Cast Speed",
    "textZh": "增加(25—28)%施法速度",
    "generation": "suffix",
    "level": 48
  },
  {
    "nameEn": "Greater Essence of Seeking",
    "nameZh": "高階探尋精髓",
    "textEn": "(47—53)% increased Critical Hit Chance for Spells",
    "textZh": "增加(47—53)%法術暴擊率",
    "generation": "suffix",
    "level": 32
  },
  {
    "nameEn": "Greater Essence of Sorcery",
    "nameZh": "高階巫術精髓",
    "textEn": "(75—89)% increased Spell Damage",
    "textZh": "增加(75—89)%法術傷害",
    "generation": "prefix",
    "level": 48
  },
  {
    "nameEn": "Lesser Essence of Alacrity",
    "nameZh": "低階輕快精髓",
    "textEn": "(13—16)% increased Cast Speed",
    "textZh": "增加(13—16)%施法速度",
    "generation": "suffix",
    "level": 12
  },
  {
    "nameEn": "Lesser Essence of Seeking",
    "nameZh": "低階探尋精髓",
    "textEn": "(34—39)% increased Critical Hit Chance for Spells",
    "textZh": "增加(34—39)%法術暴擊率",
    "generation": "suffix",
    "level": 16
  },
  {
    "nameEn": "Lesser Essence of Sorcery",
    "nameZh": "低階巫術精髓",
    "textEn": "(35—44)% increased Spell Damage",
    "textZh": "增加(35—44)%法術傷害",
    "generation": "prefix",
    "level": 6
  },
  {
    "nameEn": "Perfect Essence of Alacrity",
    "nameZh": "完美輕快精髓",
    "textEn": "(18—20)% increased Mana Cost Efficiency",
    "textZh": "增加(18—20)%魔力消耗效率",
    "generation": "suffix",
    "level": 57
  }
] as const;

function statShape(text: string) {
  return text.toLowerCase().replace(/\(\d+\s*[-–—]\s*\d+\)|\d+/g, "#").replace(/\s+/g, "");
}

function wandEssences(): AffixFamily[] {
  const ordinary = Object.values(weaponCatalog.byCategory.wand ?? {}).flat();
  return wandRecipes.map(({ nameEn, nameZh, textEn, textZh, generation, level }) => {
    const shape = statShape(textEn);
    const groups = new Set(ordinary.filter((family) => family.generation === generation &&
      family.tiers.some((tier) => statShape(tier.textEn) === shape)).map((family) => family.family));
    const labelEn = nameEn + " · " + textEn;
    const labelZh = nameZh + " · " + textZh;
    return { id: "essence:wand:" + nameEn, family: groups.size === 1 ? [...groups][0] : "essence:" + shape,
      generation, labelEn, labelZh, textEn, textZh, match: labelEn, matchZh: labelZh,
      tags: [], tagsZh: [], kind: "flag", weight: 0, minLevel: level, maxLevel: level, tierCount: 1,
      tiers: [{ nameEn, nameZh, textEn, textZh, level, dropChance: 0 }] };
  });
}

// https://poe2db.tw/tw/Perfect_Essence_of_Sorcery
export function essenceFamiliesFor(slot: CraftSlotId): AffixFamily[] {
  if (slot !== "wand" && slot !== "staff") return [];
  const value = slot === "wand" ? 3 : 5;
  const textZh = `全部法術技能等級+${value}`;
  const textEn = `+${value} to Level of all Spell Skills`;
  const labelZh = `完美巫術精髓 · ${textZh}`;
  const labelEn = `Perfect Essence of Sorcery · ${textEn}`;
  return [...(slot === "wand" ? wandEssences() : []), { id: `essence:sorcery:${slot}`, family: "IncreaseSocketedGemLevel", generation: "suffix",
    tags: ["caster"], tagsZh: ["法術"], labelZh, labelEn, textZh, textEn,
    match: labelEn, matchZh: labelZh, kind: "flag", minLevel: 57, maxLevel: 57, weight: 0, tierCount: 1,
    tiers: [{ nameZh: "完美巫術精髓", nameEn: "Perfect Essence of Sorcery", level: 57, textZh, textEn, dropChance: 0 }]
  }];
}
