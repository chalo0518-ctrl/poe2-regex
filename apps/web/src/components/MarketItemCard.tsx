import { type MemorialMod, type MemorialGear, type UiLocale } from "@poe2-regex/data";

export function marketItemTitle(gear: MemorialGear, locale: UiLocale): string {
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  return localizedName(gear, locale) || base;
}

export default function MarketItemCard({ gear, locale }: { gear: MemorialGear; locale: UiLocale }) {
  const name = marketItemTitle(gear, locale);
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  const quality = locale === "en" ? gear.qualityEn : gear.qualityZh || gear.qualityEn;
  const flavour = locale === "en" ? gear.flavourEn : gear.flavourZh || gear.flavourEn;
  const mirrored = locale === "en" ? gear.mirroredEn : gear.mirroredZh || gear.mirroredEn;
  const mods = gear.mods ?? [];
  const baseMods = mods.length ? mods.filter((mod) => mod.kind === "implicit") : gear.implicits.map((row) => ({ ...row, kind: "implicit" }));
  const isGranted = (row: (typeof baseMods)[number]) => /^(?:Grants Skill|賦予技能)\s*[:：]/iu.test(line(row, locale).trim());

  const affixes: MemorialMod[] = mods.length
    ? mods.filter((mod) => !["implicit", "socket", "corrupted"].includes(mod.kind))
    : gear.affixes.map((row) => ({ ...row, kind: "explicit" }));
  const grouped = affixes.some((mod) => mod.generation);

  return (
    <article className={`market-item market-item--${gear.rarity || "rare"}`}>
      <div className="market-item-copy">
        <div className="market-item-name">
          <h2>{name}</h2>
          {base && base !== name ? <p>{base}</p> : null}
        </div>
        {(quality || gear.stats?.length) ? <section className="market-item-group market-item-stats">
          {quality ? <p>{quality.includes("品質") || quality.includes("Quality") ? quality : `${locale === "en" ? "Quality" : "品質"}: ${quality}`}</p> : null}
          {(gear.stats ?? []).map((row) => (
            <p key={row.textEn || row.textZh} className="mt-1">
              {line(row, locale)}
            </p>
          ))}
        </section> : null}
        {[
          { label: locale === "en" ? "Base effects" : "底材效果", rows: baseMods.filter((mod) => !isGranted(mod)) },
          { label: "", rows: baseMods.filter(isGranted) },
          { label: locale === "en" ? "Socket effects" : "鑲嵌效果", rows: mods.filter((mod) => mod.kind === "socket") },
          { label: locale === "en" ? "Prefixes" : "前綴", rows: affixes.filter((mod) => mod.generation === "prefix") },
          { label: locale === "en" ? "Suffixes" : "後綴", rows: affixes.filter((mod) => mod.generation === "suffix") },
          { label: grouped ? (locale === "en" ? "Other modifiers" : "其他詞條") : "", rows: affixes.filter((mod) => !mod.generation) },
          { label: "", rows: mods.filter((mod) => mod.kind === "corrupted") },
        ].map(({ label, rows }, index) => rows.length > 0 && (
          <div className="market-item-group" key={index}>
            {label && <p className="market-item-label">{label}</p>}
            <ul>
              {rows.map((mod, rowIndex) => (
                <li key={rowIndex} className="market-item-mod" data-kind={mod.kind} data-granted-skill={mod.kind === "implicit" && isGranted(mod) ? "" : undefined}>
                  {mod.kind === "fractured" && <small>{locale === "en" ? "Fractured" : "鎖定"}</small>}
                  {mod.kind === "crafted" && <small>{locale === "en" ? "Crafted" : "工藝"}</small>}
                  <span>{line(mod, locale)}{"verifiedTier" in mod && typeof mod.verifiedTier === "number" ? (
                    <small className="market-item-tier">T{mod.verifiedTier}</small>
                  ) : gear.rarity === "rare" && ["explicit", "fractured"].includes(mod.kind) ? (
                    <small className="market-item-tier">{locale === "en" ? "Tier unverified" : "階級未確認"}</small>
                  ) : null}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {(gear.notables ?? []).map((notable) => (
          <div key={notable.nameEn || notable.nameZh} className="mt-3">
            <p className="text-sm text-[#d7b56a]">{locale === "en" ? notable.nameEn : notable.nameZh}</p>
            {notable.mods.map((mod) => (
              <p key={`${mod.textZh}-${mod.textEn}`} className="mt-1 text-sm text-paper">
                {line(mod, locale)}
              </p>
            ))}
          </div>
        ))}
        {mirrored ? <p className="mt-3 text-sm text-[#8fb4e8]">{mirrored}</p> : null}
        {flavour ? <p className="market-item-group market-item-flavour">{flavour}</p> : null}
      </div>
    </article>
  );
}

function line(row: { textZh: string; textEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.textEn || row.textZh : row.textZh || row.textEn;
}

function localizedName(gear: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? gear.nameEn || gear.nameZh : gear.nameZh || gear.nameEn;
}
