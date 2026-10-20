import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CRAFTING_CONSTRAINTS,
  CRAFTING_RULESET,
  CRAFTING_TREE,
  CRAFT_CLEANUP_TEXT,
  CRAFT_REASON_TEXT,
  CRAFT_WARNING_TEXT,
  craftLocaleText,
  craftTierChoices,
  craftTreeNodeForDiagram,
  craftVerdictHeadline,
  craftingFamiliesFor,
  craftingSlotMeta,
  craftingSlots,
  craftingSourcePath,
  CRAFT_DIAGRAM,
  decideCraft,
  effectText,
  familiesForSocketAugments,
  harvestTags,
  isCraftSlotId,
  poolAugmentsForSlot,
  poolLabel,
  socketCountMax,
  socketSideCaps,
  type AffixFamily,
  type CraftDecision,
  type CraftDiagramNodeId,
  type CraftSlotId,
  type ModSide,
  type NonTargetClass,
} from "@poe2-regex/data";
import { ChroniclesModBuilder, type ModPickState } from "../components/ChroniclesModBuilder.tsx";
import { CraftDiagram } from "../components/CraftDiagram.tsx";
import { useLocale } from "../i18n.tsx";

const SLOTS = craftingSlots();
const DEFAULT_SLOT: CraftSlotId = "body";
const ARMOUR_ORDER = ["body", "helmet", "gloves", "boots", "shield"] as const satisfies readonly CraftSlotId[];
const JEWELLERY_ORDER = ["ring", "amulet", "belt"] as const satisfies readonly CraftSlotId[];
const ARMOUR_IDS = new Set<CraftSlotId>(ARMOUR_ORDER);
const JEWELLERY_IDS = new Set<CraftSlotId>(JEWELLERY_ORDER);

function slotsInOrder(ids: readonly CraftSlotId[]) {
  return ids.flatMap((id) => {
    const item = SLOTS.find((row) => row.id === id);
    return item ? [item] : [];
  });
}

type OwnedFlag = { owned: boolean; highTier: boolean };

type OtherFlag = { tierIndex: number | null; desecrated: boolean };

function isCraftTarget(pick: ModPickState | undefined): boolean {
  return pick?.polarity === "include" || pick?.polarity === "or";
}

function chosenTierLevel(family: AffixFamily, pick: ModPickState | undefined): number | null {
  const index = pick?.minTierIndex;
  if (index == null || index < 0 || index >= family.tiers.length) return null;
  return family.tiers[index]?.level ?? null;
}

function chosenTierLabel(family: AffixFamily, pick: ModPickState | undefined): string | null {
  if (pick?.minTierIndex == null) return null;
  const choice = craftTierChoices(family).find((row) => row.index === pick.minTierIndex);
  if (!choice) return null;
  return `T${choice.rank} · iLvL ${choice.level}`;
}

