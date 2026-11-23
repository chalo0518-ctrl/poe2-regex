import oracleArt from "../assets/oracle-ascendancy.jpg";
import PassiveTreeCanvas, { passivePositions, weaponPalette } from "./PassiveTreeCanvas.tsx";
import fullNodeRows from "../assets/poe2-main-passive-nodes.json";
import { useEffect, useRef, useState } from "react";
import { type MemorialTree } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

type OverviewNode = [id: string, x: number, y: number, name: string, effect: string, kind: string];
const overviewNodes = fullNodeRows as OverviewNode[];
// Signed connector radii from the 0.5 Oracle tree, keyed by ascending node ID.
const oracleConnectorRadii: Readonly<Record<string, number>> = {
  "5571/47190": 108,
  "25092/34313": -84.6,
  "5571/11335": -84.6,
  "4197/56505": 84.6,
  "378/34313": 108,
  "15275/52374": -84.6,
  "37782/39659": -84.6,
  "11335/42761": 132.2,
  "21284/42761": -84.6,
  "42761/56505": 66.2,
  "39659/42761": -108,
  "25092/42761": -33.5,
  "15275/42761": -49.3,
  "32905/47190": -84.6,
  "378/55135": -84.6,
};
const overviewById = new Map(overviewNodes.map((row) => [row[0], row]));

