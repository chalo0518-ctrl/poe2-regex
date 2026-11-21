import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { seasonHref } from "./showcaseSeasons.ts";
import { memorialGear, paperDollSlots, type PaperDollSlot } from "@poe2-regex/data";
import MarketItemCard from "../components/MarketItemCard.tsx";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "./showcaseState.tsx";

export default function MemorialDetail() {
  const { slotId } = useParams();
  const [params] = useSearchParams();
  const backTo = seasonHref("/showcase/memorial", params.get("season"));
  const slot = paperDollSlots.find((row) => row.id === slotId);
  if (!slot) return <Navigate to={backTo} replace />;
  return <DetailBody slot={slot} backTo={backTo} />;
}

function DetailBody({ slot, backTo }: { slot: PaperDollSlot; backTo: string }) {
  const { locale, t } = useLocale();
  const { snapshot } = useShowcase();
  const gear = memorialGear(snapshot, slot.id);
  const slotLabel = locale === "en" ? slot.labelEn : slot.labelZh;

  return (
    <div className="max-w-4xl">
      <Link to={backTo} className="text-sm text-gold hover:underline">
        {t.showcaseBackMemorial}
      </Link>
      <p className="mt-3 text-xs tracking-[0.2em] text-gold-dim">{slotLabel}</p>
      {gear ? <div className="mt-4"><MarketItemCard gear={gear} locale={locale} /></div> : <p className="mt-4 text-sm text-muted">{t.showcaseMemorialEmpty}</p>}
    </div>
  );
}

