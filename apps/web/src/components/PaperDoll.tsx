import { Link } from "react-router-dom";
import {
  catalogForDollSlot,
  memorialGear,
  paperDollGroups,
  paperDollSlots,
  recommendedGear,
  showcaseImageUrl,
  showcaseLines,
  type PaperDollGroupId,
  type PaperDollSlot,
  type ShowcaseLine,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "../pages/showcaseState.tsx";

type DollMode = "memorial" | "recommended";

function labelOf(row: { labelZh: string; labelEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.labelEn : row.labelZh;
}

function textOf(row: { textZh: string; textEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.textEn || row.textZh : row.textZh || row.textEn;
}

function nameOf(row: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.nameEn || row.nameZh : row.nameZh || row.nameEn;
}

export default function PaperDoll({ mode }: { mode: DollMode }) {
  const { locale } = useLocale();
  return (
    <div className="doll-sheet">
      {paperDollGroups
        .filter((group) => group.id === "weapon-1" || group.id === "weapon-2" || group.id === "armour" || group.id === "jewellery")
        .map((group) => (
          <DollGroup key={group.id} groupId={group.id} title={labelOf(group, locale)} mode={mode} />
        ))}
      <div className="doll-trinkets">
        {paperDollGroups
          .filter((group) => group.id === "flask" || group.id === "charm")
          .map((group) => (
            <DollGroup key={group.id} groupId={group.id} title={labelOf(group, locale)} mode={mode} />
          ))}
      </div>
    </div>
  );
}

function DollGroup({
  groupId,
  title,
  mode,
}: {
  groupId: PaperDollGroupId;
  title: string;
  mode: DollMode;
}) {
  const slots = paperDollSlots.filter((slot) => slot.group === groupId);
  return (
    <div className={`doll-group doll-group-${groupId}`}>
      <h2 className="doll-group-title">{title}</h2>
      <div className="doll-group-slots">
        {slots.map((slot) => (
          <DollSlot key={slot.id} slot={slot} groupTitle={title} mode={mode} />
        ))}
      </div>
    </div>
  );
}

function DollSlot({
  slot,
  groupTitle,
  mode,
}: {
  slot: PaperDollSlot;
  groupTitle: string;
  mode: DollMode;
}) {
  const { locale, t } = useLocale();
  const { snapshot, picks } = useShowcase();
  const slotLabel = labelOf(slot, locale);
  const to = mode === "memorial" ? `/showcase/memorial/${slot.id}` : `/showcase/recommended/${slot.id}`;

  if (mode === "memorial") {
    const gear = memorialGear(snapshot, slot.id);
    const name = gear ? nameOf(gear, locale) : "";
    const pending = !gear;
    return (
      <Link to={to} className="doll-slot" aria-label={[groupTitle, slotLabel, name || t.showcaseMemorialEmpty].join(" ")}>
        <SlotFrame label={slotLabel} name={name} pending={pending ? t.showcaseMemorialEmpty : ""} imageUrl={gear?.imageUrl ?? ""} />
        {gear?.baseZh ? <p className="doll-base">{textOf({ textZh: gear.baseZh, textEn: gear.baseEn }, locale)}</p> : null}
        {gear?.implicits.map((row) => (
          <p key={row.textZh} className="doll-implicit">
            {textOf(row, locale)}
          </p>
        ))}
        {gear?.affixes.map((row) => (
          <p key={`${row.generation}-${row.textZh}`} className="doll-affix">
            {textOf(row, locale)}
          </p>
        ))}
      </Link>
    );
  }

  const gear = recommendedGear(snapshot, slot.id);
  const name = nameOf(gear, locale);
  const catalog = catalogForDollSlot(slot.id, gear);
  const lines = showcaseLines(picks[slot.id], catalog);
  const base = textOf({ textZh: gear.baseZh, textEn: gear.baseEn }, locale);
  const showPendingImplicit = !base && gear.implicits.length === 0;
  return (
    <Link to={to} className="doll-slot" aria-label={[groupTitle, slotLabel, name || t.showcaseNamePending].join(" ")}>
      <SlotFrame label={slotLabel} name={name} pending={name ? "" : t.showcaseNamePending} imageUrl={gear.imageUrl} />
      {base ? <p className="doll-base">{base}</p> : null}
      {gear.implicits.map((row) => (
        <p key={row.textZh} className="doll-implicit">
          {textOf(row, locale)}
        </p>
      ))}
      {showPendingImplicit ? <p className="doll-implicit">{t.showcaseImplicitPending}</p> : null}
      <SideLines lines={lines.prefixes} emptyLabel={t.showcaseEmptyPrefix} required={t.showcaseRequired} optional={t.showcaseOptional} locale={locale} />
      <SideLines lines={lines.suffixes} emptyLabel={t.showcaseEmptySuffix} required={t.showcaseRequired} optional={t.showcaseOptional} locale={locale} />
    </Link>
  );
}

function SlotFrame({
  label,
  name,
  pending,
  imageUrl,
}: {
  label: string;
  name: string;
  pending: string;
  imageUrl: string;
}) {
  const src = showcaseImageUrl(imageUrl);
  return (
    <>
      <span className="doll-slot-label">{label}</span>
      <span className="doll-well">
        {src ? <img src={src} alt={name || label} /> : null}
      </span>
      {name ? <p className="doll-name">{name}</p> : null}
      {pending ? <p className="doll-pending">{pending}</p> : null}
    </>
  );
}

function SideLines({
  lines,
  emptyLabel,
  required,
  optional,
  locale,
}: {
  lines: ShowcaseLine[];
  emptyLabel: string;
  required: string;
  optional: string;
  locale: UiLocale;
}) {
  const affixes = lines.flatMap((line) => (line.kind === "affix" ? [line] : []));
  const empties = lines.flatMap((line) => (line.kind === "empty" ? [line] : []));
  const requiredLines = affixes.filter((line) => line.rank === "required");
  const optionalLines = affixes.filter((line) => line.rank === "optional");
  return (
    <>
      {requiredLines.length > 0 ? <p className="doll-rank">{required}</p> : null}
      {requiredLines.map((line) => (
        <p key={line.familyId} className="doll-affix">
          {locale === "en" ? line.labelEn : line.labelZh}
        </p>
      ))}
      {optionalLines.length > 0 ? <p className="doll-rank">{optional}</p> : null}
      {optionalLines.map((line) => (
        <p key={line.familyId} className="doll-affix">
          {locale === "en" ? line.labelEn : line.labelZh}
        </p>
      ))}
      {empties.length > 0 ? (
        <p className="doll-line-empty">
          {empties.flatMap((line, index) => [
            index > 0 ? (
              <span key={`${line.generation}-sep-${index}`} aria-hidden="true">
                {" · "}
              </span>
            ) : null,
            <span key={`${line.generation}-${index}`}>{emptyLabel}</span>,
          ])}
        </p>
      ) : null}
    </>
  );
}
