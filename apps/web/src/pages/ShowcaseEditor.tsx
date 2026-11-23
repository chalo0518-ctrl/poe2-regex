import { recommendationBases, runeforgedName } from "./recommendationBases.ts";
import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { seasonHref } from "./showcaseSeasons.ts";
import {
  affixModGroup,
  catalogForDollSlot,
  craftingSlots,
  showcaseCatalog,
  desecratedFamiliesFor,
  familiesForSocketAugments,
  poolAugmentsForSlot,
  socketCountMax,
  craftTierChoices,
  resolveCraftSlot,
  matchLangForLocale,
  matchesText,
  matchText,
  paperDollGroups,
  paperDollSlots,
  recommendedGear,
  SHOWCASE_SIDE_CAP,
  showcaseLines,
  type AffixFamily,
  type CraftSlotId,
  type PaperDollSlot,
  type ShowcaseLine,
  type ShowcaseRank,
  type UiLocale,
} from "@poe2-regex/data";
import { useLocale } from "../i18n.tsx";
import { SessionNote } from "./ShowcaseBoard.tsx";
import { useShowcase } from "./showcaseState.tsx";

export default function ShowcaseEditor() {
  const { slotId } = useParams();
  const [params] = useSearchParams();
  const backTo = seasonHref("/showcase/recommended", params.get("season"));
  const slot = paperDollSlots.find((row) => row.id === slotId);
  if (!slot) return <Navigate to={backTo} replace />;
  return <EditorBody key={slot.id} slot={slot} backTo={backTo} season={params.get("season") ?? "runes-of-aldur"} />;
}

