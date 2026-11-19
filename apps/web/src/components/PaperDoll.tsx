import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  catalogForDollSlot,
  memorialGear,
  paperDollSlots,
  recommendedGear,
  showcaseImageUrl,
  showcaseLines,
  type MemorialGear,
  type PaperDollSlot,
  type PaperDollSlotId,
  type ShowcaseLine,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import ItemTooltip, { type TooltipState } from "./ItemTooltip.tsx";
import { useShowcase } from "../pages/showcaseState.tsx";

/** Column / row tracks. Explicit indexes so a CSS minifier cannot drop grid areas. */
const PLACE: Record<string, { gridColumn: string; gridRow: string }> = {
  weapon: { gridColumn: "1 / 3", gridRow: "2 / 6" },
  offhand: { gridColumn: "7 / 9", gridRow: "2 / 6" },
  helm: { gridColumn: "4 / 6", gridRow: "2 / 4" },
  ring3: { gridColumn: "3 / 4", gridRow: "4 / 5" },
  ring: { gridColumn: "3 / 4", gridRow: "5 / 6" },
  body: { gridColumn: "4 / 6", gridRow: "4 / 7" },
  amulet: { gridColumn: "6 / 7", gridRow: "4 / 5" },
  ring2: { gridColumn: "6 / 7", gridRow: "5 / 6" },
  gloves: { gridColumn: "2 / 4", gridRow: "6 / 8" },
  boots: { gridColumn: "6 / 8", gridRow: "6 / 8" },
  belt: { gridColumn: "4 / 6", gridRow: "7 / 8" },
  trinket: { gridColumn: "1 / 2", gridRow: "8 / 9" },
  life: { gridColumn: "2 / 3", gridRow: "8 / 10" },
  mana: { gridColumn: "7 / 8", gridRow: "8 / 10" },
  charms: { gridColumn: "3 / 7", gridRow: "8 / 10" },
};

type DollMode = "memorial" | "recommended";
type WeaponSet = 1 | 2;

const GRID_AREAS = ["weapon", "offhand", "helm", "ring", "ring2", "amulet", "body", "gloves", "boots", "belt", "life", "mana"] as const;
const HIDDEN_AREAS = new Set(["ring3", "trinket"]);

