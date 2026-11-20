import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
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
import helmRaven from "../assets/socket-medals/helm-2-raven-shard.png";
import offRabbit from "../assets/socket-medals/off-1-rabbit-idol.png";
import offFox from "../assets/socket-medals/off-2-fox-idol.png";
import wandYeena from "../assets/socket-medals/wand2-1-yeena.png";
import wandSnake from "../assets/socket-medals/wand2-2-snake.png";
import focusStorm from "../assets/socket-medals/focus-1-storm.png";
import focusWardA from "../assets/socket-medals/focus-2-ward.png";
import focusWardB from "../assets/socket-medals/focus-3-ward.png";
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
  ring: { gridColumn: "3 / 4", gridRow: "5 / 6" },
  body: { gridColumn: "4 / 6", gridRow: "4 / 7" },
  amulet: { gridColumn: "6 / 7", gridRow: "4 / 5" },
  ring2: { gridColumn: "6 / 7", gridRow: "5 / 6" },
  gloves: { gridColumn: "2 / 4", gridRow: "6 / 8" },
  boots: { gridColumn: "6 / 8", gridRow: "6 / 8" },
  belt: { gridColumn: "4 / 6", gridRow: "7 / 8" },
  life: { gridColumn: "2 / 3", gridRow: "8 / 10" },
  mana: { gridColumn: "7 / 8", gridRow: "8 / 10" },
  charms: { gridColumn: "3 / 7", gridRow: "8 / 10" },
};

type DollMode = "memorial" | "recommended";
type WeaponSet = 1 | 2;

