import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
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
  onEnter,
  onLeave,
}: {
  tip: TooltipState;
  locale: UiLocale;
  onPinned: (x: number, y: number) => void;
  onDismiss: () => void;
  onEnter: () => void;
  onLeave: () => void;
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
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
      if (event.key === "Alt" && !tip.pinned) {
        const bounds = root.current?.getBoundingClientRect();
        if (bounds) onPinned(bounds.left, bounds.top);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, onPinned, tip.pinned]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const bounds = root.current?.getBoundingClientRect();
    drag.current = { dx: event.clientX - (bounds?.left ?? pos.x), dy: event.clientY - (bounds?.top ?? pos.y), moved: false };
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

  return createPortal(
    <div
      ref={root}
      className={`item-tip item-tip-${tip.gear.rarity || "rare"}`}
      role="dialog"
      aria-label={name}
      style={{ left: `clamp(8px, ${pos.x}px, calc(100vw - min(46rem, 100vw - 2rem) - 8px))`, top: `clamp(8px, ${pos.y}px, calc(100dvh - min(90dvh, 52rem) - 8px))` }}
      onMouseEnter={(event) => { event.stopPropagation(); onEnter(); }}
      onMouseLeave={onLeave}
    >
      <header onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}>
        <button type="button" className="item-tip-pin" aria-pressed={tip.pinned}
          aria-label={locale === "en" ? "Pin item" : "釘選裝備"}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => onPinned(pos.x, pos.y)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 4h6m-5 0v6l-3 4v2h10v-2l-3-4V4m-2 12v5" /></svg>
        </button>
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDismiss} aria-label={locale === "en" ? "Close" : "關閉"}>
          ×
        </button>
      </header>
      <div className="item-tip-body"><MarketItemCard gear={tip.gear} locale={locale} /></div>
    </div>, document.body
  );
}