function EditorBody({ slot, backTo, season }: { slot: PaperDollSlot; backTo: string; season: string }) {
  const { locale, t } = useLocale();
  const { snapshot, picks, toggleRank, tiers, setBase, setTier } = useShowcase();
  const [query, setQuery] = useState("");
  const gear = recommendedGear(snapshot, slot.id);
  const craftSlot = resolveCraftSlot(slot.id, gear);
  const [typeDraft, setTypeDraft] = useState<CraftSlotId | "">(craftSlot ?? "");
  const [source, setSource] = useState<"ordinary" | "desecrated" | "socket">("ordinary");
  const categories = craftingSlots().filter((entry) => slot.id.startsWith("weapon-")
    ? (slot.id.endsWith("-main") ? entry.id !== "shield" && !["body", "helmet", "gloves", "boots", "ring", "amulet", "belt"].includes(entry.id) : entry.id === "shield")
    : entry.id === craftSlot);
  const baseOptions = categories.flatMap((entry) => entry.pools.flatMap((pool) => {
    const categoryId = entry.id + "/" + pool.id;
    const concrete = recommendationBases.filter((base) => base.slot === entry.id &&
      (base.pool ? base.pool === pool.id : entry.pools.length === 1));
    return [
      ...concrete.map((base) => ({ entry, pool, id: categoryId + "/" + base.en, zh: base.zh, en: base.en, runeforge: base.runeforge })),
      {
        entry, pool, runeforge: undefined, id: categoryId,
        zh: `任意${entry.labelZh}${entry.pools.length > 1 ? `（${pool.labelZh}）` : ""}`,
        en: `Any ${entry.labelEn ?? entry.id}${entry.pools.length > 1 ? ` (${pool.labelEn ?? pool.labelZh})` : ""}`,
      },
    ];
  }));
  const typedBases = baseOptions.filter((option) => option.entry.id === typeDraft);
  const selectedBase = baseOptions.find((option) => option.id === craftSlot + "/" + gear.basePoolId + "/" + gear.baseEn)
    ?? baseOptions.find((option) => option.id === craftSlot + "/" + gear.basePoolId);
  const [library, setLibrary] = useState<"prefix" | "suffix" | null>(null);
  const catalog = catalogForDollSlot(slot.id, gear);
  const ordinary = craftSlot ? showcaseCatalog(craftSlot, gear.basePoolId) : [];
  const desecrated = craftSlot && gear.basePoolId ? desecratedFamiliesFor(craftSlot) : [];
  const augmentFamilies = familiesForSocketAugments(gear.augments ?? []);
  const sourceRows = source === "desecrated" ? desecrated : source === "socket" ? augmentFamilies : ordinary;
  const augments = craftSlot && gear.basePoolId ? poolAugmentsForSlot(craftSlot) : [];
  const selected = picks[slot.id];
  const lines = showcaseLines(selected, catalog);
  const slotLabel = locale === "en" ? slot.labelEn : slot.labelZh;
  const group = paperDollGroups.find((row) => row.id === slot.group);
  const groupLabel = group ? (locale === "en" ? group.labelEn : group.labelZh) : "";
  const visible = useMemo(
    () => sourceRows.filter((family) => matchesText(family, query, { hanFold: true })),
    [sourceRows, query],
  );

  const craftParams = new URLSearchParams({ slot: craftSlot ?? "", season, fromSlot: slot.id, base: gear.basePoolId ?? "", start: "blank" });
  if (selectedBase && selectedBase.id.split("/").length === 3) {
    craftParams.set("baseNameZh", selectedBase.zh);
    craftParams.set("baseNameEn", selectedBase.en);
    if (gear.runeforge && selectedBase.runeforge) craftParams.set("runeforge", "1");
  }
  for (const id of gear.augments ?? []) craftParams.append("augment", id);
  for (const pick of selected) {
    craftParams.append("affix", JSON.stringify([pick.familyId, pick.rank, tiers[slot.id]?.[pick.familyId] ?? null]));
  }
  function chooseBase(value: string) {
    const choice = baseOptions.find((option) => option.id === value);
    if (!choice) return;
    const { entry, pool } = choice;
    const next = { ...gear, craftSlot: entry.id as CraftSlotId, basePoolId: pool.id, baseZh: choice.zh, baseEn: choice.en, runeforge: gear.baseEn === choice.en && entry.id === craftSlot && pool.id === gear.basePoolId && gear.runeforge, augments: entry.id === craftSlot ? gear.augments : [] };
    const available = catalogForDollSlot(slot.id, next);
    const lost = selected.filter((pick) => !available.some((family) => family.id === pick.familyId &&
      (tiers[slot.id]?.[pick.familyId] == null || craftTierChoices(family).some((tier) => tier.rank === tiers[slot.id]?.[pick.familyId]))));
    const labels = lost.map((pick) => catalog.find((family) => family.id === pick.familyId)).filter(Boolean)
      .map((family) => locale === "en" ? family?.labelEn : family?.labelZh);
    if (!lost.length || window.confirm((locale === "en" ? "Changing the base removes: " : "更換底材將移除：") + labels.join("、"))) {
      setBase(slot.id, next);
      setSource("ordinary");
    }
  }

  return (
    <div>
      <Link to={backTo} className="text-sm text-gold hover:underline">
        {t.showcaseBackRecommended}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{groupLabel}</p>
      <h2 className="mt-1 text-xl font-bold text-gold">{slotLabel}</h2>
      <p className="mt-1 text-sm text-muted">{t.showcaseEditorTitle}</p>
      <SessionNote />
      {categories.length > 0 && (
        <label className="mb-4 block text-gold">
          {locale === "en" ? "Equipment type" : "裝備類型"}
          <select className="ml-3 bg-panel p-2" value={typeDraft} onChange={(event) => setTypeDraft(event.target.value as CraftSlotId)}>
            <option value="" disabled>{locale === "en" ? "Choose a type" : "選擇類型"}</option>
            {categories.map((entry) => <option key={entry.id} value={entry.id}>{locale === "en" ? entry.labelEn ?? entry.id : entry.labelZh}</option>)}
          </select>
        </label>
      )}
      {typedBases.length > 0 && (
        <label className="mb-4 block text-gold">
          {locale === "en" ? "Base type" : "底材"}
          <select className="ml-3 bg-panel p-2" value={typeDraft === craftSlot ? selectedBase?.id ?? "" : ""} onChange={(event) => chooseBase(event.target.value)}>
            <option value="" disabled>{locale === "en" ? "Choose a base" : "選擇底材"}</option>
            {typedBases.map(({ zh, en, id }) => <option key={id} value={id}>{locale === "en" ? en : zh}</option>)}
          </select>
        </label>
      )}
      {typeDraft === craftSlot && selectedBase?.runeforge && (
        <fieldset className="mb-4 text-gold">
          <legend>{locale === "en" ? "Verisium Runeforging" : "維里西姆符鍛"}</legend>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={gear.runeforge ?? false} onChange={(event) => {
              setBase(slot.id, { ...gear, runeforge: event.target.checked });
            }} />
            {runeforgedName(selectedBase, locale)} · {selectedBase.runeforge} {locale === "en" ? "Verisium" : "維里西姆"}
          </label>
        </fieldset>
      )}
      {craftSlot && augments.length > 0 && (
        <fieldset className="mb-4 flex flex-wrap gap-3 text-gold">
          <legend>{locale === "en" ? "Socketed augments" : "鑲嵌物"}</legend>
          {Array.from({ length: Math.max(2, socketCountMax(craftSlot)) }, (_, index) => (
            <select key={index} className="bg-panel p-2" aria-label={(locale === "en" ? "Socket " : "插槽 ") + (index + 1)}
              value={gear.augments?.[index] ?? ""} onChange={(event) => {
                const next = Array.from({ length: Math.max(2, socketCountMax(craftSlot)) }, (_, i) => gear.augments?.[i] ?? "");
                next[index] = event.target.value;
                const updated = { ...gear, augments: next };
                const valid = new Set(catalogForDollSlot(slot.id, updated).map((family) => family.id));
                if (selected.some((pick) => !valid.has(pick.familyId)) && !window.confirm(locale === "en" ? "Remove incompatible modifiers?" : "移除不再相容的詞條？")) return;
                setBase(slot.id, updated);
              }}>
              <option value="">{locale === "en" ? "Empty socket" : "空插槽"}</option>
              {augments.map((augment) => <option key={augment.id} value={augment.id}
                disabled={augment.limitOne && gear.augments?.some((id, i) => i !== index && id === augment.id)}>
                {locale === "en" ? augment.nameEn : augment.nameZh}
              </option>)}
            </select>
          ))}
        </fieldset>
      )}
      {craftSlot && gear.basePoolId && selected.length > 0 && (
        <Link className="mb-4 inline-block text-gold underline" to={"/endgame/crafting?" + craftParams}>
          {locale === "en" ? "My recommended modifiers" : "我的推薦詞條"}
        </Link>
      )}
      {catalog.length === 0 ? (
        <div className="mb-4 max-w-xl">
          <p className="text-sm text-paper">{t.showcaseNoCatalog}</p>
          <p className="mt-1 text-sm text-muted">{t.showcaseNoCatalogMore}</p>
        </div>
      ) : (
        <label className="mb-4 block max-w-md text-sm text-muted">
          {t.showcaseSearch}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-paper"
            autoComplete="off"
          />
        </label>
      )}
      {library && <label className="mb-3 block text-gold">
        {locale === "en" ? "Modifier source" : "詞條來源"}
        <select className="ml-3 bg-panel p-2" value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
          <option value="ordinary">{locale === "en" ? "Ordinary" : "普通"}</option>
          <option value="desecrated">{locale === "en" ? "Desecrated" : "褻瀆"}</option>
          <option value="socket">{locale === "en" ? "Augment pools" : "鑲嵌解鎖"}</option>
        </select>
      </label>}
      <div className="grid gap-4">
        <AffixColumn
          title={t.showcasePrefix}
          generation="prefix"
          lines={lines.prefixes}
          rows={visible.filter((family) => family.generation === "prefix")}
          catalog={catalog}
          expanded={library}
          onOpen={setLibrary}
          tiers={tiers[slot.id] ?? {}}
          onTier={(id, rank) => setTier(slot.id, id, rank)}
          selected={selected}
          locale={locale}
          onToggle={(family, rank) => toggleRank(slot.id, family, rank)}
        />
        <AffixColumn
          title={t.showcaseSuffix}
          generation="suffix"
          lines={lines.suffixes}
          rows={visible.filter((family) => family.generation === "suffix")}
          catalog={catalog}
          expanded={library}
          onOpen={setLibrary}
          tiers={tiers[slot.id] ?? {}}
          onTier={(id, rank) => setTier(slot.id, id, rank)}
          selected={selected}
          locale={locale}
          onToggle={(family, rank) => toggleRank(slot.id, family, rank)}
        />
      </div>
    </div>
  );
}

