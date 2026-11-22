import oracleArt from "../assets/oracle-ascendancy.jpg";
import fullTree from "../assets/poe2-main-passive-overview.svg";
import { useState } from "react";
import { type MemorialTree } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

export default function MemorialTreeView({ tree, title, showOverview = false }: { tree?: MemorialTree; title: string; showOverview?: boolean }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const { snapshot, weaponSet } = useShowcase();
  const showOracle = !showOverview && snapshot.id === "ruoa-cetacea" && Boolean(tree?.nodes.some((entry) => entry.nameEn === "Oracle"));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState("");
  const nodes = tree?.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const node = byId.get(selected);
  const isAllocated = (entry: (typeof nodes)[number]) => entry.allocated && (!entry.weaponSets?.length || entry.weaponSets.includes(weaponSet));
  const allocated = nodes.filter(isAllocated);
  const [fitAll, setFitAll] = useState(showOverview);
  const focus = fitAll || !allocated.length ? nodes : allocated;
  const extent = (axis: "x" | "y") => {
    const values = focus.map((entry) => entry[axis]);
    const min = Math.min(...values) - 40;
    return values.length ? [min, Math.max(...values) + 40 - min] : [0, 1];
  };
  const overview = { x: -1298, y: -1276, width: 2602, height: 2581 };
  const portrait = { x: -1564.9, y: -790, width: 298.8, height: 297.9 };
  const jewelIds = new Set(["21984", "7960"]);
  const keystoneIds = new Set(["11230", "33979", "42680", "45202", "45918", "46742", "49363", "49547", "55048", "57513"]);
  const grantsKeystoneRadius = snapshot.ascendancyTree?.nodes.some((entry) => entry.id === "32905" && entry.allocated);
  const rings = showOverview ? nodes.flatMap((entry) => {
    if (!isAllocated(entry)) return [];
    if (jewelIds.has(entry.id)) return [{ entry, radius: 180, jewel: true }];
    if (grantsKeystoneRadius && keystoneIds.has(entry.id)) return [{ entry, radius: 138, jewel: false }];
    return [];
  }) : [];
  const allocationColor = (sets?: number[]) => sets?.length === 1 ? (sets[0] === 1 ? "#eb6a63" : "#75c98b") : "#e5bf74";
  const [x, width] = showOracle ? [portrait.x, portrait.width] : showOverview && fitAll ? [overview.x, overview.width] : extent("x");
  const [y, height] = showOracle ? [portrait.y, portrait.height] : showOverview && fitAll ? [overview.y, overview.height] : extent("y");
  return (
    <section className="memorial-tree" data-overview={showOverview} data-oracle={showOracle} aria-label={title}>
      <h3>{title}</h3>
      {!nodes.length ? <p>{english ? "Not recorded in this season snapshot." : "本季快照未記錄。"}</p> : (
        <>
          <div className="memorial-tree-controls">
            <button aria-label={english ? "Zoom in" : "放大"} onClick={() => setScale((value) => Math.min(5, value * 1.25))}>＋</button>
            <button aria-label={english ? "Zoom out" : "縮小"} onClick={() => setScale((value) => Math.max(.2, value / 1.25))}>−</button>
            <button onClick={() => { setPosition({ x: 0, y: 0 }); setScale(1); setFitAll(true); }}>{english ? "Reset view" : "回到全圖"}</button>
          </div>
          {showOverview && (
            <div className="memorial-tree-legend" aria-label={english ? "Tree legend" : "天賦圖例"}>
              <span style={{ color: "#e5bf74" }}>{english ? "Shared" : "共用"}</span>
              <span style={{ color: "#eb6a63" }}>{english ? "Weapon set I" : "武器組 I"}</span>
              <span style={{ color: "#75c98b" }}>{english ? "Weapon set II" : "武器組 II"}</span>
              <span style={{ color: "#87b6ff" }}>{english ? "Jewel radius" : "珠寶範圍"}</span>
              <span style={{ color: "#656fc4" }}>{english ? "Keystone radius" : "核心天賦範圍"}</span>
            </div>
          )}
          <svg viewBox={`${x} ${y} ${width} ${height}`}
            aria-label={title}
            onPointerDown={(event) => {
              if (event.button === 0 && event.target === event.currentTarget) event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const ratio = event.currentTarget.getScreenCTM()?.a || 1;
              setPosition((previous) => ({ x: previous.x + event.movementX / ratio, y: previous.y + event.movementY / ratio }));
            }}
          >
            <g transform={`translate(${position.x + (x + width / 2) * (1 - scale)} ${position.y + (y + height / 2) * (1 - scale)}) scale(${scale})`}>
              {showOverview && <image href={fullTree} {...overview} pointerEvents="none" />}
              {showOracle && <image href={oracleArt} {...portrait} pointerEvents="none" />}
              {rings.map(({ entry, radius, jewel }) => (
                <circle key={entry.id} cx={entry.x} cy={entry.y} r={radius} fill={jewel ? "#4285ff10" : "#6768ff09"} stroke={jewel ? "#88b6ff" : "#656fc4"} strokeWidth={jewel ? 5 : 3.5} pointerEvents="none" />
              ))}
              {!showOracle && tree?.edges.map(([first, second]) => {
                const a = byId.get(first);
                const b = byId.get(second);
                const matching = a?.weaponSets?.length && b?.weaponSets?.length ? a.weaponSets.filter((set) => b.weaponSets?.includes(set)) : a?.weaponSets?.length ? a.weaponSets : b?.weaponSets;
                const visible = a?.allocated && b?.allocated && !(a.weaponSets?.length && b.weaponSets?.length && !matching?.length);
                return a && b && <line key={first + "/" + second} x1={a.x} x2={b.x} y1={a.y} y2={b.y} stroke={visible ? allocationColor(matching) : "#454033"} opacity={visible && matching?.length && !matching.includes(weaponSet) ? .72 : 1} strokeWidth={visible ? 4 : 2.4} pointerEvents="none" />;
              })}
              {nodes.map((entry) => <circle key={entry.id} cx={entry.x} cy={entry.y} r={showOracle ? 8 : entry.allocated ? 8 : 5.5} fill={showOracle ? "transparent" : entry.allocated ? allocationColor(entry.weaponSets) : "#656052"}
                role="button" tabIndex={0} aria-label={english ? entry.nameEn : entry.nameZh}
                onClick={() => setSelected(entry.id)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(entry.id); } }}><title>{(english ? entry.nameEn : entry.nameZh) + "\n" + (entry.effectEn ?? "")}</title></circle>)}
            </g>
          </svg>
          {node && <p><strong>{english ? node.nameEn : node.nameZh}</strong> {english ? node.effectEn : node.effectZh || node.effectEn}</p>}
        </>
      )}
    </section>
  );
}
