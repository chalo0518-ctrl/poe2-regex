import type { CraftSlotId } from "@poe2-regex/data";

interface RecommendationBase {
  slot: CraftSlotId;
  pool?: string;
  en: string;
  zh: string;
  runeforge?: number;
}

export const recommendationBases: readonly RecommendationBase[] = [
  { slot: "wand", en: "Withered Wand", zh: "凋零法杖" },
  { slot: "wand", en: "Bone Wand", zh: "骸骨法杖" },
  { slot: "wand", en: "Attuned Wand", zh: "調和法杖" },
  { slot: "wand", en: "Siphoning Wand", zh: "虹吸法杖" },
  { slot: "wand", en: "Volatile Wand", zh: "失衡法杖" },
  { slot: "wand", en: "Galvanic Wand", zh: "電能法杖" },
  { slot: "wand", en: "Acrid Wand", zh: "刺鼻法杖" },
  { slot: "wand", en: "Offering Wand", zh: "奉獻法杖" },
  { slot: "wand", en: "Frigid Wand", zh: "冰冷法杖" },
  { slot: "wand", en: "Torture Wand", zh: "暴虐法杖" },
  { slot: "wand", en: "Critical Wand", zh: "致命法杖" },
  { slot: "wand", en: "Primordial Wand", zh: "原始法杖" },
  { slot: "wand", en: "Dueling Wand", zh: "單挑法杖" },
  { slot: "wand", en: "Twisted Wand", zh: "扭曲法杖" },
  { slot: "sceptre", en: "Shrine Sceptre", zh: "神殿權杖" },
  { slot: "sceptre", en: "Stoic Sceptre", zh: "魔道權杖" },
  { slot: "helmet", pool: "int", en: "Ancestral Tiara", zh: "先祖頭冠", runeforge: 495 },
  { slot: "boots", pool: "int", en: "Sekhema Sandals", zh: "絲克瑪便鞋", runeforge: 430 },
  { slot: "belt", en: "Invoking Belt", zh: "祈喚腰帶" },
  { slot: "amulet", en: "Portent Amulet", zh: "惡兆護身符" },
  { slot: "ring", en: "Mnemonic Ring", zh: "憶念之戒" },
];

export function runeforgedName(base: { en: string; zh: string }, locale: string): string {
  return locale === "en" ? `Runeforged ${base.en}` : `符鍛${base.zh}`;
}