function parseLevel(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export default function CraftingPage() {
  const { locale, t } = useLocale();
  const [params, setParams] = useSearchParams();
  const rawSlot = params.get("slot") || DEFAULT_SLOT;
  const slotId: CraftSlotId = isCraftSlotId(rawSlot) ? rawSlot : DEFAULT_SLOT;
  const slot = craftingSlotMeta(slotId);
  const families = useMemo(() => craftingFamiliesFor(slotId), [slotId]);

  const [picks, setPicks] = useState<Record<string, ModPickState>>({});
  const [owned, setOwned] = useState<Record<string, OwnedFlag>>({});
  const [itemLevelRaw, setItemLevelRaw] = useState("");
  const [targetSide, setTargetSide] = useState<ModSide | "auto">("auto");
  const [prefixCount, setPrefixCount] = useState(0);
  const [suffixCount, setSuffixCount] = useState(0);
  const [goodFracture, setGoodFracture] = useState(false);
  const [garbageFracture, setGarbageFracture] = useState(false);
  const [keeper, setKeeper] = useState(false);
  const [tightBudget, setTightBudget] = useState(false);
  const [others, setOthers] = useState<Record<string, OtherFlag>>({});
  const [socketCount, setSocketCount] = useState(2);
  const [socketPicks, setSocketPicks] = useState<string[]>(["", ""]);
  const [pinnedNode, setPinnedNode] = useState<CraftDiagramNodeId | null>(null);
  const socketFamilies = useMemo(
    () => familiesForSocketAugments(socketPicks.filter(Boolean)),
    [socketPicks],
  );
  const checklistFamilies = useMemo(() => [...families, ...socketFamilies], [families, socketFamilies]);
  const caps = useMemo(() => socketSideCaps(socketPicks), [socketPicks]);
  const tierCount = checklistFamilies.reduce((sum, family) => sum + family.tiers.length, 0);
  const socketMax = Math.max(3, socketCountMax(slotId));

  const onPicksChange = useCallback((next: Record<string, ModPickState>) => {
    setPicks(next);
  }, []);

  useEffect(() => {
    setPicks({});
    setOwned({});
    setItemLevelRaw("");
    setPrefixCount(0);
    setSuffixCount(0);
    setGoodFracture(false);
    setGarbageFracture(false);
    setKeeper(false);
    setOthers({});
    setSocketCount(2);
    setSocketPicks(["", ""]);
    setPinnedNode(null);
  }, [slotId]);

  useEffect(() => {
    setPrefixCount((count) => Math.min(count, caps.prefix));
    setSuffixCount((count) => Math.min(count, caps.suffix));
  }, [caps.prefix, caps.suffix]);

  const selected = useMemo(
    () => checklistFamilies.filter((family) => isCraftTarget(picks[family.id])),
    [checklistFamilies, picks],
  );

  useEffect(() => {
    const ids = new Set(selected.map((family) => family.id));
    setOwned((prev) => {
      const stale = Object.keys(prev).filter((id) => !ids.has(id));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const id of stale) delete next[id];
      return next;
    });
  }, [selected]);

  useEffect(() => {
    const ids = new Set(selected.map((family) => family.id));
    setOthers((prev) => {
      const stale = Object.keys(prev).filter((id) => ids.has(id));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const id of stale) delete next[id];
      return next;
    });
  }, [selected]);

  const lockedId = selected.find((family) => picks[family.id]?.desecrationLock)?.id ?? null;

  useEffect(() => {
    if (!lockedId) return;
    setOwned((prev) => (
      prev[lockedId]?.owned ? prev : { ...prev, [lockedId]: { owned: true, highTier: true } }
    ));
  }, [lockedId]);

  const decision = useMemo(() => {
    return decideCraft({
      includes: selected.map((family) => ({
        id: family.id,
        generation: family.generation,
        tierLevel: chosenTierLevel(family, picks[family.id]),
      })),
      itemLevel: parseLevel(itemLevelRaw),
      owned: selected
        .filter((family) => owned[family.id]?.owned || lockedId === family.id)
        .map((family) => ({
          id: family.id,
          generation: family.generation,
          highTier: owned[family.id]?.highTier !== false,
        })),
      prefixCount,
      suffixCount,
      targetSide,
      garbageFracture,
      hasGoodFractureOnTargetSide: goodFracture,
      desecrationLock: lockedId,
      craftedSlotLockedToKeeper: keeper,
      tightBudget,
      others: Object.entries(others).flatMap(([id, flag]) => {
        const family = checklistFamilies.find((row) => row.id === id);
        if (!family) return [];
        const level = flag.tierIndex == null ? null : family.tiers[flag.tierIndex]?.level ?? null;
        return [{
          id,
          generation: family.generation,
          level,
          desecrated: flag.desecrated,
        }];
      }),
      slot: slotId,
      socketCount,
      augments: socketPicks.flatMap((id, index) => (id ? [{ id, socket: index + 1 }] : [])),
    });
  }, [
    checklistFamilies,
    selected,
    itemLevelRaw,
    owned,
    lockedId,
    picks,
    prefixCount,
    suffixCount,
    targetSide,
    garbageFracture,
    goodFracture,
    keeper,
    tightBudget,
    others,
    slotId,
    socketCount,
    socketPicks,
  ]);

  const shownNodeId = pinnedNode ?? decision.path.at(-1) ?? "base";
  const shownDiagram = CRAFT_DIAGRAM.find((row) => row.id === shownNodeId) ?? null;
  const shownTree = CRAFTING_TREE.find((row) => row.id === craftTreeNodeForDiagram(shownNodeId)) ?? null;
  const sideLabel = decision.targetSide === "prefix" ? t.craftingSidePrefix : t.craftingSideSuffix;
  const armourSlots = slotsInOrder(ARMOUR_ORDER);
  const jewellerySlots = slotsInOrder(JEWELLERY_ORDER);
  const weaponSlots = SLOTS.filter((item) => !ARMOUR_IDS.has(item.id) && !JEWELLERY_IDS.has(item.id));

  function setSlot(id: CraftSlotId) {
    setParams({ slot: id });
  }

  function toggleOwned(id: string) {
    if (lockedId === id) return;
    setOwned((prev) => {
      if (prev[id]?.owned) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { owned: true, highTier: true } };
    });
  }

  return (
    <div>
      <section className="mb-5 rounded-sm border border-line bg-panel px-4 py-3" aria-label={t.craftingConstraintsLabel}>
        <p className="text-xs tracking-[0.18em] text-gold-dim">
          {t.craftingConstraintsLabel}
          <span className="ml-2 font-mono normal-case tracking-normal">{CRAFTING_RULESET.id}</span>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-paper">
          {CRAFTING_CONSTRAINTS.map((line) => (
            <li key={line.zhHant}>{craftLocaleText(line, locale)}</li>
          ))}
        </ul>
      </section>

      <label className="mb-5 flex items-center gap-2 text-sm text-gold">
        {t.craftingSlotHeading}
        <select
          aria-label={t.craftingSlotHeading}
          value={slotId}
          onChange={(event) => setSlot(event.target.value as CraftSlotId)}
          className="min-w-48 rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
        >
          <optgroup label={t.craftingSlotGroupArmour}>
            {armourSlots.map((item) => (
              <option key={item.id} value={item.id}>{poolLabel(item, locale)}</option>
            ))}
          </optgroup>
          <optgroup label={t.craftingSlotGroupJewellery}>
            {jewellerySlots.map((item) => (
              <option key={item.id} value={item.id}>{poolLabel(item, locale)}</option>
            ))}
          </optgroup>
          <optgroup label={t.craftingSlotGroupWeapon}>
            {weaponSlots.map((item) => (
              <option key={item.id} value={item.id}>{poolLabel(item, locale)}</option>
            ))}
          </optgroup>
        </select>
      </label>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="min-w-0">
          <SocketFilter
            slotId={slotId}
            socketCount={socketCount}
            socketMax={socketMax}
            socketPicks={socketPicks}
            onAdd={() => {
              setSocketCount((count) => count + 1);
              setSocketPicks((prev) => [...prev, ""]);
            }}
            onRemove={() => {
              setSocketCount((count) => Math.max(2, count - 1));
              setSocketPicks((prev) => prev.slice(0, Math.max(2, prev.length - 1)));
            }}
            onPick={(index, id) => {
              setSocketPicks((prev) => {
                const copy = prev.slice();
                copy[index] = id;
                return copy;
              });
            }}
          />
          <ChroniclesModBuilder
            key={slotId}
            kicker="CRAFTING · TARGETS"
            title={t.craftingTargetsTitle}
            description={t.craftingTargetsDesc}
            statsNote={t.statsFamilies(checklistFamilies.length, tierCount)}
            sourceNote={t.sourcePoe2db(slot ? craftingSourcePath(slot) : "")}
            harvestTags={harvestTags}
            families={checklistFamilies}
            importHint={t.earlyGearImportHint}
            onPicksChange={onPicksChange}
            dockRegex={false}
            regexCaption={t.craftingRegexCaption}
            pickMode="target"
            prefixCap={caps.prefix}
            suffixCap={caps.suffix}
          />
          <ItemPanel
            decision={decision}
            sideLabel={sideLabel}
            itemLevelRaw={itemLevelRaw}
            onItemLevel={setItemLevelRaw}
            targetSide={targetSide}
            onTargetSide={setTargetSide}
            prefixCount={prefixCount}
            suffixCount={suffixCount}
            onPrefixCount={setPrefixCount}
            onSuffixCount={setSuffixCount}
            goodFracture={goodFracture}
            garbageFracture={garbageFracture}
            onGoodFracture={(next) => {
              setGoodFracture(next);
              if (next) setGarbageFracture(false);
            }}
            onGarbageFracture={(next) => {
              setGarbageFracture(next);
              if (next) setGoodFracture(false);
            }}
            keeper={keeper}
            onKeeper={setKeeper}
            tightBudget={tightBudget}
            onTightBudget={setTightBudget}
            selected={selected.map((family) => ({
              id: family.id,
              label: effectText(family, locale),
              tierLabel: chosenTierLabel(family, picks[family.id]),
              owned: Boolean(owned[family.id]?.owned) || lockedId === family.id,
              highTier: owned[family.id]?.highTier !== false,
              locked: lockedId === family.id,
            }))}
            onToggleOwned={toggleOwned}
            onToggleHigh={(id) => {
              setOwned((prev) => (
                prev[id]?.owned || lockedId === id
                  ? { ...prev, [id]: { owned: true, highTier: prev[id]?.highTier === false } }
                  : prev
              ));
            }}
            families={checklistFamilies}
            selectedIds={selected.map((family) => family.id)}
            others={others}
            classes={decision.removal.classes}
            prefixCap={caps.prefix}
            suffixCap={caps.suffix}
            onAddOther={(id, tierIndex, desecrated) => {
              setOthers((prev) => ({ ...prev, [id]: { tierIndex, desecrated } }));
            }}
            onRemoveOther={(id) => {
              setOthers((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
              });
            }}
          />
        </div>

        <aside className="min-w-0 xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
          <section className="rounded-sm border border-line bg-panel px-3 py-3" aria-labelledby="craft-tree-heading">
            <h2 id="craft-tree-heading" className="text-sm font-medium text-gold">{t.craftingTreeHeading}</h2>
            <p className="mt-1 mb-3 text-xs text-muted">{t.craftingTreeHint}</p>
            <CraftDiagram
              path={decision.path}
              selectedId={shownNodeId}
              onSelect={setPinnedNode}
              detail={shownDiagram && shownTree ? (
                <div className="mt-2 space-y-2 rounded-sm border border-line bg-panel px-2 py-2 text-xs leading-relaxed text-paper" data-craft-detail>
                  <p className="text-gold">
                    {craftLocaleText(shownDiagram.title, locale)}
                    {" · "}
                    {craftLocaleText(shownTree.title, locale)}
                  </p>
                  <p>{craftLocaleText(shownDiagram.choice, locale)}</p>
                  <NodeBlock label={t.craftingSectionAction} body={craftLocaleText(shownTree.action, locale)} />
                  <NodeBlock label={t.craftingSectionSkip} body={craftLocaleText(shownTree.skip, locale)} />
                  <NodeBlock label={t.craftingSectionIrreversible} body={craftLocaleText(shownTree.irreversible, locale)} />
                  <NodeBlock label={t.craftingSectionWarning} body={craftLocaleText(shownTree.warning, locale)} />
                </div>
              ) : null}
              augments={decision.socketAugments.map((row) => ({
                key: `${row.socket}-${row.id}`,
                text: `${t.craftingSocketN(row.socket)} · ${locale === "en" ? row.nameEn : row.nameZh} · ${
                  locale === "en" ? row.effectEn : row.effectZh
                }`,
              }))}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

function NodeBlock({ label, body }: { label: string; body: string }) {
  return (
    <p>
      <span className="text-gold-dim">{label} · </span>
      {body}
    </p>
  );
}

function ItemPanel({
  decision,
  sideLabel,
  itemLevelRaw,
  onItemLevel,
  targetSide,
  onTargetSide,
  prefixCount,
  suffixCount,
  onPrefixCount,
  onSuffixCount,
  goodFracture,
  garbageFracture,
  onGoodFracture,
  onGarbageFracture,
  keeper,
  onKeeper,
  tightBudget,
  onTightBudget,
  selected,
  onToggleOwned,
  onToggleHigh,
  families,
  selectedIds,
  others,
  classes,
  onAddOther,
  onRemoveOther,
  prefixCap,
  suffixCap,
}: {
  decision: CraftDecision;
  sideLabel: string;
  itemLevelRaw: string;
  onItemLevel: (value: string) => void;
  targetSide: ModSide | "auto";
  onTargetSide: (value: ModSide | "auto") => void;
  prefixCount: number;
  suffixCount: number;
  onPrefixCount: (value: number) => void;
  onSuffixCount: (value: number) => void;
  goodFracture: boolean;
  garbageFracture: boolean;
  onGoodFracture: (value: boolean) => void;
  onGarbageFracture: (value: boolean) => void;
  keeper: boolean;
  onKeeper: (value: boolean) => void;
  tightBudget: boolean;
  onTightBudget: (value: boolean) => void;
  selected: {
    id: string;
    label: string;
    tierLabel: string | null;
    owned: boolean;
    highTier: boolean;
    locked: boolean;
  }[];
  onToggleOwned: (id: string) => void;
  onToggleHigh: (id: string) => void;
  families: AffixFamily[];
  selectedIds: string[];
  others: Record<string, OtherFlag>;
  classes: { id: string; classification: NonTargetClass }[];
  onAddOther: (id: string, tierIndex: number | null, desecrated: boolean) => void;
  onRemoveOther: (id: string) => void;
  prefixCap: number;
  suffixCap: number;
}) {
  const { locale, t } = useLocale();
  const headline = craftVerdictHeadline(decision, locale);
  const tone =
    decision.verdict === "continue"
      ? "border-include text-include"
      : decision.verdict === "rebase"
        ? "border-exclude text-exclude"
        : "border-gold text-gold";
  const cleanup = decision.cleanup === "none" ? null : CRAFT_CLEANUP_TEXT[decision.cleanup];

  return (
    <section className="mt-6 rounded-sm border border-line bg-panel p-3" aria-labelledby="craft-now-heading">
      <h2 id="craft-now-heading" className="text-sm font-medium text-gold">{t.craftingNowHeading}</h2>
      <p className="mt-1 text-xs text-muted">{t.craftingNowHint}</p>

      <div className={`mt-3 rounded-sm border px-3 py-3 ${tone}`} data-verdict={decision.verdict} aria-live="polite">
        <p className="text-base font-bold">{headline}</p>
        <p className="mt-1 text-xs text-muted">{t.craftingResolvedSide(sideLabel)}</p>
        {cleanup && <p className="mt-2 text-xs text-paper">{craftLocaleText(cleanup, locale)}</p>}
        <p className="mt-3 text-xs text-gold-dim">{t.craftingReasons}</p>
        <ul className="mt-1 space-y-1 text-xs text-paper">
          {decision.reasons.map((reason) => (
            <li key={reason}>{craftLocaleText(CRAFT_REASON_TEXT[reason], locale)}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gold-dim">{t.craftingWarnings}</p>
        <ul className="mt-1 space-y-1 text-xs text-muted">
          {decision.warnings.map((warning) => (
            <li key={warning}>{craftLocaleText(CRAFT_WARNING_TEXT[warning], locale)}</li>
          ))}
        </ul>
        {decision.socketAugments.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-paper">
            {decision.socketAugments.map((row) => (
              <li key={`${row.socket}-${row.id}`}>
                {t.craftingSocketN(row.socket)}
                {" · "}
                {locale === "en" ? row.nameEn : row.nameZh}
                {" · "}
                {locale === "en" ? row.effectEn : row.effectZh}
              </li>
            ))}
          </ul>
        )}
        {tightBudget && <p className="mt-2 text-xs text-gold">{t.craftingBudgetOn}</p>}
      </div>

      <div className="mt-3 grid gap-2">
        <label className="text-xs text-muted">
          {t.craftingItemLevel}
          <input
            inputMode="numeric"
            value={itemLevelRaw}
            onChange={(event) => onItemLevel(event.target.value)}
            placeholder={t.craftingItemLevelHint}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          />
        </label>
        <label className="text-xs text-muted">
          {t.craftingSide}
          <select
            value={targetSide}
            onChange={(event) => onTargetSide(event.target.value as ModSide | "auto")}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          >
            <option value="auto">{t.craftingSideAuto}</option>
            <option value="prefix">{t.craftingSidePrefix}</option>
            <option value="suffix">{t.craftingSideSuffix}</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <CountSelect label={t.craftingPrefixCount} value={prefixCount} max={prefixCap} onChange={onPrefixCount} />
          <CountSelect label={t.craftingSuffixCount} value={suffixCount} max={suffixCap} onChange={onSuffixCount} />
        </div>
        <Check label={t.craftingGoodFracture} checked={goodFracture} onChange={onGoodFracture} />
        <Check label={t.craftingGarbageFracture} checked={garbageFracture} onChange={onGarbageFracture} />
        <p className="text-[11px] text-muted">{t.craftingDesecrationLockHint}</p>
        <Check label={t.craftingKeeper} checked={keeper} onChange={onKeeper} />
        <p className="ml-5 text-[11px] text-muted">{t.craftingKeeperHint}</p>
        <Check label={t.craftingBudget} checked={tightBudget} onChange={onTightBudget} />
      </div>

      <OtherMods
        families={families}
        selectedIds={selectedIds}
        others={others}
        classes={classes}
        onAdd={onAddOther}
        onRemove={onRemoveOther}
      />

      <ul className="mt-3 space-y-2">
        {selected.length === 0 ? (
          <li className="text-xs text-muted">{t.craftingNoOwned}</li>
        ) : (
          selected.map((row) => (
            <li key={row.id} className="rounded-sm border border-line px-2 py-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={row.owned}
                  disabled={row.locked}
                  onChange={() => onToggleOwned(row.id)}
                  aria-label={`${row.label} ${t.craftingOwned}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-paper">{row.label}</p>
                  {row.tierLabel && <p className="text-[11px] text-muted">{row.tierLabel}</p>}
                  {row.locked && <p className="text-[11px] text-gold-dim">{t.craftingDesecrationLock}</p>}
                </div>
              </div>
              {row.owned && (
                <label className="mt-1 ml-5 flex items-center gap-2 text-[11px] text-muted">
                  <input
                    type="checkbox"
                    checked={row.highTier}
                    onChange={() => onToggleHigh(row.id)}
                  />
                  {row.tierLabel ? t.craftingTierMet : t.craftingHighTier}
                </label>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function SocketFilter({
  slotId,
  socketCount,
  socketMax,
  socketPicks,
  onAdd,
  onRemove,
  onPick,
}: {
  slotId: CraftSlotId;
  socketCount: number;
  socketMax: number;
  socketPicks: string[];
  onAdd: () => void;
  onRemove: () => void;
  onPick: (index: number, id: string) => void;
}) {
  const { locale, t } = useLocale();
  const options = useMemo(() => poolAugmentsForSlot(slotId), [slotId]);
  return (
    <section className="mb-4 rounded-sm border border-line bg-panel p-3" aria-label={t.craftingAugment}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gold">{t.craftingAugment}</p>
        <div className="flex gap-1">
          {socketCount > 2 && (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-sm border border-line px-2 py-1 text-[11px] text-muted"
            >
              {t.craftingRemoveSocket}
            </button>
          )}
          {socketCount < socketMax && (
            <button
              type="button"
              onClick={onAdd}
              className="rounded-sm border border-gold/50 px-2 py-1 text-[11px] text-gold"
            >
              {t.craftingAddSocket}
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted">{t.craftingSocketHint}</p>
      {options.length === 0 && <p className="mt-2 text-[11px] text-muted">{t.craftingNoAugment}</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: socketCount }, (_, index) => {
          const blocked = new Set(
            socketPicks.flatMap((id, other) => (
              other !== index && id && options.find((row) => row.id === id)?.limitOne ? [id] : []
            )),
          );
          const available = options.filter((row) => !blocked.has(row.id));
          const current = options.find((row) => row.id === socketPicks[index]);
          return (
            <label key={index} className="text-xs text-muted">
              {t.craftingSocketN(index + 1)}
              <select
                aria-label={t.craftingSocketN(index + 1)}
                value={socketPicks[index] ?? ""}
                onChange={(event) => onPick(index, event.target.value)}
                className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
              >
                <option value="">{t.craftingSocketEmpty}</option>
                {available.map((row) => (
                  <option key={row.id} value={row.id}>
                    {locale === "en" ? row.nameEn : row.nameZh}
                  </option>
                ))}
              </select>
              {current && (
                <span className="mt-1 block text-[11px] text-paper">
                  {locale === "en" ? current.effectEn : current.effectZh}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </section>
  );
}

function classTag(classification: NonTargetClass, labels: {
  acceptable: string;
  bad: string;
  unknown: string;
}): string {
  if (classification === "acceptable") return labels.acceptable;
  if (classification === "bad") return labels.bad;
  return labels.unknown;
}

function OtherMods({
  families,
  selectedIds,
  others,
  classes,
  onAdd,
  onRemove,
}: {
  families: AffixFamily[];
  selectedIds: string[];
  others: Record<string, OtherFlag>;
  classes: { id: string; classification: NonTargetClass }[];
  onAdd: (id: string, tierIndex: number | null, desecrated: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const { locale, t } = useLocale();
  const [draftId, setDraftId] = useState("");
  const [draftTier, setDraftTier] = useState("");
  const [draftDesecrated, setDraftDesecrated] = useState(false);
  const taken = new Set([...selectedIds, ...Object.keys(others)]);
  const available = families.filter((family) => !taken.has(family.id));
  const draft = families.find((family) => family.id === draftId) ?? null;
  const recorded = Object.entries(others).flatMap(([id, flag]) => {
    const family = families.find((row) => row.id === id);
    return family ? [{ id, family, flag }] : [];
  });

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs font-medium text-gold">{t.craftingOtherHeading}</p>
      <p className="mt-1 text-[11px] text-muted">{t.craftingOtherHint}</p>
      <div className="mt-2 grid gap-2">
        <label className="text-xs text-muted">
          {t.craftingOtherAffix}
          <select
            value={draftId}
            onChange={(event) => {
              setDraftId(event.target.value);
              setDraftTier("");
            }}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
          >
            <option value="">{t.craftingOtherAffix}</option>
            {available.map((family) => (
              <option key={family.id} value={family.id}>{effectText(family, locale)}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted">
          {t.craftingOtherTier}
          <select
            value={draftTier}
            disabled={!draft}
            onChange={(event) => setDraftTier(event.target.value)}
            className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold disabled:opacity-50"
          >
            <option value="">{t.craftingOtherTierUnknown}</option>
            {draft && craftTierChoices(draft).map((choice) => (
              <option key={choice.index} value={choice.index}>
                {`T${choice.rank} · iLvL ${choice.level}`}
              </option>
            ))}
          </select>
        </label>
        <Check label={t.craftingOtherDesecrated} checked={draftDesecrated} onChange={setDraftDesecrated} />
        <button
          type="button"
          disabled={!draft}
          onClick={() => {
            if (!draft) return;
            onAdd(draft.id, draftTier === "" ? null : Number(draftTier), draftDesecrated);
            setDraftId("");
            setDraftTier("");
            setDraftDesecrated(false);
          }}
          className="rounded-sm border border-gold/50 px-2 py-1.5 text-xs text-gold disabled:opacity-40"
        >
          {t.craftingOtherAdd}
        </button>
      </div>
      <ul className="mt-2 space-y-2">
        {recorded.length === 0 ? (
          <li className="text-[11px] text-muted">{t.craftingOtherEmpty}</li>
        ) : (
          recorded.map(({ id, family, flag }) => {
            const classification = classes.find((row) => row.id === id)?.classification ?? "unknown";
            const level = flag.tierIndex == null ? null : family.tiers[flag.tierIndex]?.level ?? null;
            return (
              <li key={id} className="rounded-sm border border-line px-2 py-2" data-other={id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-paper">{effectText(family, locale)}</p>
                  <button type="button" className="text-[11px] text-muted" onClick={() => onRemove(id)}>
                    {t.craftingOtherRemove}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  {level == null ? t.craftingOtherTierUnknown : t.craftingModLevel(level)}
                  {flag.desecrated ? ` · ${t.craftingOtherDesecrated}` : ""}
                </p>
                <p className="mt-1 text-[11px] text-gold" data-class={classification}>
                  {classTag(classification, {
                    acceptable: t.craftingWhittleable,
                    bad: t.craftingLevelRisky,
                    unknown: t.craftingLevelUnknown,
                  })}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function CountSelect({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const counts = Array.from({ length: max + 1 }, (_, index) => index);
  return (
    <label className="text-xs text-muted">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-sm border border-line bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-gold"
      >
        {counts.map((count) => (
          <option key={count} value={count}>{count}</option>
        ))}
      </select>
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-xs text-paper">
      <input
        type="checkbox"
        className="mt-0.5"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
