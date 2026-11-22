import oracleArt from "../assets/oracle-ascendancy.jpg";
import PassiveTreeCanvas, { passivePositions } from "./PassiveTreeCanvas.tsx";
import fullNodeRows from "../assets/poe2-main-passive-nodes.json";
import { useEffect, useId, useRef, useState } from "react";
import { type MemorialTree } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

type OverviewNode = [id: string, x: number, y: number, name: string, effect: string, kind: string];
const overviewNodes = fullNodeRows as OverviewNode[];
const overviewById = new Map(overviewNodes.map((row) => [row[0], row]));

export default function MemorialTreeView({ tree, title, showOverview = false }: { tree?: MemorialTree; title: string; showOverview?: boolean }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const { snapshot, weaponSet } = useShowcase();
  const showOracle = !showOverview && snapshot.id === "ruoa-cetacea" && Boolean(tree?.nodes.some((entry) => entry.nameEn === "Oracle"));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState("");
  const ascendancyClip = useId();
  const embedded = showOverview ? snapshot.ascendancyTree : undefined;
  const viewport = useRef<SVGSVGElement>(null);
  const layer = useRef<SVGGElement>(null);
  const didPan = useRef(false);
  const nodes = tree?.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const node = byId.get(selected) ?? embedded?.nodes.find((entry) => entry.id === selected);
  const extra = showOverview ? overviewById.get(selected) : undefined;
  const isAllocated = (entry: (typeof nodes)[number]) => entry.allocated && (!entry.weaponSets?.length || entry.weaponSets.includes(weaponSet));
  const allocated = nodes.filter(isAllocated);
  const [fitAll, setFitAll] = useState(showOverview);
  const focus = fitAll || !allocated.length ? nodes : allocated;
  const extent = (axis: "x" | "y") => {
    const values = focus.map((entry) => entry[axis]);
    const min = Math.min(...values) - 40;
    return values.length ? [min, Math.max(...values) + 40 - min] : [0, 1];
  };
  const overview = { x: -1357, y: -1317, width: 2673, height: 2650 };
  const portrait = { x: -1564.9, y: -790, width: 298.8, height: 297.9 };
  const insetScale = .72;
  const insetRadius = portrait.width * insetScale / 2;
  const allocationColor = (sets?: number[]) => sets?.length === 1 ? (sets[0] === 1 ? "#eb6a63" : "#75c98b") : "#e5bf74";
  const [x, width] = showOracle ? [portrait.x, portrait.width] : showOverview && fitAll ? [overview.x, overview.width] : extent("x");
  const [y, height] = showOracle ? [portrait.y, portrait.height] : showOverview && fitAll ? [overview.y, overview.height] : extent("y");
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  useEffect(() => {
    const svg = viewport.current;
    if (!svg) return;
    function zoom(event: WheelEvent) {
      const matrix = svg?.getScreenCTM();
      if (!matrix || !event.deltaY) return;
      event.preventDefault();
      const cursor = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      const next = Math.max(.2, Math.min(showOverview ? 12 : 5, scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15)));
      if (next === scale) return;
      const ratio = 1 - next / scale;
      setPosition(({ x, y }) => ({
        x: x + (cursor.x - centerX - x) * ratio,
        y: y + (cursor.y - centerY - y) * ratio,
      }));
      setScale(next);
    }
    svg.addEventListener("wheel", zoom, { passive: false });
    return () => svg.removeEventListener("wheel", zoom);
  }, [scale, centerX, centerY, nodes.length, showOverview]);
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
          <svg ref={viewport} viewBox={`${x} ${y} ${width} ${height}`}
            aria-label={title}
            onPointerDown={(event) => {
              didPan.current = false;
              if (event.button === 0 && event.target === event.currentTarget) event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              if (event.movementX || event.movementY) didPan.current = true;
              const ratio = event.currentTarget.getScreenCTM()?.a || 1;
              setPosition((previous) => ({ x: previous.x + event.movementX / ratio, y: previous.y + event.movementY / ratio }));
            }}
            onClick={(event) => {
              if (event.target !== event.currentTarget || !showOverview || didPan.current) return;
              const matrix = layer.current?.getScreenCTM();
              if (!matrix) return;
              const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
              let closest: OverviewNode | undefined;
              let distance = Math.max(9, 7 / Math.abs(matrix.a));
              for (const row of overviewNodes) {
                const graphPoint = passivePositions[row[0]];
                if (!graphPoint) continue;
                const next = Math.hypot(graphPoint[0] - point.x, graphPoint[1] - point.y);
                if (next < distance) { closest = row; distance = next; }
              }
              if (closest) setSelected(closest[0]);
            }}
          >
            {showOverview && tree && <PassiveTreeCanvas tree={tree} weaponSet={weaponSet}
              hasKeystoneRadius={Boolean(snapshot.ascendancyTree?.nodes.some((entry) => entry.id === "32905" && entry.allocated))}
              x={x} y={y} width={width} height={height}
              offsetX={position.x + centerX * (1 - scale)} offsetY={position.y + centerY * (1 - scale)} scale={scale} />}
            <g ref={layer} transform={`translate(${position.x + (x + width / 2) * (1 - scale)} ${position.y + (y + height / 2) * (1 - scale)}) scale(${scale})`}>
              {embedded?.nodes.length ? (
                <g aria-label={english ? "Ascendancy tree" : "昇華天賦樹"} role="group">
                  <defs><clipPath id={ascendancyClip}><circle r={insetRadius} /></clipPath></defs>
                  <circle r={insetRadius + 1.5} fill="#0c0b0a" stroke="#997948" strokeWidth="2" pointerEvents="none" />
                  <image href={oracleArt} x={-insetRadius} y={-insetRadius} width={insetRadius * 2} height={insetRadius * 2}
                    clipPath={`url(#${ascendancyClip})`} pointerEvents="none" />
                  {embedded.nodes.map((entry) => {
                    const cx = (entry.x - portrait.x) * insetScale - insetRadius;
                    const cy = (entry.y - portrait.y) * insetScale - insetRadius;
                    const radius = ["5571", "32905", "34313", "52374"].includes(entry.id) ? 7 : 4;
                    return <circle key={entry.id} cx={cx} cy={cy} r={radius} fill="transparent"
                      stroke={entry.allocated ? "#ffe1a1" : "transparent"} strokeWidth="1.1"
                      role="button" tabIndex={0} aria-label={english ? entry.nameEn : entry.nameZh}
                      onClick={() => setSelected(entry.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(entry.id); }
                      }}><title>{entry.nameEn}</title></circle>;
                  })}
                </g>
              ) : null}
              {showOracle && <image href={oracleArt} {...portrait} pointerEvents="none" />}
              {!showOracle && !showOverview && tree?.edges.map(([first, second]) => {
                const a = byId.get(first);
                const b = byId.get(second);
                const matching = a?.weaponSets?.length && b?.weaponSets?.length ? a.weaponSets.filter((set) => b.weaponSets?.includes(set)) : a?.weaponSets?.length ? a.weaponSets : b?.weaponSets;
                const visible = a?.allocated && b?.allocated && !(a.weaponSets?.length && b.weaponSets?.length && !matching?.length);
                return a && b && <line key={first + "/" + second} x1={a.x} x2={b.x} y1={a.y} y2={b.y} stroke={visible ? allocationColor(matching) : "#454033"} opacity={visible && matching?.length && !matching.includes(weaponSet) ? .72 : 1} strokeWidth={visible ? 4 : 2.4} pointerEvents="none" />;
              })}
              {showOracle && allocated.map((entry) => (
                <circle key={"allocated-" + entry.id} cx={entry.x} cy={entry.y}
                  r={["5571", "32905", "34313", "52374"].includes(entry.id) ? 10 : 5.5}
                  fill="none" stroke="#ffe1a1" strokeWidth=".9" pointerEvents="none" />
              ))}
              {nodes.filter((entry) => !showOverview || passivePositions[entry.id]).map((entry) => <circle key={entry.id} cx={showOverview ? passivePositions[entry.id][0] : entry.x} cy={showOverview ? passivePositions[entry.id][1] : entry.y} r={showOracle ? 8 : entry.allocated ? 8 : 5.5} fill={showOracle || showOverview ? "transparent" : entry.allocated ? allocationColor(entry.weaponSets) : "#656052"}
                role="button" tabIndex={0} aria-label={english ? entry.nameEn : entry.nameZh}
                onClick={() => setSelected(entry.id)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(entry.id); } }}><title>{(english ? entry.nameEn : entry.nameZh) + "\n" + (entry.effectEn ?? "")}</title></circle>)}
            </g>
          </svg>
          {extra && !node && <p><strong>{extra[3]}</strong> {extra[4]}</p>}
          {node && <p><strong>{english ? node.nameEn : node.nameZh}</strong> {english ? node.effectEn : node.effectZh || node.effectEn}</p>}
        </>
      )}
    </section>
  );
}
