import { Link, Navigate, useParams } from "react-router-dom";
import {
  memorialGear,
  paperDollSlots,
  showcaseImageUrl,
  type MemorialGear,
  type MemorialMod,
  type PaperDollSlot,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "./showcaseState.tsx";

const KIND_LABEL: Record<string, { zh: string; en: string }> = {
  implicit: { zh: "固有", en: "Implicit" },
  enchanted: { zh: "附魔", en: "Enchanted" },
  fractured: { zh: "破裂", en: "Fractured" },
  explicit: { zh: "顯式", en: "Explicit" },
  crafted: { zh: "工藝", en: "Crafted" },
  "poe2-mutated": { zh: "變異", en: "Mutated" },
};

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
  const name = gear ? localizedName(gear, locale) : "";

  return (
    <div className="max-w-xl">
      <Link to="/showcase/memorial" className="text-sm text-gold hover:underline">
        {t.showcaseBackMemorial}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{slotLabel}</p>
      <h2 className={`mt-1 text-xl font-bold ${gear?.rarity === "unique" ? "text-[#d4834a]" : "text-gold"}`}>
        {name || slotLabel}
      </h2>
      {gear ? <GearCopy gear={gear} locale={locale} /> : <p className="mt-4 text-sm text-muted">{t.showcaseMemorialEmpty}</p>}
    </div>
  );
}

function GearCopy({ gear, locale }: { gear: MemorialGear; locale: UiLocale }) {
  const { t } = useLocale();
  const src = showcaseImageUrl(gear.imageUrl);
  const name = localizedName(gear, locale);
  const base = locale === "en" ? gear.baseEn || gear.baseZh : gear.baseZh || gear.baseEn;
  const quality = locale === "en" ? gear.qualityEn : gear.qualityZh || gear.qualityEn;
  const requirements = locale === "en" ? gear.requirementsEn : gear.requirementsZh || gear.requirementsEn;
  const flavour = locale === "en" ? gear.flavourEn : gear.flavourZh || gear.flavourEn;
  const mirrored = locale === "en" ? gear.mirroredEn : gear.mirroredZh || gear.mirroredEn;
  const mods = gear.mods ?? [];

  return (
    <div className={`mt-4 rounded-sm border bg-panel p-4 ${gear.rarity === "unique" ? "border-[#af6025]" : "border-[#c9b45a]"}`}>
      {src ? (
        <span className="doll-well mb-3">
          <img src={src} alt={name} />
        </span>
      ) : null}
      {base ? <p className="text-sm text-gold">{base}</p> : null}
      {quality ? <p className="mt-2 text-sm text-paper">{quality.includes("品質") || quality.includes("Quality") ? quality : `${locale === "en" ? "Quality" : "品質"}: ${quality}`}</p> : null}
      {(gear.stats ?? []).map((row) => (
        <p key={row.textEn || row.textZh} className="mt-1 text-sm text-paper">
          {line(row, locale)}
        </p>
      ))}
      {gear.itemLevel != null ? (
        <p className="mt-1 text-sm text-muted">{locale === "en" ? `Item Level: ${gear.itemLevel}` : `物品等級: ${gear.itemLevel}`}</p>
      ) : null}
      {requirements ? <p className="mt-1 text-sm text-muted">{requirements}</p> : null}
      {mods.length > 0 ? (
        <ul className="mt-3">
          {mods.map((mod) => (
            <li key={`${mod.kind}-${mod.textZh}-${mod.textEn}`} className="mt-2 text-sm">
              <ModLine mod={mod} locale={locale} />
            </li>
          ))}
        </ul>
      ) : (
        <>
          {gear.implicits.map((row) => (
            <p key={row.textZh} className="mt-2 text-sm text-paper">
              {line(row, locale)}
            </p>
          ))}
          <ul className="mt-3">
            {gear.affixes.map((row) => (
              <li key={`${row.generation}-${row.textZh}`} className="mt-2 text-sm text-paper">
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
      {flavour ? <p className="mt-3 whitespace-pre-line text-sm text-[#af6025]">{flavour}</p> : null}
      {(gear.sockets ?? []).length > 0 ? (
        <div className="mt-4">
          <h3 className="text-xs tracking-[0.14em] text-gold-dim">{t.showcaseSockets}</h3>
          <ul className="mt-2">
            {(gear.sockets ?? []).map((socket) => (
              <li key={`${socket.nameEn}-${socket.nameZh}`} className="mt-2 text-sm">
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
  );
}

function ModLine({ mod, locale }: { mod: MemorialMod; locale: UiLocale }) {
  const label = KIND_LABEL[mod.kind];
  const text = line(mod, locale);
  if (!label || mod.kind === "corrupted") return <span className="text-paper">{text}</span>;
  return (
    <>
      <span className="mr-2 text-xs text-gold-dim">{locale === "en" ? label.en : label.zh}</span>
      <span className="text-paper">{text}</span>
    </>
  );
}

function line(row: { textZh: string; textEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.textEn || row.textZh : row.textZh || row.textEn;
}

function localizedName(gear: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? gear.nameEn || gear.nameZh : gear.nameZh || gear.nameEn;
}