function labelOf(row: { labelZh: string; labelEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.labelEn : row.labelZh;
}

function nameOf(row: { nameZh: string; nameEn: string }, locale: UiLocale): string {
  return locale === "en" ? row.nameEn || row.nameZh : row.nameZh || row.nameEn;
}

export default function PaperDoll({ mode }: { mode: DollMode }) {
  const { locale, t } = useLocale();
  const [set, setWeaponSet] = useState<WeaponSet>(1);
  const [socketsOn, setSocketsOn] = useState(false);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const jewels = paperDollSlots.filter((slot) => slot.group === "jewel");
  const charms = paperDollSlots.filter((slot) => slot.group === "charm");
  const gridSlots = paperDollSlots.filter((slot) => GRID_AREAS.includes(slot.area as (typeof GRID_AREAS)[number]));
  const visible = gridSlots.filter((slot) => slot.set === 0 || slot.set === set);

  function showTip(gear: MemorialGear | null, event: MouseEvent<HTMLElement>) {
    if (!gear) {
      if (!tip?.pinned) setTip(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setTip((current) => ({
      gear,
      x: current?.pinned ? current.x : rect.right + 8,
      y: current?.pinned ? current.y : rect.top,
      pinned: current?.pinned ?? false,
    }));
  }

  return (
    <div className="ninja-panel">
      <div className="ninja-toolbar">
        <p className="ninja-panel-title">{locale === "en" ? "Equipment" : "裝備"}</p>
        <button
          type="button"
          aria-pressed={socketsOn}
          onClick={() => setSocketsOn((on) => !on)}
        >
          {t.showcaseShowSockets}
        </button>
      </div>
      <div className="ninja-sheet" data-testid="ninja-sheet">
        <WeaponTabs set={set} onSet={setWeaponSet} area="wtab" label={locale === "en" ? "Weapon set" : "武器組"} />
        <WeaponTabs set={set} onSet={setWeaponSet} area="otab" label={locale === "en" ? "Off-hand set" : "副手武器組"} />
        {visible.filter((slot) => slot.group !== "charm" && !HIDDEN_AREAS.has(slot.area)).map((slot) => (
          <DollCell
            key={slot.id}
            slot={slot}
            mode={mode}
            locale={locale}
            socketsOn={socketsOn}
            onHover={showTip}
            onLeave={() => {
              if (!tip?.pinned) setTip(null);
            }}
          />
        ))}
        <div className="ninja-charms" style={PLACE.charms}>
          {charms.map((slot) => (
            <DollCell
              key={slot.id}
              slot={slot}
              mode={mode}
              locale={locale}
              socketsOn={socketsOn}
              onHover={showTip}
              onLeave={() => {
                if (!tip?.pinned) setTip(null);
              }}
            />
          ))}
        </div>
      </div>
      <section className="ninja-jewel-row" aria-label={t.showcaseJewels}>
        <h2 className="ninja-jewel-heading">{t.showcaseJewels}</h2>
        <div className="ninja-jewels">
          {jewels.map((slot) => (
            <div key={slot.id} className="ninja-jewel">
              <DollCell
                slot={slot}
                mode={mode}
                locale={locale}
                socketsOn={socketsOn}
                onHover={showTip}
                onLeave={() => {
                  if (!tip?.pinned) setTip(null);
                }}
              />
              <JewelCaption slotId={slot.id} mode={mode} locale={locale} />
            </div>
          ))}
        </div>
      </section>
      {tip ? (
        <ItemTooltip
          tip={tip}
          locale={locale}
          onPinned={(x, y) => setTip((current) => (current ? { ...current, x, y, pinned: true } : current))}
          onDismiss={() => setTip(null)}
        />
      ) : null}
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
    <div
      className="ninja-tabs"
      style={area === "wtab" ? { gridColumn: "1 / 3", gridRow: "1" } : { gridColumn: "7 / 9", gridRow: "1" }}
      role="group"
      aria-label={label}
    >
      {([1, 2] as const).map((value) => (
        <button key={value} type="button" aria-pressed={set === value} onClick={() => onSet(value)}>
          {value === 1 ? "I" : "II"}
        </button>
      ))}
    </div>
  );
}

function DollCell({
  slot,
  mode,
  locale,
  socketsOn,
  onHover,
  onLeave,
}: {
  slot: PaperDollSlot;
  mode: DollMode;
  locale: UiLocale;
  socketsOn: boolean;
  onHover: (gear: MemorialGear | null, event: MouseEvent<HTMLElement>) => void;
  onLeave: () => void;
}) {
  const { t } = useLocale();
  const { snapshot, picks } = useShowcase();
  const to = mode === "memorial" ? `/showcase/memorial/${slot.id}` : `/showcase/recommended/${slot.id}`;
  const slotLabel = labelOf(slot, locale);
  const place = PLACE[slot.area];

  if (mode === "memorial") {
    const gear = memorialGear(snapshot, slot.id);
    const name = gear ? nameOf(gear, locale) : "";
    const src = gear ? showcaseImageUrl(gear.imageUrl) : null;
    return (
      <Link
        to={to}
        data-area={slot.area}
        data-slot={slot.id}
        data-rarity={gear?.rarity || "empty"}
        className="ninja-cell"
        style={place}
        aria-label={[slotLabel, name || t.showcaseMemorialEmpty].join(" ")}
        onMouseEnter={(event) => onHover(gear, event)}
        onMouseLeave={onLeave}
      >
        <span className="ninja-art">
          {src ? <img src={src} alt={name || slotLabel} /> : null}
          {socketsOn ? <SocketOverlay gear={gear} locale={locale} /> : null}
        </span>
        <span className="sr-only">{name || t.showcaseMemorialEmpty}</span>
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
      style={place}
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

function SocketOverlay({ gear, locale }: { gear: MemorialGear | null; locale: UiLocale }) {
  const sockets = gear?.sockets ?? [];
  if (sockets.length === 0) return null;
  return (
    <span className="socket-stack">
      {sockets.map((socket, index) => {
        const name = locale === "en" ? socket.nameEn : socket.nameZh;
        const src = showcaseImageUrl(socket.imageUrl ?? "");
        if (!src) return null;
        return (
          <span key={`${name}-${index}`} className="socket-pip" data-socket-name={name} title={name}>
            <img src={src} alt="" />
          </span>
        );
      })}
    </span>
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
  locale,
}: {
  slotId: PaperDollSlotId;
  mode: DollMode;
  locale: UiLocale;
}) {
  const { snapshot } = useShowcase();
  if (mode !== "memorial") return null;
  const gear = memorialGear(snapshot, slotId);
  const name = gear ? nameOf(gear, locale) : "";
  if (!name) return null;
  return <span className="sr-only">{name}</span>;
}
