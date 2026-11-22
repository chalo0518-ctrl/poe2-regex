import type { ReactNode } from "react";
import { RUO_CETACEA_STATS } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

/**
 * Row labels in Traditional Chinese only when this repo already has that
 * poe2db string. The rest stay English because the zh-tw ninja panel was not captured.
 */
const ZH: Record<string, string> = {
  "Movement Speed": "移動速度",
  "Item Rarity": "物品稀有度",
  Life: "生命",
  "Energy Shield": "能量護盾",
  Mana: "魔力",
  Spirit: "精魂",
  Armour: "護甲值",
  "Evasion rating": "閃避值",
  Resistances: "抗性",
};

function label(en: string, locale: "zh-Hant" | "en"): string {
  if (locale === "zh-Hant" && ZH[en]) return ZH[en];
  return en;
}

function Parts({ parts }: { parts: { text: string; color: string }[] }) {
  return (
    <span>
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`} style={{ color: part.color }}>
          {index > 0 ? " / " : ""}
          {part.text}
        </span>
      ))}
    </span>
  );
}

export default function CharacterStats() {
  const { locale } = useLocale();
  const { snapshot, weaponSet } = useShowcase();
  if (weaponSet === 2 || snapshot.id !== "ruoa-cetacea") return (
    <section className="stats-col" aria-label={locale === "en" ? "Character stats" : "角色屬性"}>
      <h2 className="stats-title">{locale === "en" ? "Character stats" : "角色屬性"}</h2>
      <p>{locale === "en" ? "No stats recorded for this weapon set." : "此武器組的屬性未記錄。"}</p>
    </section>
  );
  const stats = RUO_CETACEA_STATS;
  const [str, dex, intel] = stats.character.attributes.display.split(" / ");
  const charges = stats.character.charges.display.split(" / ");
  const reduction = stats.defensive.damage_reduction.display.split(" / ");
  const resists = stats.defensive.resistances.display.split(" / ");
  const hits = stats.defensive.max_hit.display.split(" / ");

  return (
    <section className="stats-col" aria-label={locale === "en" ? "Character stats" : "角色屬性"}>
      <h2 className="stats-title">{locale === "en" ? "Character stats" : "角色屬性"}</h2>
      <h3 className="stats-section">CHARACTER</h3>
      <Row label={label("Attributes", locale)}>
        <Parts
          parts={[
            { text: str ?? "", color: "#e05050" },
            { text: dex ?? "", color: "#5dca6a" },
            { text: intel ?? "", color: "#6aa7ff" },
          ]}
        />
      </Row>
      <Row label={label("Movement Speed", locale)} value={stats.character.movement_speed} />
      <Row label={label("Item Rarity", locale)} value={stats.character.item_rarity} />
      <Row label="Charges">
        <Parts
          parts={charges.map((text, index) => ({
            text,
            color: ["#e05050", "#5dca6a", "#6aa7ff"][index] ?? "#efe4ce",
          }))}
        />
      </Row>

      <h3 className="stats-section">DEFENSIVE</h3>
      <Row label={label("Life", locale)} value={stats.defensive.life} />
      <Row label={label("Energy Shield", locale)} value={stats.defensive.energy_shield} />
      <Row label="Runic Ward" value={String(stats.defensive.runic_ward)} />
      <Row label={label("Mana", locale)} value={stats.defensive.mana} />
      <Row label={label("Spirit", locale)} value={String(stats.defensive.spirit)} />
      <Row label={label("Armour", locale)} value={String(stats.defensive.armour)} />
      <Row label="Damage Reduction">
        <Parts
          parts={reduction.map((text, index) => ({
            text,
            color: index === 0 ? "#9a8b72" : index === 1 ? "#d46a5c" : "#e6c14a",
          }))}
        />
      </Row>
      <Row label={label("Evasion rating", locale)} value={String(stats.defensive.evasion_rating)} />
      <Row label="Evade chance" value={stats.defensive.evade_chance} />
      <Row label="Deflection rating" value={String(stats.defensive.deflection_rating)} />
      <Row label="Companion redirect" value={stats.defensive.companion_redirect} />
      <Row label={label("Resistances", locale)}>
        <Parts
          parts={resists.map((text, index) => ({
            text,
            color: ["#e6c14a", "#e6c14a", "#e07070", "#e070c0"][index] ?? "#efe4ce",
          }))}
        />
      </Row>
      <Row label="Effective Health Pool" value={stats.defensive.effective_health_pool} />
      <Row label="Max Hit">
        <Parts
          parts={hits.map((text, index) => ({
            text,
            color: ["#d5d0c4", "#e09040", "#6aa7ff", "#e6c14a", "#e070c0"][index] ?? "#efe4ce",
          }))}
        />
      </Row>

      <h3 className="stats-section">RECOVERY</h3>
      <Row label="Mana regen" value={stats.recovery.mana_regen} />

      <h3 className="stats-section">MAIN SKILLS</h3>
      <ul className="stats-skills">
        {stats.main_skills.map((skill) => (
          <li key={skill.name_en}>
            <div className="stats-skill-head">
              <span>{skill.name_en}</span>
              <span className="stats-skill-value">
                {skill.badge ? <span className="stats-badge">{skill.badge}</span> : null}
                {skill.value}
              </span>
            </div>
            <p>{skill.detail_line_1}</p>
            {skill.detail_line_2 ? <p>{skill.detail_line_2}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="stats-row">
      <span>{label}</span>
      <span>{children ?? value}</span>
    </div>
  );
}