function AffixColumn({
  title,
  generation,
  lines,
  rows,
  catalog,
  selected,
  locale,
  onToggle,
  expanded,
  onOpen,
  tiers,
  onTier,
}: {
  expanded: "prefix" | "suffix" | null;
  onOpen: (side: "prefix" | "suffix") => void;
  tiers: Record<string, number | null>;
  onTier: (id: string, rank: number | null) => void;
  title: string;
  generation: "prefix" | "suffix";
  lines: ShowcaseLine[];
  rows: AffixFamily[];
  catalog: readonly AffixFamily[];
  selected: { familyId: string; rank: ShowcaseRank }[];
  locale: UiLocale;
  onToggle: (family: AffixFamily, rank: ShowcaseRank) => void;
}) {
  const { t } = useLocale();
  const emptyLabel = generation === "prefix" ? t.showcaseEmptyPrefix : t.showcaseEmptySuffix;
  const sideCount = selected.filter((pick) => catalog.find((family) => family.id === pick.familyId)?.generation === generation).length;

  return (
    <section aria-label={title} className="rounded-sm border border-line bg-panel p-3">
      <h2 className="text-sm font-bold text-gold">{title}</h2>
      <div className="mt-3 grid gap-2">
        {lines.map((line, index) => {
          const family = line.kind === "affix" ? catalog.find((entry) => entry.id === line.familyId) : undefined;
          const choice = family && line.kind === "affix"
            ? craftTierChoices(family).find((entry) => entry.rank === tiers[line.familyId])
            : undefined;
          const tier = choice && family?.tiers[choice.index];
          const tierText = tier && (locale === "en" ? tier.textEn || tier.textZh : tier.textZh || tier.textEn);
          const range = choice?.statMin != null && choice.statMax != null && choice.statMin !== choice.statMax
            ? `${choice.statMin}–${choice.statMax}` : undefined;
          const hasRange = range && tierText?.replace(/\s/g, "").replace(/[-—−]/g, "–").includes(range);
          return (
          <button type="button" key={index}
            className="grid w-full min-w-0 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border border-line bg-ink px-3 py-2 text-sm hover:border-gold"
            onClick={() => onOpen(generation)}>
            {line.kind === "empty" ? <span className="col-start-2 text-center text-muted">{emptyLabel}</span> : (
              <>
                <span className="text-left tabular-nums text-gold">
                  {tiers[line.familyId] != null ? `T${tiers[line.familyId]}` : "T—"}
                </span>
                <span className="min-w-0 break-words text-center">
                  <span className="block text-[#b5acff]">{tierText || (locale === "en" ? line.labelEn : line.labelZh)}</span>
                  {choice && <small className="block text-muted">
                    {range && !hasRange && <>{locale === "en" ? "Roll range" : "數值範圍"} {range} · </>}
                    {locale === "en" ? "Minimum item level" : "最低物品等級"} {choice.level}
                  </small>}
                </span>
                <span className="text-right text-xs text-gold-dim">
                  {line.rank === "required" ? t.showcaseRequired : locale === "en" ? "Recommended" : "推薦"}
                </span>
              </>
            )}
          </button>
          );
        })}
      </div>
      <button type="button" className="mt-3 text-xs text-gold underline" onClick={() => onOpen(generation)}>
        {locale === "en" ? "Open modifier library" : "打開詞條庫"}
      </button>
      <ul hidden={expanded !== generation} className="mt-3 max-h-[28rem] overflow-auto border-t border-line">
        {rows.map((family) => {
          const typeName = matchText(family, matchLangForLocale(locale));
          const pick = selected.find((row) => row.familyId === family.id);
          const conflict = selected.find((row) => {
            const other = catalog.find((candidate) => candidate.id === row.familyId);
            return Boolean(other && other.id !== family.id && affixModGroup(other) === affixModGroup(family));
          });
          const groupTaken = Boolean(conflict);
          const conflictFamily = catalog.find((entry) => entry.id === conflict?.familyId);
          const choices = craftTierChoices(family);
          const disabled = groupTaken || (!pick && sideCount >= SHOWCASE_SIDE_CAP);
          return (
            <li key={family.id} data-affix-id={family.id} className="flex items-center justify-between gap-3 border-b border-line/70 py-2">
              <span className={groupTaken ? "text-sm text-muted" : "text-sm text-paper"}>
                {typeName}
                <small className="block text-muted">{choices.map((choice) => `T${choice.rank} · iLvL ${choice.level}`).join(" / ")}</small>
                {conflictFamily && <small className="block">{t.craftingConflict} · {matchText(conflictFamily, matchLangForLocale(locale))}</small>}
              </span>
              {pick && <select aria-label={(locale === "en" ? "Minimum tier" : "最低 T 階") + " " + typeName} value={tiers[family.id] ?? ""} onChange={(event) => onTier(family.id, event.target.value ? Number(event.target.value) : null)} className="bg-panel text-paper">
                <option value="">{locale === "en" ? "Any tier" : "不限 T 階"}</option>
                {choices.map((choice) => <option key={choice.index} value={choice.rank}>{`T${choice.rank} · iLvL ${choice.level}`}</option>)}
              </select>}
              <span className="flex shrink-0 gap-3 text-xs">
                <RankBox
                  label={t.showcaseRequired}
                  typeName={typeName}
                  checked={pick?.rank === "required"}
                  disabled={disabled && pick?.rank !== "required"}
                  title={groupTaken ? t.craftingConflict : undefined}
                  onChange={() => onToggle(family, "required")}
                />
                <RankBox
                  label={locale === "en" ? "Recommended" : "推薦"}
                  typeName={typeName}
                  checked={pick?.rank === "optional"}
                  disabled={disabled && pick?.rank !== "optional"}
                  title={groupTaken ? t.craftingConflict : undefined}
                  onChange={() => onToggle(family, "optional")}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RankBox({
  label,
  typeName,
  checked,
  disabled,
  title,
  onChange,
}: {
  label: string;
  typeName: string;
  checked: boolean;
  disabled: boolean;
  title?: string;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex items-center gap-1 text-muted" title={title}>
      <input
        type="checkbox"
        className="doll-check"
        aria-label={`${label} ${typeName}`}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
