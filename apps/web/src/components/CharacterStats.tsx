import type { ReactNode } from "react";
import { RUO_CETACEA_STATS } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

const ZH: Record<string, string> = {
  CHARACTER: "角色",
  DEFENSIVE: "防禦",
  RECOVERY: "回復",
  "MAIN SKILLS": "主要技能",
  Attributes: "能力值",
  Charges: "能量球",
  "Runic Ward": "符文保護",
  "Damage Reduction": "傷害減免",
  "Evade chance": "閃避機率",
  "Deflection rating": "偏斜值",
  "Companion redirect": "同伴分攤傷害",
  "Effective Health Pool": "有效生命池",
  "Max Hit": "最大承受傷害",
  "Mana regen": "魔力回復",
  "Grim Pillars": "恐怖之柱",
  Entangle: "纏繞",
  "Azmerian Wolf": "阿茲莫里巨狼",
  AVG: "平均",
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
  const { locale } = useLocale();
  return (
    <span>
      {parts.map((part, index) => (
        <span key={`${part.text}-${index}`} style={{ color: part.color }}>
          {index > 0 ? " / " : ""}
          {numberText(part.text, locale)}
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
  const pob = snapshot.pobStats;
  const display = new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-TW", { maximumFractionDigits: 2 });
  const saved = (key: string, fallback: string | number) => pob?.[key] == null ? String(fallback) : display.format(pob[key]);
  const [str, dex, intel] = stats.character.attributes.display.split(" / ");
  const charges = stats.character.charges.display.split(" / ");
  const reduction = stats.defensive.damage_reduction.display.split(" / ");
  const resists = stats.defensive.resistances.display.split(" / ");
  const hits = stats.defensive.max_hit.display.split(" / ");

  return (
    <section className="stats-col" aria-label={locale === "en" ? "Character stats" : "角色屬性"}>
      <h2 className="stats-title">{locale === "en" ? "Character stats" : "角色屬性"}</h2>
      {pob && <p className="text-xs text-muted">{locale === "en" ? "PoB2 saved calculation · 0.5" : "PoB2 儲存的計算結果 · 0.5"}</p>}
      <h3 className="stats-section">{label("CHARACTER", locale)}</h3>
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
      <Row label={label("Charges", locale)}>
        <Parts
          parts={charges.map((text, index) => ({
            text,
            color: ["#e05050", "#5dca6a", "#6aa7ff"][index] ?? "#efe4ce",
          }))}
        />
      </Row>

      <h3 className="stats-section">{label("DEFENSIVE", locale)}</h3>
      <Row label={label("Life", locale)} value={saved("Life", stats.defensive.life)} />
      <Row label={label("Energy Shield", locale)} value={stats.defensive.energy_shield} />
      <Row label={label("Runic Ward", locale)} value={String(stats.defensive.runic_ward)} />
      <Row label={label("Mana", locale)} value={saved("Mana", stats.defensive.mana)} />
      <Row label={label("Spirit", locale)} value={saved("Spirit", stats.defensive.spirit)} />
      <Row label={label("Armour", locale)} value={saved("Armour", stats.defensive.armour)} />
      <Row label={label("Damage Reduction", locale)}>
        <Parts
          parts={reduction.map((text, index) => ({
            text,
            color: index === 0 ? "#9a8b72" : index === 1 ? "#d46a5c" : "#e6c14a",
          }))}
        />
      </Row>
      <Row label={label("Evasion rating", locale)} value={saved("Evasion", stats.defensive.evasion_rating)} />
      <Row label={label("Evade chance", locale)} value={stats.defensive.evade_chance} />
      <Row label={label("Deflection rating", locale)} value={String(stats.defensive.deflection_rating)} />
      <Row label={label("Companion redirect", locale)} value={stats.defensive.companion_redirect} />
      <Row label={label("Resistances", locale)}>
        <Parts
          parts={resists.map((text, index) => ({
            text,
            color: ["#e6c14a", "#e6c14a", "#e07070", "#e070c0"][index] ?? "#efe4ce",
          }))}
        />
      </Row>
      <Row label={label("Effective Health Pool", locale)} value={stats.defensive.effective_health_pool} />
      <Row label={label("Max Hit", locale)}>
        <Parts
          parts={hits.map((text, index) => ({
            text,
            color: ["#d5d0c4", "#e09040", "#6aa7ff", "#e6c14a", "#e070c0"][index] ?? "#efe4ce",
          }))}
        />
      </Row>

      <h3 className="stats-section">{label("RECOVERY", locale)}</h3>
      <Row label={label("Mana regen", locale)} value={stats.recovery.mana_regen} />

      <h3 className="stats-section">{label("MAIN SKILLS", locale)}</h3>
      <ul className="stats-skills">
        {stats.main_skills.map((skill) => (
          <li key={skill.name_en}>
            <div className="stats-skill-head">
              <span>{locale === "en" ? skill.name_en : skill.name_zh || label(skill.name_en, locale)}</span>
              <span className="stats-skill-value">
                {skill.badge ? <span className="stats-badge">{label(skill.badge, locale)}</span> : null}
                {numberText(skill.value, locale)}
              </span>
            </div>
            <p>{skillDetail(skill.detail_line_1, locale)}</p>
            {skill.detail_line_2 ? <p>{skillDetail(skill.detail_line_2, locale)}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  const { locale } = useLocale();
  return (
    <div className="stats-row">
      <span>{label}</span>
      <span>{children ?? numberText(value ?? "", locale)}</span>
    </div>
  );
}

function numberText(text: string, locale: "zh-Hant" | "en") {
  if (locale === "en") return text;
  return text.replace(/(\d+(?:\.\d+)?)([kMB])\b/g, (_, value: string, unit: string) => {
    const multiplier = unit === "k" ? 1_000 : unit === "M" ? 1_000_000 : 1_000_000_000;
    return new Intl.NumberFormat("zh-TW").format(Number(value) * multiplier);
  });
}

function skillDetail(text: string, locale: "zh-Hant" | "en") {
  if (locale === "en") return text;
  return text.replace(/\/s/g, "／秒").replace(/([\d.]+)m radius/g, "半徑 $1 公尺")
    .replace(/([\d.]+)s duration/g, "持續 $1 秒").replace(/([\d.]+%) \/ ([\d.]+%) crit/g, "暴擊率 $1／暴擊加成 $2")
    .replace(/([\d.]+%) hit/g, "命中率 $1");
}
