import { useEffect, useRef } from "react";
import type { MemorialTree } from "@poe2-regex/data";
import atlas0 from "../assets/passive-atlas-0.webp";
import atlas1 from "../assets/passive-atlas-1.webp";
import atlas2 from "../assets/passive-atlas-2.webp";
import passive from "../assets/passive-hd.json";

type Point = [x: number, y: number, icon: number, kind: number];
type Edge = [from: string, to: string, signedRadius: number];
const graph: Record<string, Point> = Object.fromEntries(Object.entries(passive.nodes).map(([id, [x, y, icon, kind]]) => [id, [x, y, icon, kind]]));
export const passivePositions = graph;
const nodes = Object.entries(graph);
const edges: Edge[] = passive.edges.map(([from, to, radius]) => [String(from), String(to), Number(radius)]);
const atlasUrls = [atlas0, atlas1, atlas2];
const keystones = new Set(["11230", "33979", "42680", "45202", "45918", "46742", "49363", "49547", "55048", "57513"]);
const jewels = new Set(["21984", "7960"]);

type Props = {
  tree: MemorialTree;
  weaponSet: number;
  classic: boolean;
  hasKeystoneRadius: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  scale: number;
};

export default function PassiveTreeCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const atlases = useRef<HTMLImageElement[]>([]);
  const redraw = useRef<() => void>(() => {});
  redraw.current = () => {
    const element = canvas.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const density = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * density);
    const h = Math.round(rect.height * density);
    if (element.width !== w) element.width = w;
    if (element.height !== h) element.height = h;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.resetTransform();
    ctx.clearRect(0, 0, w, h);
    const sx = w / props.width;
    const sy = h / props.height;
    ctx.setTransform(sx * props.scale, 0, 0, sy * props.scale, (props.offsetX - props.x) * sx, (props.offsetY - props.y) * sy);
    const left = (props.x - props.offsetX) / props.scale;
    const top = (props.y - props.offsetY) / props.scale;
    const right = left + props.width / props.scale;
    const bottom = top + props.height / props.scale;
    const allocated = new Map(props.tree.nodes.filter((node) => node.allocated).map((node) => [node.id, node.weaponSets ?? []]));
    ctx.lineCap = "round";
    const connected = new Set<string>();
    const paths = new Map<string, Path2D>();
    for (const [from, to, radius] of edges) {
      const a = graph[from], b = graph[to];
      const first = allocated.get(from), second = allocated.get(to);
      const set = first?.length ? first[0] : second?.length ? second[0] : 0;
      const active = Boolean(first && second && (!first.length || !second.length || first.some((value) => second.includes(value))));
      if (active) {
        if (first?.length || !second?.length) connected.add(from);
        if (second?.length || !first?.length) connected.add(to);
      }
      const pad = Math.abs(radius);
      if (Math.max(a[0], b[0]) + pad < left || Math.min(a[0], b[0]) - pad > right ||
          Math.max(a[1], b[1]) + pad < top || Math.min(a[1], b[1]) - pad > bottom) continue;
      const color = active ? set === 1 || (props.classic && set === 2) ? "#cd625b" : set === 2 ? "#70ba81" : "#d2b073" : "#51452d";
      const path = paths.get(color) ?? new Path2D();
      path.moveTo(a[0], a[1]);
      if (radius && Math.hypot(a[0] - b[0], a[1] - b[1]) < Math.abs(radius) * 2) {
        path.addPath(new Path2D(`M${a[0]} ${a[1]} A${Math.abs(radius)} ${Math.abs(radius)} 0 0 ${radius > 0 ? 0 : 1} ${b[0]} ${b[1]}`));
      } else path.lineTo(b[0], b[1]);
      paths.set(color, path);
    }
    const orderedPaths = [...paths].sort(([a], [b]) => Number(a !== "#51452d") - Number(b !== "#51452d"));
    for (const [color, path] of orderedPaths) {
      ctx.strokeStyle = color;
      ctx.lineWidth = color === "#51452d" ? 1.5 : 3.5;
      ctx.stroke(path);
    }

    for (const [id, [x, y, icon, kind]] of nodes) {
      if (x < left - 24 || x > right + 24 || y < top - 24 || y > bottom + 24) continue;
      const sets = allocated.get(id);
      const current = Boolean(sets && (!sets.length || sets.includes(props.weaponSet)));
      const frameDiameter = [10.8, 16, 24, 15.2][kind];
      const iconDiameter = [7.4, 10.8, 16.4, 15.2][kind];
      const frameSourceSize = [104, 156, 128, 156][kind];
      function tile(index: number, dimension: number) {
        if (!ctx || index < 0) return;
        const atlas = atlases.current[Math.floor(index / 128)];
        if (!atlas?.complete || !atlas.naturalWidth) return;
        const local = index % 128;
        ctx.drawImage(atlas, (local % 16) * 128, Math.floor(local / 16) * 128, 128, 128,
          x - dimension / 2, y - dimension / 2, dimension, dimension);
      }
      const weaponTint = (kind === 1 || kind === 2) && sets?.length === 1
        ? (sets[0] === 1 ? "#ff716a" : "#7bdb90") : null;
      if (props.classic) {
        ctx.beginPath();
        ctx.arc(x, y, sets ? 5 : 2.6, 0, 2 * Math.PI);
        ctx.fillStyle = weaponTint ?? (sets ? "#ffcf75" : "#746047");
        ctx.fill();
        continue;
      }
      ctx.globalAlpha = current ? 1 : .66;
      ctx.beginPath();
      ctx.arc(x, y, iconDiameter * .5, 0, 2 * Math.PI);
      ctx.fillStyle = "#131519";
      ctx.fill();
      ctx.save();
      ctx.clip();
      tile(icon, kind === 0 ? iconDiameter * 2 : iconDiameter);
      if (weaponTint) {
        ctx.globalAlpha = .64;
        ctx.fillStyle = weaponTint;
        ctx.fillRect(x - iconDiameter / 2, y - iconDiameter / 2, iconDiameter, iconDiameter);
      }
      ctx.restore();
      tile(passive.frameStart + kind * 2 + Number(current), frameDiameter * 128 / Math.min(frameSourceSize, 128));
      ctx.globalAlpha = 1;
    }

    for (const [id, sets] of allocated) {
      if (sets.length && !sets.includes(props.weaponSet)) continue;
      const jewel = jewels.has(id);
      if (!jewel && !(props.hasKeystoneRadius && keystones.has(id))) continue;
      const point = graph[id];
      if (!point) continue;
      const radius = jewel ? 180 : 138;
      ctx.beginPath();
      ctx.arc(point[0], point[1], radius, 0, 2 * Math.PI);
      ctx.strokeStyle = jewel ? "#91add580" : "#788bc565";
      ctx.lineWidth = 1 / Math.max(.01, sx * props.scale / density);
      ctx.stroke();
    }

    for (const [id, sets] of allocated) {
      const point = graph[id];
      if (!point || sets.length || connected.has(id)) continue;
      const [x, y, , kind] = point;
      if (x < left - 25 || x > right + 25 || y < top - 25 || y > bottom + 25) continue;
      const color = "#f5d289";
      const radius = props.classic ? 5.4 : [5.4, 8, 12, 7.6][kind];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.globalAlpha = .8;
      ctx.lineWidth = 1.35 / Math.max(.01, sx * props.scale / density);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
  useEffect(() => {
    const onResize = () => redraw.current();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(onResize) : null;
    if (canvas.current) observer?.observe(canvas.current);
    window.addEventListener("resize", onResize);
    atlases.current = atlasUrls.map((url) => {
      const image = new Image();
      image.onload = () => redraw.current();
      image.src = url;
      return image;
    });
    redraw.current();
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", onResize);
      atlases.current.forEach((image) => { image.onload = null; });
    };
  }, []);
  useEffect(() => redraw.current(), [props]);
  return (
    <foreignObject x={props.x} y={props.y} width={props.width} height={props.height} pointerEvents="none" aria-hidden="true">
      <canvas ref={canvas} style={{ display: "block", width: "100%", height: "100%", pointerEvents: "none" }} />
    </foreignObject>
  );
}
