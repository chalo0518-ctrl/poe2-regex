import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { showcaseImageUrl, type MemorialGear, type UiLocale } from "@poe2-regex/data";

export type TooltipState = {
  gear: MemorialGear;
  x: number;
  y: number;
  pinned: boolean;
};

export default function ItemTooltip({
  tip,
  locale,
  onPinned,
  onDismiss,
}: {
  tip: TooltipState;
  locale: UiLocale;
  onPinned: (x: number, y: number) => void;
  onDismiss: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const [pos, setPos] = useState({ x: tip.x, y: tip.y });
  const posRef = useRef(pos);
  posRef.current = pos;
  const name = locale === "en" ? tip.gear.nameEn || tip.gear.nameZh : tip.gear.nameZh || tip.gear.nameEn;
  const body = locale === "en" ? tip.gear.tooltipEn || tip.gear.tooltipZh || "" : tip.gear.tooltipZh || tip.gear.tooltipEn || "";

  useEffect(() => {
    if (!tip.pinned) setPos({ x: tip.x, y: tip.y });
  }, [tip.gear.nameEn, tip.pinned, tip.x, tip.y]);

  useEffect(() => {
    function onPointerDown(event: globalThis.PointerEvent) {
      if (!tip.pinned) return;
      const node = root.current;
      if (node && event.target instanceof Node && !node.contains(event.target)) onDismiss();
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [onDismiss, tip.pinned]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    drag.current = { dx: event.clientX - pos.x, dy: event.clientY - pos.y, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state) return;
    const x = event.clientX - state.dx;
    const y = event.clientY - state.dy;
    if (Math.abs(event.movementX) + Math.abs(event.movementY) > 2) state.moved = true;
    setPos({ x, y });
  }

  function endDrag() {
    const state = drag.current;
    drag.current = null;
    if (state?.moved) onPinned(posRef.current.x, posRef.current.y);
  }

  return (
    <div
      ref={root}
      className={`item-tip item-tip-${tip.gear.rarity || "rare"}`}
      role="dialog"
      aria-label={name}
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={(event) => event.stopPropagation()}
    >
      <header onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}>
        <strong>{name}</strong>
        <button type="button" onClick={onDismiss} aria-label={locale === "en" ? "Close" : "關閉"}>
          ×
        </button>
      </header>
      <pre>{body}</pre>
      {(tip.gear.sockets ?? []).length > 0 ? (
        <ul>
          {(tip.gear.sockets ?? []).map((socket, index) => {
            const socketName = locale === "en" ? socket.nameEn : socket.nameZh;
            const socketBody = locale === "en" ? socket.tooltipEn : socket.tooltipZh;
            const src = showcaseImageUrl(socket.imageUrl ?? "");
            return (
              <li key={`${socket.nameEn}-${index}`}>
                {src ? <img src={src} alt="" /> : null}
                <div>
                  <p>{socketName}</p>
                  {socketBody ? <pre>{socketBody}</pre> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