export default function MemorialTreeView({ tree, title, showOverview = false }: { tree?: MemorialTree; title: string; showOverview?: boolean }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const { snapshot, weaponSet } = useShowcase();
  const showOracle = !showOverview && snapshot.id === "ruoa-cetacea" && Boolean(tree?.nodes.some((entry) => entry.nameEn === "Oracle"));
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState("");
  const [classic, setClassic] = useState(false);
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
  const sharedCount = nodes.filter((entry) => entry.allocated && !entry.weaponSets?.length).length;
  const setCount = (set: number) => nodes.filter((entry) => entry.allocated && entry.weaponSets?.includes(set)).length;
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
  const insetX = overview.x + overview.width / 2;
  const insetY = overview.y + overview.height / 2;
  const insetPoint = (entry: { x: number; y: number }) => [
    (entry.x - portrait.x) * insetScale - insetRadius + insetX,
    (entry.y - portrait.y) * insetScale - insetRadius,
  ] as const;
  const ascendancyById = new Map(embedded?.nodes.map((entry) => [entry.id, entry]));
  const markRadius = (id: string) => ["5571", "32905", "34313", "52374"].includes(id) ? 7 : 4;
  const inset = embedded?.nodes.length ? {
    x: insetX, y: insetY, radius: insetRadius,
    marks: embedded.nodes.filter((entry) => entry.allocated).map((entry) => {
      const [x, y] = insetPoint(entry);
      return { x, y, radius: markRadius(entry.id) };
    }),
    links: embedded.edges.flatMap(([from, to]) => {
      const start = ascendancyById.get(from);
      const end = ascendancyById.get(to);
      if (!start?.allocated || !end?.allocated) return [];
      const [ax, ay] = insetPoint(start);
      const [bx, by] = insetPoint(end);
      const ordered = Number(from) < Number(to);
      const signedRadius = (oracleConnectorRadii[ordered ? from + "/" + to : to + "/" + from] ?? 0) * (ordered ? 1 : -1);
      const radius = Math.abs(signedRadius) * insetScale;
      const segment = radius && Math.hypot(bx - ax, by - ay) < 2 * radius
        ? ` A${radius} ${radius} 0 0 ${signedRadius > 0 ? 0 : 1} ${bx} ${by}`
        : ` L${bx} ${by}`;
      return [`M${ax} ${ay}${segment}`];
    }),
  } : undefined;
  const allocationColor = (sets?: number[]) => sets?.length === 1 ? (sets[0] === 1 ? weaponPalette.one : weaponPalette.two) : "#e5bf74";
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
            {showOverview && <button type="button" aria-pressed={classic} onClick={() => setClassic((active) => !active)} className="text-gold underline">
              {english ? (classic ? "Simplified lines" : "PoB2 icons") : (classic ? "簡潔線條" : "PoB2 圖示")}
            </button>}
            <button aria-label={english ? "Zoom in" : "放大"} onClick={() => setScale((value) => Math.min(5, value * 1.25))}>＋</button>
            <button aria-label={english ? "Zoom out" : "縮小"} onClick={() => setScale((value) => Math.max(.2, value / 1.25))}>−</button>
            <button onClick={() => { setPosition({ x: 0, y: 0 }); setScale(1); setFitAll(true); }}>{english ? "Reset view" : "回到全圖"}</button>
          </div>
          {showOverview && (
            <div className="memorial-tree-legend" aria-label={english ? "Tree legend" : "天賦圖例"}>
              <span style={{ color: "#e5bf74" }}>{english ? "Shared" : "共用"} · {sharedCount}</span>
              <span style={{ color: weaponPalette.one }}>{english ? "Weapon set I" : "武器組 I"} · {setCount(1)}</span>
              <span style={{ color: weaponPalette.two }}>{english ? "Weapon set II" : "武器組 II"} · {setCount(2)}</span>
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
            {showOverview && tree && <PassiveTreeCanvas tree={tree} weaponSet={weaponSet} classic={classic} ascendancy={inset}
              hasKeystoneRadius={Boolean(snapshot.ascendancyTree?.nodes.some((entry) => entry.id === "32905" && entry.allocated))}
              x={x} y={y} width={width} height={height}
              offsetX={position.x + centerX * (1 - scale)} offsetY={position.y + centerY * (1 - scale)} scale={scale} />}
            <g ref={layer} transform={`translate(${position.x + (x + width / 2) * (1 - scale)} ${position.y + (y + height / 2) * (1 - scale)}) scale(${scale})`}>
              {embedded?.nodes.length ? (
                <g aria-label={english ? "Ascendancy tree" : "昇華天賦樹"} role="group">
                  {embedded.nodes.map((entry) => {
                    const [cx, cy] = insetPoint(entry);
                    const radius = markRadius(entry.id);
                    return <circle key={entry.id} cx={cx} cy={cy} r={radius} fill="transparent"
                      stroke="transparent"
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
              {nodes.filter((entry) => !showOverview || passivePositions[entry.id]).map((entry) => <circle key={entry.id} cx={showOverview ? passivePositions[entry.id][0] : entry.x} cy={showOverview ? passivePositions[entry.id][1] : entry.y} r={showOverview ? (classic ? (entry.allocated ? 5.4 : 3.2) : [5.4, 8, 12, 7.6][passivePositions[entry.id][3]]) : showOracle || entry.allocated ? 8 : 5.5}
                data-large-passive={showOverview && [1, 2].includes(passivePositions[entry.id][3]) ? "" : undefined}
                data-allocation={entry.allocated ? entry.weaponSets?.length === 1 ? entry.weaponSets[0] : "shared" : undefined}
                vectorEffect="non-scaling-stroke" fill={showOracle || showOverview ? "transparent" : entry.allocated ? allocationColor(entry.weaponSets) : "#656052"}
                role="button" tabIndex={0} aria-label={english ? entry.nameEn : entry.nameZh}
                onClick={() => setSelected(entry.id)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(entry.id); } }}><title>{(english ? entry.nameEn : entry.nameZh) + "\n" + (entry.effectEn ?? "")}</title></circle>)}
            </g>
          </svg>
          {extra && !node && <p><strong>{extra[3]}</strong> {extra[4]}</p>}
          {node && <p>
            <strong>{english ? node.nameEn : node.nameZh}</strong>{" "}
            {showOverview && node.allocated && (
              <span className="text-gold">
                {node.weaponSets?.length
                  ? node.weaponSets.map((set) => (english ? "Weapon set " : "武器組 ") + (set === 1 ? "I" : "II")).join("／")
                  : english ? "Shared allocation" : "共用配點"}
              </span>
            )}{" "}
            {english ? node.effectEn : node.effectZh || node.effectEn}
          </p>}
        </>
      )}
    </section>
  );
}
