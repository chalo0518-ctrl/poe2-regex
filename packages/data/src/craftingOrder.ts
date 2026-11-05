import type { AffixFamily } from "./types.ts";

/**
 * Display order for the crafting affix library.
 * Groups related mods, then absolute / flat / added values before percentages.
 * Early-gear lists do not use this; they keep the scrape order.
 */
const GROUP = {
  physical: 0,
  elemental: 1,
  chaos: 2,
  damage: 3,
  defence: 4,
  resistance: 5,
  life: 6,
  mana: 7,
  spirit: 8,
  attribute: 9,
  critical: 10,
  speed: 11,
  ailment: 12,
  minion: 13,
  attack: 14,
  curse: 15,
  block: 16,
  flask: 17,
  stun: 18,
  other: 19,
} as const;

function textOf(family: AffixFamily): string {
  return `${family.textZh}\n${family.textEn}`;
}

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

/** 0 absolute or added, 1 mixed, 2 relative / increased. */
function magnitude(family: AffixFamily): number {
  const text = textOf(family);
  const relative = has(text, /增加|減少/) || has(text, /%\s*(increased|reduced)/i);
  const flat = family.numeric?.format === "plusFlat"
    || family.numeric?.format === "bare"
    || has(text, /(?:^|[^\d.%])\+(?:\(|\d)/);
  if (relative && flat) return 1;
  if (relative || family.numeric?.format === "percentPrefix") return 2;
  if (family.numeric?.format === "plusPercent" && has(text, /套用|穿透|applies|penetrat/i)) return 2;
  return 0;
}

function resistSub(text: string): number {
  const fire = has(text, /火焰|Fire/i);
  const cold = has(text, /冰冷|Cold/i);
  const lightning = has(text, /閃電|Lightning/i);
  const chaos = has(text, /混沌|Chaos/i);
  const all = has(text, /全元素|all Elemental/i);
  const elements = [fire, cold, lightning].filter(Boolean).length;
  if (all || elements === 3) return 3;
  if (fire && !cold && !lightning && !chaos) return 0;
  if (cold && !fire && !lightning && !chaos) return 1;
  if (lightning && !fire && !cold && !chaos) return 2;
  if (chaos && elements === 0) return 4;
  if (fire && chaos) return 5;
  if (cold && chaos) return 6;
  if (lightning && chaos) return 7;
  return 8;
}

function defenceKinds(text: string): { armour: boolean; evasion: boolean; es: boolean } | null {
  const armourBreak = has(text, /護甲破壞|破甲|Armou?r Break|Breaks Armou?r|Fully Break/i);
  const armour = (has(text, /護甲/) || has(text, /\bArmou?r\b/i)) && !armourBreak;
  const dodge = has(text, /閃避翻滾|Dodge Roll/i);
  const evasion = (has(text, /閃避/) || has(text, /Evasion/i)) && !dodge;
  const es = has(text, /能量護盾/) || has(text, /Energy Shield/i);
  if (!armour && !evasion && !es) return null;
  return { armour, evasion, es };
}

function defenceSub(kinds: { armour: boolean; evasion: boolean; es: boolean }): number {
  const { armour, evasion, es } = kinds;
  if (armour && !evasion && !es) return 0;
  if (evasion && !armour && !es) return 1;
  if (es && !armour && !evasion) return 2;
  if (armour && evasion && !es) return 3;
  if (armour && es && !evasion) return 4;
  if (evasion && es && !armour) return 5;
  return 6;
}

function damagePlacement(text: string): { group: number; sub: number } | null {
  const damage = has(text, /傷害|荊棘|Damage|Thorns/i);
  const explicit = has(text, /變動|Explicit/i);
  if (!damage && !explicit) return null;
  const fire = has(text, /火焰|Fire/i);
  const cold = has(text, /冰冷|Cold/i);
  const lightning = has(text, /閃電|Lightning/i);
  const chaos = has(text, /混沌|Chaos/i);
  const physical = has(text, /物理|Physical/i);
  const elemental = has(text, /元素|Elemental/i);
  const elements = [fire, cold, lightning].filter(Boolean).length;
  const typed = elements > 0 || physical || chaos || elemental;
  if (!typed) return damage ? { group: GROUP.damage, sub: 0 } : null;
  if (elements > 1) return { group: GROUP.elemental, sub: 3 };
  if (elements === 1 && !physical && !chaos) {
    return { group: GROUP.elemental, sub: fire ? 0 : cold ? 1 : 2 };
  }
  if (physical && elements === 0 && !chaos) return { group: GROUP.physical, sub: 0 };
  if (chaos && elements === 0 && !physical) return { group: GROUP.chaos, sub: 0 };
  if (elements === 1) return { group: GROUP.elemental, sub: fire ? 0 : cold ? 1 : 2 };
  if (elemental) return { group: GROUP.elemental, sub: 3 };
  if (physical) return { group: GROUP.physical, sub: 0 };
  if (chaos) return { group: GROUP.chaos, sub: 0 };
  return { group: GROUP.damage, sub: 0 };
}

function classify(family: AffixFamily): { group: number; sub: number } {
  const text = textOf(family);
  const resist = has(text, /抗性|Resistance/i) && !has(text, /穿透|Penetrat/i);
  if (resist) return { group: GROUP.resistance, sub: resistSub(text) };

  const defence = defenceKinds(text);
  if (defence && !has(text, /穿透|Penetrat/i)) return { group: GROUP.defence, sub: defenceSub(defence) };

  const recovery = has(text, /偷取|回復|Regenerat|Leech|per enemy killed|每秒/i);
  const life = has(text, /生命|Life/i);
  const mana = has(text, /魔力|Mana/i);
  const spirit = has(text, /精魂|Spirit/i);
  if (recovery || ((life || mana || spirit) && !has(text, /傷害|Damage|Thorns|荊棘/i))) {
    if (life && mana) return { group: GROUP.life, sub: 1 };
    if (life) return { group: GROUP.life, sub: 0 };
    if (mana) return { group: GROUP.mana, sub: 0 };
    if (spirit) return { group: GROUP.spirit, sub: 0 };
  }

  const attribute = has(text, /能力值|力量|敏捷|智慧|Strength|Dexterity|Intelligence|Attributes/i);
  if (attribute && !has(text, /傷害|Damage/i)) {
    const str = has(text, /力量|Strength/i);
    const dex = has(text, /敏捷|Dexterity/i);
    const int = has(text, /智慧|Intelligence/i);
    const all = has(text, /全部能力值|all Attributes/i);
    const n = [str, dex, int].filter(Boolean).length;
    const sub = all ? 0 : n > 1 ? 4 : str ? 1 : dex ? 2 : int ? 3 : 5;
    return { group: GROUP.attribute, sub };
  }

  if (has(text, /暴擊|Critical/i)) return { group: GROUP.critical, sub: 0 };

  const damage = damagePlacement(text);
  if (damage) return damage;

  if (has(text, /速度|Speed/i)) {
    const sub = has(text, /攻擊速度|Attack Speed/i)
      ? 0
      : has(text, /施法速度|Cast Speed/i)
        ? 1
        : has(text, /移動速度|Movement Speed/i)
          ? 2
          : 3;
    return { group: GROUP.speed, sub };
  }
  if (has(text, /流血|中毒|點燃|冰凍|感電|異常狀態|Bleed|Poison|Ignite|Freeze|Shock|Ailment/i)) {
    return { group: GROUP.ailment, sub: 0 };
  }
  if (has(text, /召喚物|圖騰|Minion|Totem/i)) return { group: GROUP.minion, sub: 0 };
  if (has(text, /命中|Accuracy|攻擊|Attack/i)) return { group: GROUP.attack, sub: 0 };
  if (has(text, /詛咒|Curse/i)) return { group: GROUP.curse, sub: 0 };
  if (has(text, /格擋|Block/i)) return { group: GROUP.block, sub: 0 };
  if (has(text, /藥劑|護符|Flask|Charm/i)) return { group: GROUP.flask, sub: 0 };
  if (has(text, /暈眩|Stun/i)) return { group: GROUP.stun, sub: 0 };
  return { group: GROUP.other, sub: 0 };
}

export function compareCraftingLibrary(a: AffixFamily, b: AffixFamily): number {
  const left = classify(a);
  const right = classify(b);
  if (left.group !== right.group) return left.group - right.group;
  if (left.group === GROUP.other && a.family !== b.family) return a.family.localeCompare(b.family);
  if (left.sub !== right.sub) return left.sub - right.sub;
  const byMagnitude = magnitude(a) - magnitude(b);
  if (byMagnitude !== 0) return byMagnitude;
  const byText = a.textZh.localeCompare(b.textZh, "zh-Hant");
  if (byText !== 0) return byText;
  return a.id.localeCompare(b.id);
}

/** Stable crafting-library order. Does not mutate the input. */
export function orderCraftingLibrary<T extends { family: AffixFamily }>(rows: readonly T[]): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => compareCraftingLibrary(a.row.family, b.row.family) || a.index - b.index)
    .map((entry) => entry.row);
}
