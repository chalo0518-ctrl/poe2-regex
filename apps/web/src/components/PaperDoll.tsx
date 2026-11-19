import { useState } from "react";
import { Link } from "react-router-dom";
import {
  catalogForDollSlot,
  memorialGear,
  paperDollSlots,
  recommendedGear,
  showcaseImageUrl,
  showcaseLines,
  type PaperDollSlot,
  type PaperDollSlotId,
  type ShowcaseLine,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "../pages/showcaseState.tsx";

type DollMode = "memorial" | "recommended";
type WeaponSet = 1 | 2;

const GRID_AREAS = ["weapon", "offhand", "helm", "ring3", "ring", "ring2", "amulet", "body", "gloves", "boots", "belt", "trinket", "life", "mana"] as const;

function labelOf(row: { labelZh: string; labelEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.labelEn : row.labelZh;
}

function nameOf(row: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.nameEn || row.nameZh : row.nameZh || row.nameEn;
}

export default function PaperDoll({ mode }: { mode: DollMode }) {
  const { locale, t } = useLocale();
  const [set, setWeaponSet] = useState<WeaponSet>(1);
  const jewels = paperDollSlots.filter((slot) => slot.group === "jewel");
  const charms = paperDollSlots.filter((slot) => slot.group === "charm");
  const gridSlots = paperDollSlots.filter((slot) => GRID_AREAS.includes(slot.area as (typeof GRID_AREAS)[number]));
  const visible = gridSlots.filter((slot) => slot.set === 0 || slot.set === set);

  return (
    <div className="ninja-panel">
      <p className="ninja-panel-title">{locale === "en" ? "Equipment" : "裝備"}</p>
      <div className="ninja-sheet" data-testid="ninja-sheet">
        <WeaponTabs set={set} onSet={setWeaponSet} area="wtab" label={locale === "en" ? "Weapon set" : "武器組"} />
        <WeaponTabs set={set} onSet={setWeaponSet} area="otab" label={locale === "en" ? "Off-hand set" : "副手武器組"} />
        {visible.filter((slot) => slot.group !== "charm").map((slot) => (
          <DollCell key={slot.id} slot={slot} mode={mode} locale={locale} />
        ))}
        <div className="ninja-charms">
          {charms.map((slot) => (
            <DollCell key={slot.id} slot={slot} mode={mode} locale={locale} />
          ))}
        </div>
      </div>
      <section className="ninja-jewel-row" aria-label={t.showcaseJewels}>
        <h2 className="ninja-jewel-heading">{t.showcaseJewels}</h2>
        <div className="ninja-jewels">
          {jewels.map((slot) => (
            <div key={slot.id} className="ninja-jewel">
              <DollCell slot={slot} mode={mode} locale={locale} />
              <JewelCaption slotId={slot.id} mode={mode} fallback={labelOf(slot, locale)} locale={locale} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WeaponTabs({
  set,
  onSet,
  area,
  label,
}: {
  set: WeaponSet;
  onSet: (next: WeaponSet) => void;
  area: "wtab" | "otab";
  label: string;
}) {
  return (
    <div className="ninja-tabs" style={{ gridArea: area }} role="group" aria-label={label}>
      {([1, 2] as const).map((value) => (
        <button key={value} type="button" aria-pressed={set === value} onClick={() => onSet(value)}>
          {value === 1 ? "I" : "II"}
        </button>
      ))}
    </div>
  );
}

function DollCell({ slot, mode, locale }: { slot: PaperDollSlot; mode: DollMode; locale: UiLocale }) {
  const { t } = useLocale();
  const { snapshot, picks } = useShowcase();
  const to = mode === "memorial" ? `/showcase/memorial/${slot.id}` : `/showcase/recommended/${slot.id}`;
  const slotLabel = labelOf(slot, locale);

  if (mode === "memorial") {
    const gear = memorialGear(snapshot, slot.id);
    const name = gear ? nameOf(gear, locale) : "";
    const src = gear ? showcaseImageUrl(gear.imageUrl) : null;
    return (
      <Link
        to={to}
        data-area={slot.area}
        data-rarity={gear?.rarity || "empty"}
        className="ninja-cell"
        aria-label={[slotLabel, name || t.showcaseMemorialEmpty].join(" ")}
      >
        {src ? <img src={src} alt={name || slotLabel} /> : null}
        <span className={src ? "sr-only" : "sr-only"}>{name || t.showcaseMemorialEmpty}</span>
      </Link>
    );
  }

  const gear = recommendedGear(snapshot, slot.id);
  const name = nameOf(gear, locale);
  const catalog = catalogForDollSlot(slot.id, gear);
  const lines = showcaseLines(picks[slot.id], catalog);
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  const src = showcaseImageUrl(gear.imageUrl);
  return (
    <Link
      to={to}
      data-area={slot.area}
      data-rarity={name ? "rare" : "empty"}
      className="ninja-cell"
      aria-label={[slotLabel, name || t.showcaseNamePending].join(" ")}
    >
      {src ? <img src={src} alt={name || slotLabel} /> : null}
      <span className="sr-only">{name || t.showcaseNamePending}</span>
      {base ? <span className="sr-only">{base}</span> : null}
      {gear.implicits.map((row) => (
        <span key={row.textZh} className="sr-only">
          {locale === "en" ? row.textEn || row.textZh : row.textZh || row.textEn}
        </span>
      ))}
      {!base && gear.implicits.length === 0 ? <span className="sr-only">{t.showcaseImplicitPending}</span> : null}
      <AffixHoles lines={lines.prefixes} emptyLabel={t.showcaseEmptyPrefix} locale={locale} />
      <AffixHoles lines={lines.suffixes} emptyLabel={t.showcaseEmptySuffix} locale={locale} />
    </Link>
  );
}

function AffixHoles({ lines, emptyLabel, locale }: { lines: ShowcaseLine[]; emptyLabel: string; locale: UiLocale }) {
  return lines.map((line, index) => (
    <span key={`${line.kind}-${line.kind === "affix" ? line.familyId : index}`} className="sr-only">
      {line.kind === "empty" ? emptyLabel : locale === "en" ? line.labelEn : line.labelZh}
    </span>
  ));
}

function JewelCaption({
  slotId,
  mode,
  fallback,
  locale,
}: {
  slotId: PaperDollSlotId;
  mode: DollMode;
  fallback: string;
  locale: UiLocale;
}) {
  const { snapshot } = useShowcase();
  if (mode !== "memorial") return <span className="ninja-jewel-name">{fallback}</span>;
  const gear = memorialGear(snapshot, slotId);
  const name = gear ? nameOf(gear, locale) : fallback;
  return <span className="ninja-jewel-name">{name}</span>;
}
