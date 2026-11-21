import { Link, Navigate, useParams } from "react-router-dom";
import { memorialGear, paperDollSlots, type PaperDollSlot } from "@poe2-regex/data";
import MarketItemCard from "../components/MarketItemCard.tsx";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "./showcaseState.tsx";

export default function MemorialDetail() {
  const { slotId } = useParams();
  const slot = paperDollSlots.find((row) => row.id === slotId);
  if (!slot) return <Navigate to="/showcase/memorial" replace />;
  return <DetailBody slot={slot} />;
}

function DetailBody({ slot }: { slot: PaperDollSlot }) {
  const { locale, t } = useLocale();
  const { snapshot } = useShowcase();
  const gear = memorialGear(snapshot, slot.id);
  const slotLabel = locale === "en" ? slot.labelEn : slot.labelZh;

  return (
    <div className="max-w-4xl">
      <Link to="/showcase/memorial" className="text-sm text-gold hover:underline">
        {t.showcaseBackMemorial}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{slotLabel}</p>
      {gear ? <div className="mt-4"><MarketItemCard gear={gear} locale={locale} /></div> : <p className="mt-4 text-sm text-muted">{t.showcaseMemorialEmpty}</p>}
    </div>
  );
}

