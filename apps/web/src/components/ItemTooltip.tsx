import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { type MemorialGear, type UiLocale } from "@poe2-regex/data";

import MarketItemCard, { marketItemTitle } from "./MarketItemCard.tsx";

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
  const name = marketItemTitle(tip.gear, locale);

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
        <span aria-hidden="true">⋯</span>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDismiss} aria-label={locale === "en" ? "Close" : "關閉"}>
          ×
        </button>
      </header>
      <MarketItemCard gear={tip.gear} locale={locale} />
    </div>
  );
}