const GRID_AREAS = ["weapon", "offhand", "helm", "ring", "ring2", "amulet", "body", "gloves", "boots", "belt", "life", "mana"] as const;

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
  const [debugOn, setDebugOn] = useState(false);
  const [tip, setTip] = useState<TooltipState | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [debugLines, setDebugLines] = useState<string[]>([]);
  const jewels = paperDollSlots.filter((slot) => slot.group === "jewel");
  const charms = paperDollSlots.filter((slot) => slot.group === "charm");
  const gridSlots = paperDollSlots.filter((slot) => GRID_AREAS.includes(slot.area as (typeof GRID_AREAS)[number]));
  const visible = gridSlots.filter((slot) => slot.set === 0 || slot.set === set);
  const alternate = gridSlots.filter((slot) => slot.set !== 0 && slot.set !== set);

  function showTip(gear: MemorialGear | null, event: MouseEvent<HTMLElement>) {
    if (!gear) {
      hideTip();
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

  function hideTip() {
    if (!tip?.pinned) setTip(null);
  }

  useLayoutEffect(() => {
    if (!debugOn || !panelRef.current) {
      setDebugLines([]);
      return;
    }
    const lines = [...panelRef.current.querySelectorAll<HTMLElement>(".socket-pip")].map((pip) => {
      const stack = pip.parentElement;
      const cell = pip.closest<HTMLElement>("[data-slot]");
      if (!stack || !cell) return "";
      const pr = pip.getBoundingClientRect();
      const sr = stack.getBoundingClientRect();
      const slot = cell.dataset.slot ?? "";
      const fx = ((pr.left + pr.width / 2 - sr.left) / sr.width).toFixed(3);
      const fy = ((pr.top + pr.height / 2 - sr.top) / sr.height).toFixed(3);
      const fallback = stack.dataset.fallback === "true" ? " fallback" : "";
      return `${slot} ${pip.dataset.socketName || "unnamed"} px (${Math.round(pr.left + pr.width / 2)},${Math.round(pr.top + pr.height / 2)}) slot (${fx},${fy}) d=${Math.round(pr.width)}px${fallback}`;
    });
    setDebugLines(lines.filter(Boolean));
  }, [debugOn, socketsOn, set]);

  return (
    <div className={debugOn ? "ninja-panel socket-debug" : "ninja-panel"} ref={panelRef}>
      <div className="ninja-toolbar">
        <p className="ninja-panel-title">{locale === "en" ? "Equipment" : "裝備"}</p>
        <button
          type="button"
          aria-pressed={socketsOn}
          onClick={() => setSocketsOn((on) => !on)}
        >
          {t.showcaseShowSockets}
        </button>
        <button type="button" aria-pressed={debugOn} onClick={() => setDebugOn((on) => !on)}>
          {locale === "en" ? "Socket debug" : "孔位除錯"}
        </button>
      </div>
      {debugOn ? (
        <pre className="socket-debug-readout" aria-label={locale === "en" ? "Socket debug readout" : "孔位除錯讀數"}>
          {debugLines.join("\n") || (locale === "en" ? "Turn on sockets to read holes." : "先打開顯示鑲嵌才能讀孔位。")}
        </pre>
      ) : null}
      <div className={mode === "memorial" ? "ninja-sheet ninja-memorial-sheet" : "ninja-sheet"}>
        {mode === "memorial" ? alternate.map((slot) => (
          <WeaponThumbnail key={slot.id} slot={slot} locale={locale} socketsOn={socketsOn} debugOn={debugOn} />
        )) : null}
        <WeaponTabs set={set} onSet={setWeaponSet} area="wtab" label={locale === "en" ? "Weapon set" : "武器組"} />
        <WeaponTabs set={set} onSet={setWeaponSet} area="otab" label={locale === "en" ? "Off-hand set" : "副手武器組"} />
        {visible.map((slot) => (
          <DollCell
            key={slot.id}
            slot={slot}
            mode={mode}
            locale={locale}
            socketsOn={socketsOn}
            debugOn={debugOn}
            onHover={showTip}
            onLeave={hideTip}
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
              debugOn={debugOn}
              onHover={showTip}
              onLeave={hideTip}
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
                debugOn={debugOn}
                onHover={showTip}
                onLeave={hideTip}
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
  debugOn,
  onHover,
  onLeave,
}: {
  slot: PaperDollSlot;
  mode: DollMode;
  locale: UiLocale;
  socketsOn: boolean;
  debugOn: boolean;
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
          {socketsOn ? <SocketOverlay slotId={slot.id} locale={locale} debug={debugOn} /> : null}
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

function WeaponThumbnail({ slot, locale, socketsOn, debugOn }: {
  slot: PaperDollSlot;
  locale: UiLocale;
  socketsOn: boolean;
  debugOn: boolean;
}) {
  const { snapshot } = useShowcase();
  const gear = memorialGear(snapshot, slot.id);
  if (!gear) return null;
  const src = showcaseImageUrl(gear.imageUrl);
  const side = slot.area === "weapon" ? "main" : "off";

  return (
    <div className={`ninja-cell ninja-weapon-thumbnail ninja-weapon-thumbnail-${side}`}
      data-slot={slot.id} data-rarity={gear.rarity}>
      <span className="ninja-art">
        {src ? <img src={src} alt={nameOf(gear, locale)} /> : null}
        {socketsOn ? <SocketOverlay slotId={slot.id} locale={locale} debug={debugOn} thumbnail /> : null}
      </span>
    </div>
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
/** Fresh circular crops are centered in the file. */
const CROP: Disc = { cx: 0.5, cy: 0.5, span: 0.887 };

/**
 * Medals cut from the in-game doll. The left boot glyph has no confirmed name.
 */
const SET_I_MEDALS: Partial<Record<PaperDollSlotId, Medal[]>> = {
  "weapon-1-main": [
    { src: wandSerle, nameZh: "瑟雷的凱旋", nameEn: "Serle's Triumph", disc: DISC.wand },
    { src: wandAssandra, nameZh: "流浪女巫艾珊德菈的智慧符文", nameEn: "Hedgewitch Assandra's Rune of Wisdom", disc: DISC.wand },
    { src: wandLifesprig, nameZh: "傳承．生機之記", nameEn: "Legacy of Lifesprig", disc: DISC.wand },
  ],
  "weapon-1-off": [
    { src: offRabbit, nameZh: "狡兔魔偶", nameEn: "Rabbit Idol", disc: CROP },
    { src: offFox, nameZh: "狐狸魔偶", nameEn: "Fox Idol", disc: CROP },
  ],
  "weapon-2-main": [
    { src: wandYeena, nameZh: "伊娜魔偶", nameEn: "Idol of Yeena", disc: CROP },
    { src: wandSnake, nameZh: "蝮蛇魔偶", nameEn: "Snake Idol", disc: CROP },
  ],
  "weapon-2-off": [
    { src: focusStorm, nameZh: "高階暴風符文", nameEn: "Greater Storm Rune", disc: CROP },
    { src: focusWardA, nameZh: "完美保護符文", nameEn: "Perfect Ward Rune", disc: CROP },
    { src: focusWardB, nameZh: "完美保護符文", nameEn: "Perfect Ward Rune", disc: CROP },
  ],
  helmet: [
    { src: helmIron, nameZh: "完美鍛鐵符文", nameEn: "Perfect Iron Rune", disc: DISC.helm },
    { src: helmRaven, nameZh: "渡鴉碎片", nameEn: "Raven-Touched Shard", disc: CROP },
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

// Centers and disc diameters measured from the equipment-slot inner edges.
const HOLE = 56 / 154;
const THUMBNAIL_HOLE = 28 / 74;

const CALIBRATED: Partial<Record<PaperDollSlotId, Spot[]>> = {
  "weapon-1-main": [{ cx: 77 / 154, cy: 76 / 308 }, { cx: 77 / 154, cy: 153 / 308 }, { cx: 77 / 154, cy: 231 / 308 }],
  "weapon-1-off": [{ cx: 38 / 154, cy: 153 / 308 }, { cx: 116 / 154, cy: 153 / 308 }],
  "weapon-2-main": [{ cx: 38 / 154, cy: 153 / 308 }, { cx: 116 / 154, cy: 153 / 308 }],
  "weapon-2-off": [{ cx: 38 / 154, cy: 114 / 308 }, { cx: 116 / 154, cy: 114 / 308 }, { cx: 116 / 154, cy: 192 / 308 }],
  "helmet": [{ cx: 38 / 154, cy: 76 / 154 }, { cx: 116 / 154, cy: 76 / 154 }],
  "body": [{ cx: 38 / 154, cy: 76 / 232 }, { cx: 116 / 154, cy: 76 / 232 }, { cx: 116 / 154, cy: 155 / 232 }],
  "gloves": [{ cx: 38 / 154, cy: 77 / 154 }, { cx: 116 / 154, cy: 77 / 154 }],
  "boots": [{ cx: 38 / 154, cy: 77 / 154 }, { cx: 116 / 154, cy: 77 / 154 }],
};

const THUMBNAIL_SPOTS: Partial<Record<PaperDollSlotId, Spot[]>> = {
  "weapon-1-main": [{ cx: 38 / 74, cy: 36 / 152 }, { cx: 38 / 74, cy: 75 / 152 }, { cx: 38 / 74, cy: 114 / 152 }],
  "weapon-1-off": [{ cx: 18 / 74, cy: 75 / 152 }, { cx: 58 / 74, cy: 75 / 152 }],
  "weapon-2-main": [{ cx: 19 / 74, cy: 75 / 152 }, { cx: 58 / 74, cy: 75 / 152 }],
  "weapon-2-off": [{ cx: 19 / 74, cy: 55 / 152 }, { cx: 57 / 74, cy: 55 / 152 }, { cx: 57 / 74, cy: 94 / 152 }],
};

const FALLBACK_PAIR: Spot[] = [
  { cx: 0.27, cy: 0.48 },
  { cx: 0.73, cy: 0.48 },
];

function fallbackSpots(slotId: PaperDollSlotId): Spot[] | null {
  if (slotId === "helmet" || slotId === "gloves" || slotId === "boots") return FALLBACK_PAIR;
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

function resolveSpots(slotId: PaperDollSlotId, count: number, thumbnail: boolean): { spots: Spot[] | null; fallback: boolean } {
  const calibrated = (thumbnail ? THUMBNAIL_SPOTS : CALIBRATED)[slotId];
  if (calibrated && calibrated.length === count) return { spots: calibrated, fallback: false };
  const fallback = fallbackSpots(slotId);
  if (!fallback) return { spots: null, fallback: true };
  return { spots: fallback.slice(0, count), fallback: true };
}

function socketLayout(slotId: PaperDollSlotId, count: number): string {
  if (slotId === "boots") return "split";
  if (slotId === "gloves" || slotId === "helmet" || slotId === "weapon-1-off" || slotId === "weapon-2-main") return "row";
  if (slotId === "body" || slotId === "weapon-2-off") return "triangle";
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
  debug,
  thumbnail = false,
}: {
  slotId: PaperDollSlotId;
  locale: UiLocale;
  debug: boolean;
  thumbnail?: boolean;
}) {
  const medals = SET_I_MEDALS[slotId];
  const resolved = medals ? resolveSpots(slotId, medals.length, thumbnail) : { spots: null, fallback: true };
  const spots = resolved.spots;
  const diameter = thumbnail ? THUMBNAIL_HOLE : HOLE;
  if (!medals || medals.length === 0 || !spots) return null;
  return (
    <span
      className="socket-stack"
      data-layout={socketLayout(slotId, medals.length)}
      data-basis="slot"
      data-fallback={resolved.fallback ? "true" : "false"}
    >
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
            data-d={String(diameter)}
            {...(medal.src ? {} : { "data-missing": "true" })}
            style={{ left: `${spot.cx * 100}%`, top: `${spot.cy * 100}%`, width: `${diameter * 100}%` }}
            {...(name ? { title: name } : {})}
          >
            {debug ? <i className="socket-cross socket-cross-icon" /> : null}
            {medal.src && medal.disc ? <img src={medal.src} alt="" style={discStyle(medal.disc)} /> : null}
            {debug ? <b className="socket-cross socket-cross-anchor" /> : null}
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
