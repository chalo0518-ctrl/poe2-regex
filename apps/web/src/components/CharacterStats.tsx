import weaponTwoStats from "../assets/ruoa-weapon-ii-stats.json";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

export default function CharacterStats() {
  const { locale } = useLocale();
  const { snapshot, weaponSet } = useShowcase();
  const values = weaponSet === 2 ? (snapshot.id === "ruoa-cetacea" ? weaponTwoStats : undefined) : snapshot.pobStats;
  if (values) return <PoBSnapshotStats values={values} weaponSet={weaponSet} />;
  const title = locale === "en" ? "Character stats" : "角色屬性";
  return (
    <section className="stats-col" aria-label={title}>
      <h2 className="stats-title">{title}</h2>
      <p>{locale === "en" ? "No stats recorded for this weapon set." : "此武器組的屬性未記錄。"}</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="stats-row"><span>{label}</span><span>{value}</span></div>;
}

function PoBSnapshotStats({ values, weaponSet }: { values: Readonly<Record<string, number>>; weaponSet: 1 | 2 }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const suffix = weaponSet === 1 ? "I" : "II";
  const title = (english ? "Character stats · Weapon set " : "角色屬性 · 武器組 ") + suffix;
  const number = new Intl.NumberFormat(english ? "en-US" : "zh-TW", { maximumFractionDigits: 2 });
  const groups: { en: string; zh: string; rows: [string, string, string, string?][] }[] = [
    { en: "Character", zh: "角色", rows: [
      ["Str", "Strength", "力量"], ["Dex", "Dexterity", "敏捷"], ["Int", "Intelligence", "智慧"],
      ["EffectiveMovementSpeedMod", "Movement speed modifier", "移動速度修正", "%"],
    ] },
    { en: "Defence and resources", zh: "防禦與資源", rows: [
      ["Life", "Life", "生命"], ["EnergyShield", "Energy Shield", "能量護盾"],
      ["Mana", "Mana", "魔力"], ["ManaRegenRecovery", "Mana recovery per second", "每秒魔力回復"],
      ["Spirit", "Spirit", "精魂"], ["Armour", "Armour", "護甲值"], ["Evasion", "Evasion rating", "閃避值"],
      ["EffectiveBlockChance", "Effective block chance", "有效格擋率", "%"],
      ["FireResist", "Fire resistance", "火焰抗性", "%"], ["ColdResist", "Cold resistance", "冰冷抗性", "%"],
      ["LightningResist", "Lightning resistance", "閃電抗性", "%"], ["ChaosResist", "Chaos resistance", "混沌抗性", "%"],
      ["TotalEHP", "Effective Health Pool", "有效生命池"],
      ["PhysicalMaximumHitTaken", "Physical maximum hit", "最大承受物理傷害"],
      ["LightningMaximumHitTaken", "Lightning maximum hit", "最大承受閃電傷害"],
      ["FireMaximumHitTaken", "Fire maximum hit", "最大承受火焰傷害"],
      ["ColdMaximumHitTaken", "Cold maximum hit", "最大承受冰冷傷害"],
      ["ChaosMaximumHitTaken", "Chaos maximum hit", "最大承受混沌傷害"],
    ] },
    { en: "Grim Pillars", zh: "恐怖之柱", rows: [
      ["AverageHit", "Average hit", "平均擊中傷害"], ["Speed", "Cast rate", "施放頻率", english ? "/s" : "／秒"],
      ["CritChance", "Critical strike chance", "暴擊率", "%"],
      ["CritMultiplier", "Critical multiplier", "暴擊傷害倍率", "%"],
      ["HitChance", "Hit chance", "命中率", "%"],
      ["AreaOfEffectRadiusMetres", "Area radius", "範圍半徑", english ? " m" : " 公尺"],
    ] },
  ];
  return (
    <section className="stats-col" aria-label={title}>
      <h2 className="stats-title">{title}</h2>
      <p className="text-xs text-muted">{english ? "Saved PoB2 calculation · 0.5" : "PoB2 儲存的計算結果 · 0.5"}</p>
      {groups.map(({ en, zh, rows }) => (
        <div key={en}>
          <h3 className="stats-section">{english ? en : zh}</h3>
          {rows.map(([key, enLabel, zhLabel, suffix = ""]) => values[key] != null &&
            <Row key={key} label={english ? enLabel : zhLabel} value={number.format(key === "EffectiveMovementSpeedMod" ? (values[key] - 1) * 100 : key === "CritMultiplier" ? values[key] * 100 : values[key]) + suffix} />)}
        </div>
      ))}
    </section>
  );
}
