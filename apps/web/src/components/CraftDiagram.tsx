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
};

function edgeOn(path: readonly CraftDiagramNodeId[], from: CraftDiagramNodeId, to: CraftDiagramNodeId): boolean {
  const index = path.indexOf(from);
  return index >= 0 && path[index + 1] === to;
}

function Node({ id, path }: { id: CraftDiagramNodeId; path: readonly CraftDiagramNodeId[] }) {
  const { locale } = useLocale();
  const node = CRAFT_DIAGRAM.find((row) => row.id === id);
  if (!node) return null;
  const active = path.includes(id);
  return (
    <div
      data-node={id}
      data-active={active ? "true" : "false"}
      className={`w-[8.25rem] rounded-sm border px-1.5 py-1.5 text-center ${
        active ? "border-gold bg-gold/15" : "border-line bg-panel"
      }`}
    >
      <p className="text-[11px] font-medium leading-tight text-gold">{craftLocaleText(node.title, locale)}</p>
      <p className="mt-1 text-[10px] leading-snug text-paper">{craftLocaleText(node.choice, locale)}</p>
    </div>
  );
}

function Arm({
  from,
  to,
  path,
  place,
  children,
}: {
  from: CraftDiagramNodeId;
  to: Exclude<CraftDiagramNodeId, "base">;
  path: readonly CraftDiagramNodeId[];
  place: "first" | "mid" | "last";
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const active = edgeOn(path, from, to);
  const bar =
    place === "first"
      ? "before:left-1/2 before:right-0"
      : place === "last"
        ? "before:left-0 before:right-1/2"
        : "before:inset-x-0";
  return (
    <div
      data-edge={`${from}-${to}`}
      data-active={active ? "true" : "false"}
      className={`relative flex flex-col items-center px-1 before:absolute before:top-0 before:h-px ${bar} ${
        active ? "before:bg-gold" : "before:bg-line"
      }`}
    >
      <div className={`h-3 w-px ${active ? "bg-gold" : "bg-line"}`} />
      <p className={`mb-1 w-[7.5rem] text-center text-[10px] leading-tight ${active ? "text-gold" : "text-muted"}`}>
        {craftLocaleText(BRANCH[to], locale)}
      </p>
      {children}
    </div>
  );
}

function Split({ children }: { children: ReactNode }) {
  return <div className="flex items-start justify-center">{children}</div>;
}

export function CraftDiagram({ path }: { path: readonly CraftDiagramNodeId[] }) {
  const { locale } = useLocale();
  const titles = path.map((id) => {
    const node = CRAFT_DIAGRAM.find((row) => row.id === id);
    return node ? craftLocaleText(node.title, locale) : id;
  });

  return (
    <div className="overflow-x-auto" data-craft-diagram>
      <p className="mb-3 text-xs text-gold" data-craft-path>
        {titles.join(" → ")}
      </p>
      <div className="flex w-max min-w-[72rem] flex-col items-center pb-3">
        <Node id="base" path={path} />
        <Split>
          <Arm from="base" to="stop-base" path={path} place="first">
            <Node id="stop-base" path={path} />
          </Arm>
          <Arm from="base" to="fill" path={path} place="last">
            <Node id="fill" path={path} />
            <Split>
              <Arm from="fill" to="stop-full" path={path} place="first">
                <Node id="stop-full" path={path} />
              </Arm>
              <Arm from="fill" to="desecrate" path={path} place="last">
                <Node id="desecrate" path={path} />
                <Split>
                  <Arm from="desecrate" to="stop-fracture" path={path} place="first">
                    <Node id="stop-fracture" path={path} />
                  </Arm>
                  <Arm from="desecrate" to="essence" path={path} place="mid">
                    <Node id="essence" path={path} />
                  </Arm>
                  <Arm from="desecrate" to="omen" path={path} place="mid">
                    <Node id="omen" path={path} />
                    <Split>
                      <Arm from="omen" to="whittle" path={path} place="first">
                        <Node id="whittle" path={path} />
                      </Arm>
                      <Arm from="omen" to="side-annul" path={path} place="mid">
                        <Node id="side-annul" path={path} />
                      </Arm>
                      <Arm from="omen" to="light" path={path} place="mid">
                        <Node id="light" path={path} />
                      </Arm>
                      <Arm from="omen" to="stop-omen" path={path} place="last">
                        <Node id="stop-omen" path={path} />
                      </Arm>
                    </Split>
                  </Arm>
                  <Arm from="desecrate" to="finish" path={path} place="last">
                    <Node id="finish" path={path} />
                  </Arm>
                </Split>
              </Arm>
            </Split>
          </Arm>
        </Split>
      </div>
    </div>
  );
}
