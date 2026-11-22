import { useState } from "react";
import { type MemorialTree } from "@poe2-regex/data";
import { useShowcase } from "../pages/showcaseState.tsx";
import { useLocale } from "../i18n.tsx";

export default function MemorialTreeView({ tree, title }: { tree?: MemorialTree; title: string }) {
  const { locale } = useLocale();
  const english = locale === "en";
  const { weaponSet } = useShowcase();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [selected, setSelected] = useState("");
  const nodes = tree?.nodes ?? [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const node = byId.get(selected);
  const isAllocated = (entry: (typeof nodes)[number]) => entry.allocated && (!entry.weaponSets?.length || entry.weaponSets.includes(weaponSet));
  const allocated = nodes.filter(isAllocated);
  const [fitAll, setFitAll] = useState(false);
  const focus = fitAll || !allocated.length ? nodes : allocated;
  const extent = (axis: "x" | "y") => {
    const values = focus.map((entry) => entry[axis]);
    const min = Math.min(...values) - 40;
    return values.length ? [min, Math.max(...values) + 40 - min] : [0, 1];
  };
  const [x, width] = extent("x");
  const [y, height] = extent("y");
  return (
    <section className="memorial-tree" aria-label={title}>
      <h3>{title}</h3>
      {!nodes.length ? <p>{english ? "Not recorded in this season snapshot." : "本季快照未記錄。"}</p> : (
        <>
          <div className="memorial-tree-controls">
            <button aria-label={english ? "Zoom in" : "放大"} onClick={() => setScale((value) => Math.min(5, value * 1.25))}>＋</button>
            <button aria-label={english ? "Zoom out" : "縮小"} onClick={() => setScale((value) => Math.max(.2, value / 1.25))}>−</button>
            <button onClick={() => { setPosition({ x: 0, y: 0 }); setScale(1); setFitAll(true); }}>{english ? "Reset view" : "回到全圖"}</button>
          </div>
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
              {tree?.edges.map(([first, second]) => {
                const a = byId.get(first);
                const b = byId.get(second);
                return a && b && <line key={first + "/" + second} x1={a.x} x2={b.x} y1={a.y} y2={b.y} stroke={isAllocated(a) && isAllocated(b) ? "#ddb76d" : "#524e45"} />;
              })}
              {nodes.map((entry) => <circle key={entry.id} cx={entry.x} cy={entry.y} r="7" fill={isAllocated(entry) ? "#ddb76d" : "#524e45"}
                role="button" tabIndex={0} aria-label={english ? entry.nameEn : entry.nameZh}
                onClick={() => setSelected(entry.id)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(entry.id); } }} />)}
            </g>
          </svg>
          {node && <p><strong>{english ? node.nameEn : node.nameZh}</strong> {english ? node.effectEn : node.effectZh || node.effectEn}</p>}
        </>
      )}
    </section>
  );
}
