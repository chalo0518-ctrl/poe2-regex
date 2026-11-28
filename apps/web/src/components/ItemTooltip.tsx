import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import "./ItemTooltipCorner.css";
import { createPortal } from "react-dom";
import { type MemorialGear, type UiLocale } from "@poe2-regex/data";

import MarketItemCard, { marketItemTitle } from "./MarketItemCard.tsx";

export type TooltipState = {
  gear: MemorialGear;
  anchor: { x: number; y: number };
  x: number;
  y: number;
  pinned: boolean;
};

export default function ItemTooltip({
  tip,
  locale,
  onPinned,
  onDismiss,
  onAnchorLeave,
  onControlEnter,
}: {
  tip: TooltipState;
  locale: UiLocale;
  onPinned: (x: number, y: number) => void;
  onDismiss: () => void;
  onAnchorLeave: () => void;
  onControlEnter: () => void;
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
      if (event.type === "keydown" && event.key === "Escape") onDismiss();
      const alt = event.key === "Alt" || event.code === "AltLeft" || event.code === "AltRight";
      if (!alt || event.ctrlKey || event.metaKey || event.shiftKey) return;
      event.preventDefault();
      if (!tip.pinned) {
        const bounds = root.current?.getBoundingClientRect();
        if (bounds) { setPos({ x: bounds.left, y: bounds.top }); onPinned(bounds.left, bounds.top); }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, onPinned, tip.pinned]);

  function startDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!tip.pinned || event.button !== 0) return;
    const bounds = root.current?.getBoundingClientRect();
    drag.current = { dx: event.clientX - (bounds?.left ?? pos.x), dy: event.clientY - (bounds?.top ?? pos.y), moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current;
    if (!state) return;
    const x = Math.max(24 - (root.current?.offsetWidth ?? 24), Math.min(window.innerWidth - (root.current?.offsetWidth ?? 0), event.clientX - state.dx));
    const y = Math.max(0, Math.min(window.innerHeight - 32, event.clientY - state.dy));
    if (Math.abs(x - pos.x) + Math.abs(y - pos.y) > 2) state.moved = true;
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
      data-pinned={tip.pinned}
      className={`item-tip item-tip-${tip.gear.rarity || "rare"}`}
      role="dialog"
      aria-label={name}
      style={tip.pinned ? { left: pos.x, top: pos.y } : { left: `clamp(8px, ${pos.x}px, calc(100vw - min(46rem, 100vw - 2rem) - 8px))`, top: `clamp(8px, ${pos.y}px, calc(100dvh - min(90dvh, 52rem) - 8px))` }}
    >
      <header className="item-tip-corner" onMouseEnter={onControlEnter} onMouseLeave={onAnchorLeave}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <button type="button" aria-label={tip.pinned ? (locale === "en" ? "Close" : "關閉") : (locale === "en" ? "Pin item" : "釘選裝備")}
          title={tip.pinned ? (locale === "en" ? "Close" : "關閉") : (locale === "en" ? "Pin (Alt)" : "釘選（Alt）")}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => {
            if (tip.pinned) return onDismiss();
            const bounds = root.current?.getBoundingClientRect();
            if (bounds) { setPos({ x: bounds.left, y: bounds.top }); onPinned(bounds.left, bounds.top); }
          }}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4">
            {tip.pinned ? <path d="M2 2l20 20M22 2L2 22" /> : <path transform="rotate(45 12 12)" d="M8 3h8l-2 3v5l3 3v2H7v-2l3-3V6zM12 16v6" />}
          </svg>
        </button>
      </header>      <div className="item-tip-body"><MarketItemCard gear={tip.gear} locale={locale} /></div>
    </div>
    , document.body
  );
}
