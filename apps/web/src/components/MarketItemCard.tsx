import { showcaseImageUrl, type MemorialGear, type UiLocale } from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";

export function marketItemTitle(gear: MemorialGear, locale: UiLocale): string {
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  return (gear.rarity === "rare" && base) || localizedName(gear, locale);
}

export default function MarketItemCard({ gear, locale }: { gear: MemorialGear; locale: UiLocale }) {
  const { t } = useLocale();
  const src = showcaseImageUrl(gear.imageUrl);
  const name = marketItemTitle(gear, locale);
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  const quality = locale === "en" ? gear.qualityEn : gear.qualityZh || gear.qualityEn;
  const requirements = locale === "en" ? gear.requirementsEn : gear.requirementsZh || gear.requirementsEn;
  const flavour = locale === "en" ? gear.flavourEn : gear.flavourZh || gear.flavourEn;
  const mirrored = locale === "en" ? gear.mirroredEn : gear.mirroredZh || gear.mirroredEn;
  const mods = gear.mods ?? [];

  return (
    <article className={`market-item market-item--${gear.rarity || "rare"}`}>
      {src ? <div className="market-item-art"><img src={src} alt="" /></div> : null}
      <div className="market-item-copy">
        <div className="market-item-name">
          <h2>{name}</h2>
          {gear.rarity !== "rare" && base && base !== name ? <p>{base}</p> : null}
        </div>
        <section className="market-item-group market-item-stats">
          {quality ? <p>{quality.includes("品質") || quality.includes("Quality") ? quality : `${locale === "en" ? "Quality" : "品質"}: ${quality}`}</p> : null}
          {(gear.stats ?? []).map((row) => (
            <p key={row.textEn || row.textZh} className="mt-1">
              {line(row, locale)}
            </p>
          ))}
          {gear.itemLevel != null ? (
            <p className="mt-1">{locale === "en" ? `Item Level: ${gear.itemLevel}` : `物品等級: ${gear.itemLevel}`}</p>
          ) : null}
          {requirements ? <p className="mt-1 text-sm text-muted">{requirements}</p> : null}
        </section>
        {mods.length > 0 ? (
          <ul className="market-item-group">
            {mods.map((mod) => (
              <li key={`${mod.kind}-${mod.textZh}-${mod.textEn}`} className="market-item-mod" data-kind={mod.kind}>
                {line(mod, locale)}
              </li>
            ))}
          </ul>
        ) : (
          <>
            {gear.implicits.map((row) => (
              <p key={row.textZh} className="market-item-mod" data-kind="implicit">
                {line(row, locale)}
              </p>
            ))}
            <ul className="market-item-group">
              {gear.affixes.map((row) => (
                <li key={`${row.generation}-${row.textZh}`} className="market-item-mod" data-kind="explicit">
                  {line(row, locale)}
                </li>
              ))}
            </ul>
          </>
        )}
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
        {(gear.sockets ?? []).length > 0 ? (
          <div className="market-item-group market-item-sockets">
            <h3 className="text-xs tracking-[0.14em] text-gold-dim">{t.showcaseSockets}</h3>
            <ul className="mt-2">
              {(gear.sockets ?? []).map((socket, index) => (
                <li key={`${socket.nameEn}-${socket.nameZh}-${index}`} className="mt-2 text-sm">
                  <p className="text-gold">{locale === "en" ? socket.nameEn : socket.nameZh}</p>
                  <p className="text-muted">{locale === "en" ? socket.baseEn : socket.baseZh}</p>
                  {socket.mods.map((mod) => (
                    <p key={`${mod.textZh}-${mod.textEn}`} className="text-paper">
                      {line(mod, locale)}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
