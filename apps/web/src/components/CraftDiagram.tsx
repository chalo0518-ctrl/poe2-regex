import { CRAFT_DIAGRAM, craftLocaleText, type CraftDiagramNodeId, type Localized } from "@poe2-regex/data";
import type { ReactNode } from "react";
import { useLocale } from "../i18n.tsx";

const BRANCH: Record<Exclude<CraftDiagramNodeId, "base">, Localized> = {
  "stop-base": { zhHant: "等級不足", en: "Level too low" },
  fill: { zhHant: "等級夠，繼續", en: "Level is high enough" },
  "stop-full": { zhHant: "目標側已滿", en: "Target side is full" },
  desecrate: { zhHant: "還能做", en: "Still room to craft" },
  "stop-fracture": { zhHant: "破裂在垃圾", en: "Fracture on garbage" },
  essence: { zhHant: "迴圈成立", en: "Overwrite loop holds" },
  omen: { zhHant: "要清非目標", en: "Clear a non-target" },
  finish: { zhHant: "打中目標", en: "Hit a target" },
  whittle: { zhHant: "最低是非目標", en: "Lowest is not a target" },
  "side-annul": { zhHant: "只有一側能清", en: "Only one side is safe" },
  light: { zhHant: "褻瀆不是目標", en: "Desecrated mod is not a target" },
  "stop-omen": { zhHant: "會打到目標", en: "Would hit a target" },
  sockets: { zhHant: "孔數高過上限", en: "Above the normal maximum" },
  "keep-exceptional": { zhHant: "留下這件", en: "Keep this base" },
};

type TreeNode = {
  id: CraftDiagramNodeId;
  children?: TreeNode[];
};

/** Root at the top. Every child is stacked under its parent, never beside it. */
const TREE: TreeNode = {
  id: "base",
  children: [
    { id: "stop-base" },
    {
      id: "fill",
      children: [
        { id: "stop-full" },
        { id: "sockets", children: [{ id: "keep-exceptional" }] },
        {
          id: "desecrate",
          children: [
            { id: "stop-fracture" },
            { id: "essence" },
            {
              id: "omen",
              children: [
                { id: "whittle" },
                { id: "side-annul" },
                { id: "light" },
                { id: "stop-omen" },
              ],
            },
            { id: "finish" },
          ],
        },
      ],
    },
  ],
};

function edgeOn(path: readonly CraftDiagramNodeId[], from: CraftDiagramNodeId, to: CraftDiagramNodeId): boolean {
  const index = path.indexOf(from);
  return index >= 0 && path[index + 1] === to;
}

function NodeButton({
  id,
  path,
  selected,
  onSelect,
}: {
  id: CraftDiagramNodeId;
  path: readonly CraftDiagramNodeId[];
  selected: boolean;
  onSelect?: (id: CraftDiagramNodeId) => void;
}) {
  const { locale } = useLocale();
  const node = CRAFT_DIAGRAM.find((row) => row.id === id);
  if (!node) return null;
  const active = path.includes(id);
  return (
    <button
      type="button"
      data-node={id}
      data-active={active ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      onClick={() => onSelect?.(id)}
      className={`w-full rounded-sm border px-2 py-1.5 text-left ${
        active ? "border-gold bg-gold/15" : "border-line bg-ink"
      } ${selected ? "ring-1 ring-paper" : ""}`}
    >
      <p className="text-[11px] font-medium leading-tight text-gold">{craftLocaleText(node.title, locale)}</p>
      <p className="mt-1 text-[10px] leading-snug text-paper">{craftLocaleText(node.choice, locale)}</p>
    </button>
  );
}

function VerticalBranch({
  node,
  parent,
  path,
  selectedId,
  onSelect,
  detail,
}: {
  node: TreeNode;
  parent: CraftDiagramNodeId | null;
  path: readonly CraftDiagramNodeId[];
  selectedId?: CraftDiagramNodeId;
  onSelect?: (id: CraftDiagramNodeId) => void;
  detail?: ReactNode;
}) {
  const { locale } = useLocale();
  const activeEdge = parent != null && edgeOn(path, parent, node.id);
  const selected = selectedId === node.id;
  return (
    <div className="min-w-0">
      {parent != null && (
        <div
          data-edge={`${parent}-${node.id}`}
          data-active={activeEdge ? "true" : "false"}
          className="flex items-stretch gap-2 py-1 pl-1"
        >
          <div className={`w-px shrink-0 ${activeEdge ? "bg-gold" : "bg-line"}`} />
          <p className={`text-[10px] leading-tight ${activeEdge ? "text-gold" : "text-muted"}`}>
            {craftLocaleText(BRANCH[node.id as Exclude<CraftDiagramNodeId, "base">], locale)}
          </p>
        </div>
      )}
      <NodeButton id={node.id} path={path} selected={selected} onSelect={onSelect} />
      {selected && detail}
      {node.children && node.children.length > 0 && (
        <div className={`mt-1 ml-3 border-l pl-2 ${path.includes(node.id) ? "border-gold/70" : "border-line"}`}>
          {node.children.map((child) => (
            <VerticalBranch
              key={child.id}
              node={child}
              parent={node.id}
              path={path}
              selectedId={selectedId}
              onSelect={onSelect}
              detail={detail}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CraftDiagram({
  path,
  augments = [],
  selectedId,
  onSelect,
  detail,
}: {
  path: readonly CraftDiagramNodeId[];
  augments?: { key: string; text: string }[];
  selectedId?: CraftDiagramNodeId;
  onSelect?: (id: CraftDiagramNodeId) => void;
  detail?: ReactNode;
}) {
  const { locale } = useLocale();
  const titles = path.map((id) => {
    const node = CRAFT_DIAGRAM.find((row) => row.id === id);
    return node ? craftLocaleText(node.title, locale) : id;
  });

  return (
    <div data-craft-diagram data-orientation="vertical">
      <p className="mb-3 text-xs text-gold" data-craft-path>
        {titles.join(" ↓ ")}
      </p>
      {augments.length > 0 && (
        <ul className="mb-3 space-y-1 text-xs text-paper" data-socket-augments>
          {augments.map((row) => (
            <li key={row.key}>{row.text}</li>
          ))}
        </ul>
      )}
      <VerticalBranch
        node={TREE}
        parent={null}
        path={path}
        selectedId={selectedId}
        onSelect={onSelect}
        detail={detail}
      />
    </div>
  );
}
