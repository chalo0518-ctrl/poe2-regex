import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import wandSerle from "../assets/socket-medals/wand-1-serles-triumph.png";
import wandAssandra from "../assets/socket-medals/wand-2-assandra-wisdom.png";
import wandLifesprig from "../assets/socket-medals/wand-3-legacy-lifesprig.png";
import helmIron from "../assets/socket-medals/helm-1-perfect-iron-rune.png";
import bodyMaxarius from "../assets/socket-medals/body-1-idol-of-maxarius.png";
import bodyFoundations from "../assets/socket-medals/body-2-rune-of-foundations.png";
import bodyCraiceann from "../assets/socket-medals/body-3-craiceann-warding.png";
import glovesCadigan from "../assets/socket-medals/gloves-1-cadigan-epiphany.png";
import glovesBehemoth from "../assets/socket-medals/gloves-2-behemoth-shard.png";
import bootsRedEye from "../assets/socket-medals/boots-1-red-eye.png";
import bootsFarrul from "../assets/socket-medals/boots-2-farruls-chase.png";
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
          {socketsOn ? <SocketOverlay slotId={slot.id} locale={locale} /> : null}
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

/** Pewter-disc center and diameter as fractions of the tight crop. Glow outside this disc is clipped. */
type Disc = { cx: number; cy: number; span: number };

type Medal = { src: string | null; nameZh: string; nameEn: string; disc?: Disc };

const DISC: Record<string, Disc> = {
  wand: { cx: 0.491, cy: 0.491, span: 0.966 },
  helm: { cx: 0.492, cy: 0.492, span: 0.938 },
  maxarius: { cx: 0.491, cy: 0.491, span: 0.926 },
  foundations: { cx: 0.491, cy: 0.491, span: 0.963 },
  craiceann: { cx: 0.491, cy: 0.491, span: 0.964 },
  cadigan: { cx: 0.492, cy: 0.492, span: 0.967 },
  behemoth: { cx: 0.491, cy: 0.491, span: 0.966 },
  redEye: { cx: 0.491, cy: 0.491, span: 0.966 },
  farrul: { cx: 0.491, cy: 0.491, span: 0.966 },
};

/**
 * Weapon set I medals cut from the in-game doll. The helm's second socket is
 * Raven-Touched Shard; there is no tight crop, so the right hole stays empty.
 * The sceptre has no visible medals. The left boot glyph has no confirmed name.
 * Set II has no in-game medal crops.
 */
const SET_I_MEDALS: Partial<Record<PaperDollSlotId, Medal[]>> = {
  "weapon-1-main": [
    { src: wandSerle, nameZh: "瑟雷的凱旋", nameEn: "Serle's Triumph", disc: DISC.wand },
    { src: wandAssandra, nameZh: "流浪女巫艾珊德菈的智慧符文", nameEn: "Hedgewitch Assandra's Rune of Wisdom", disc: DISC.wand },
    { src: wandLifesprig, nameZh: "傳承．生機之記", nameEn: "Legacy of Lifesprig", disc: DISC.wand },
  ],
  "weapon-1-off": [],
  helmet: [
    { src: helmIron, nameZh: "完美鍛鐵符文", nameEn: "Perfect Iron Rune", disc: DISC.helm },
    { src: null, nameZh: "渡鴉碎片", nameEn: "Raven-Touched Shard" },
  ],
  body: [
    { src: bodyMaxarius, nameZh: "瑪薩里歐斯魔偶", nameEn: "Idol of Maxarius", disc: DISC.maxarius },
    { src: bodyFoundations, nameZh: "崇敬基準符文", nameEn: "Rune of Foundations", disc: DISC.foundations },
    { src: bodyCraiceann, nameZh: "奎爾珊的守護符文", nameEn: "Craiceann's Rune of Warding", disc: DISC.craiceann },
  ],
  gloves: [
    { src: glovesCadigan, nameZh: "卡迪根的頓悟", nameEn: "Cadigan's Epiphany", disc: DISC.cadigan },
    { src: glovesBehemoth, nameZh: "巨獸 破碎之地", nameEn: "Behemoth Shard", disc: DISC.behemoth },
  ],
  boots: [
    { src: bootsRedEye, nameZh: "", nameEn: "", disc: DISC.redEye },
    { src: bootsFarrul, nameZh: "費爾羅的追擊符文", nameEn: "Farrul's Rune of the Chase", disc: DISC.farrul },
  ],
};

type Spot = { cx: number; cy: number };

/**
 * One hole size for every socket, as a fraction of the 2-cell slot width.
 * Centers are fractions of that slot's inner gold frame, measured on the
 * in-game doll. Helm, gloves, and boots share the two-hole line.
 */
const HOLE = 0.36;
const PAIR_CY = 0.48;
const PAIR: Spot[] = [
  { cx: 0.27, cy: PAIR_CY },
  { cx: 0.73, cy: PAIR_CY },
];

function medalSpots(slotId: PaperDollSlotId): Spot[] | null {
  if (slotId === "helmet" || slotId === "gloves" || slotId === "boots") return PAIR;
  if (slotId === "body") {
    return [
      { cx: 0.23, cy: 0.33 },
      { cx: 0.75, cy: 0.33 },
      { cx: 0.74, cy: 0.68 },
    ];
  }
  if (slotId === "weapon-1-main") {
    return [
      { cx: 0.5, cy: 0.23 },
      { cx: 0.5, cy: 0.5 },
      { cx: 0.5, cy: 0.77 },
    ];
  }
  return null;
}

function socketLayout(slotId: PaperDollSlotId, count: number): string {
  if (slotId === "boots") return "split";
  if (slotId === "gloves" || slotId === "helmet") return "row";
  if (slotId === "body") return "triangle";
  if (count >= 3) return "column";
  return "center";
}

function discStyle(disc: Disc): { width: string; height: string; left: string; top: string } {
  const scale = 100 / disc.span;
  return {
    width: `${scale}%`,
    height: `${scale}%`,
    left: `${50 - disc.cx * scale}%`,
    top: `${50 - disc.cy * scale}%`,
  };
}

function SocketOverlay({
  slotId,
  locale,
}: {
  slotId: PaperDollSlotId;
  locale: UiLocale;
}) {
  const medals = SET_I_MEDALS[slotId];
  const spots = medalSpots(slotId);
  if (!medals || medals.length === 0 || !spots) return null;
  return (
    <span className="socket-stack" data-layout={socketLayout(slotId, medals.length)} data-count={medals.length}>
      {medals.map((medal, index) => {
        const spot = spots[index] ?? spots[spots.length - 1];
        const name = locale === "en" ? medal.nameEn : medal.nameZh;
        return (
          <span
            key={`${medal.nameEn || "socket"}-${index}`}
            className={medal.src ? "socket-pip" : "socket-pip socket-pip-empty"}
            data-socket-name={name}
            data-cx={String(spot.cx)}
            data-cy={String(spot.cy)}
            data-d={String(HOLE)}
            {...(medal.src ? {} : { "data-missing": "true" })}
            style={{ left: `${spot.cx * 100}%`, top: `${spot.cy * 100}%`, width: `${HOLE * 100}%` }}
            {...(name ? { title: name } : {})}
          >
            {medal.src && medal.disc ? <img src={medal.src} alt="" style={discStyle(medal.disc)} /> : null}
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
