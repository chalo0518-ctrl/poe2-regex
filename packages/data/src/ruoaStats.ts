import statsJson from "./ruoaStats.json";

/**
 * Numbers are the captured poe.ninja Stats column.
 * zh-tw labels that are not already in this repo's poe2db text stay in English:
 * Charges, Runic Ward, Damage Reduction, Evade chance, Deflection rating,
 * Companion redirect, Effective Health Pool, Max Hit, and the section titles.
 */
type StatsFile = {
  stats: {
    character: {
      attributes: { display: string };
      movement_speed: string;
      item_rarity: string;
      charges: { display: string };
    };
    defensive: {
      life: string;
      energy_shield: string;
      runic_ward: number;
      mana: string;
      spirit: number;
      armour: number;
      damage_reduction: { display: string };
      evasion_rating: number;
      evade_chance: string;
      deflection_rating: number;
      companion_redirect: string;
      resistances: { display: string };
      effective_health_pool: string;
      max_hit: { display: string };
    };
    recovery: { mana_regen: string };
    main_skills: {
      name_en: string;
      name_zh: string | null;
      detail_line_1: string;
      detail_line_2: string | null;
      badge: string | null;
      value: string;
    }[];
  };
};

const file = statsJson as StatsFile;

export const RUO_CETACEA_STATS = file.stats;

export function ruoaStatLine(id: "mana" | "intelligence" | "ehp" | "resists" | "maxHit" | "move"): string {
  if (id === "mana") return file.stats.defensive.mana;
  if (id === "intelligence") return file.stats.character.attributes.display;
  if (id === "ehp") return file.stats.defensive.effective_health_pool;
  if (id === "resists") return file.stats.defensive.resistances.display;
  if (id === "maxHit") return file.stats.defensive.max_hit.display;
  return file.stats.character.movement_speed;
}
