import { Link, Navigate, useParams } from "react-router-dom";
import {
  memorialGear,
  paperDollGroups,
  paperDollSlots,
  showcaseImageUrl,
  type MemorialGear,
  type PaperDollSlot,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "./showcaseState.tsx";

export default function MemorialDetail() {
  const { slotId } = useParams();
  const slot = paperDollSlots.find((row) => row.id === slotId);
  if (!slot) return <Navigate to="/showcase/memorial" replace />;
  return <DetailBody slot={slot} />;
}

function DetailBody({ slot }: { slot: PaperDollSlot }) {
  const { locale, t } = useLocale();
  const { snapshot } = useShowcase();
  const gear = memorialGear(snapshot, slot.id);
  const slotLabel = locale === "en" ? slot.labelEn : slot.labelZh;
  const group = paperDollGroups.find((row) => row.id === slot.group);
  const groupLabel = group ? (locale === "en" ? group.labelEn : group.labelZh) : "";
  const name = gear ? localizedName(gear, locale) : "";

  return (
    <div className="max-w-xl">
      <Link to="/showcase/memorial" className="text-sm text-gold hover:underline">
        {t.showcaseBackMemorial}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{groupLabel}</p>
      <h2 className="mt-1 text-xl font-bold text-gold">{name || slotLabel}</h2>
      {gear ? <GearCopy gear={gear} locale={locale} /> : <p className="mt-4 text-sm text-muted">{t.showcaseMemorialEmpty}</p>}
    </div>
  );
}

function GearCopy({ gear, locale }: { gear: MemorialGear; locale: UiLocale }) {
  const { t } = useLocale();
  const src = showcaseImageUrl(gear.imageUrl);
  const name = localizedName(gear, locale);
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  return (
    <div className="mt-4 rounded-sm border border-line bg-panel p-4">
      {src ? (
        <span className="doll-well mb-3">
          <img src={src} alt={name} />
        </span>
      ) : null}
      {base ? <p className="text-sm text-gold">{base}</p> : null}
      {gear.implicits.map((row) => (
        <p key={row.textZh} className="mt-2 text-sm text-paper">
          {locale === "en" ? row.textEn || row.textZh : row.textZh}
        </p>
      ))}
      <ul className="mt-3">
        {gear.affixes.map((row) => (
          <li key={`${row.generation}-${row.textZh}`} className="mt-2 text-sm">
            <span className="mr-2 text-xs text-gold-dim">
              {row.generation === "prefix" ? t.showcasePrefix : t.showcaseSuffix}
            </span>
            <span className="text-paper">{locale === "en" ? row.textEn || row.textZh : row.textZh}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function localizedName(gear: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? gear.nameEn || gear.nameZh : gear.nameZh || gear.nameEn;
}
