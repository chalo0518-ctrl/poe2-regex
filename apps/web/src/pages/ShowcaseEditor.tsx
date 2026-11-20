import { useMemo, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { seasonHref } from "./showcaseSeasons.ts";
import {
  affixModGroup,
  catalogForDollSlot,
  matchLangForLocale,
  matchesText,
  matchText,
  paperDollGroups,
  paperDollSlots,
  recommendedGear,
  SHOWCASE_SIDE_CAP,
  showcaseLines,
  type AffixFamily,
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
  return <EditorBody slot={slot} backTo={backTo} />;
}

function EditorBody({ slot, backTo }: { slot: PaperDollSlot; backTo: string }) {
  const { locale, t } = useLocale();
  const { snapshot, picks, toggleRank } = useShowcase();
  const [query, setQuery] = useState("");
  const gear = recommendedGear(snapshot, slot.id);
  const catalog = catalogForDollSlot(slot.id, gear);
  const selected = picks[slot.id];
  const lines = showcaseLines(selected, catalog);
  const slotLabel = locale === "en" ? slot.labelEn : slot.labelZh;
  const group = paperDollGroups.find((row) => row.id === slot.group);
  const groupLabel = group ? (locale === "en" ? group.labelEn : group.labelZh) : "";
  const visible = useMemo(
    () => catalog.filter((family) => matchesText(family, query, { hanFold: true })),
    [catalog, query],
  );

  return (
    <div>
      <Link to={backTo} className="text-sm text-gold hover:underline">
        {t.showcaseBackRecommended}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{groupLabel}</p>
      <h2 className="mt-1 text-xl font-bold text-gold">{slotLabel}</h2>
      <p className="mt-1 text-sm text-muted">{t.showcaseEditorTitle}</p>
      <SessionNote />
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
      <div className="grid gap-4 lg:grid-cols-2">
        <AffixColumn
          title={t.showcasePrefix}
          generation="prefix"
          lines={lines.prefixes}
          rows={visible.filter((family) => family.generation === "prefix")}
          catalog={catalog}
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
}: {
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
  const required = lines.flatMap((line) => (line.kind === "affix" && line.rank === "required" ? [line] : []));
  const optional = lines.flatMap((line) => (line.kind === "affix" && line.rank === "optional" ? [line] : []));
  const empties = lines.flatMap((line) => (line.kind === "empty" ? [line] : []));
  const sideCount = selected.filter((pick) => catalog.find((family) => family.id === pick.familyId)?.generation === generation).length;

  return (
    <section aria-label={title} className="rounded-sm border border-line bg-panel p-3">
      <h2 className="text-sm font-bold text-gold">{title}</h2>
      <div className="mt-3">
        <h3 className="text-xs tracking-[0.14em] text-gold-dim">{t.showcaseRequired}</h3>
        {required.map((line) => (
          <p key={line.familyId} className="mt-1 text-sm text-paper">
            {locale === "en" ? line.labelEn : line.labelZh}
          </p>
        ))}
      </div>
      <div className="mt-3">
        <h3 className="text-xs tracking-[0.14em] text-gold-dim">{t.showcaseOptional}</h3>
        {optional.map((line) => (
          <p key={line.familyId} className="mt-1 text-sm text-paper">
            {locale === "en" ? line.labelEn : line.labelZh}
          </p>
        ))}
      </div>
      {empties.length > 0 ? (
        <p className="doll-line-empty mt-3">
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
      <ul className="mt-3 max-h-[28rem] overflow-auto border-t border-line">
        {rows.map((family) => {
          const typeName = matchText(family, matchLangForLocale(locale));
          const pick = selected.find((row) => row.familyId === family.id);
          const groupTaken = selected.some((row) => {
            const other = catalog.find((candidate) => candidate.id === row.familyId);
            return Boolean(other && other.id !== family.id && affixModGroup(other) === affixModGroup(family));
          });
          const disabled = groupTaken || (!pick && sideCount >= SHOWCASE_SIDE_CAP);
          return (
            <li key={family.id} data-affix-id={family.id} className="flex items-center justify-between gap-3 border-b border-line/70 py-2">
              <span className="text-sm text-paper">{typeName}</span>
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
                  label={t.showcaseOptional}
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
