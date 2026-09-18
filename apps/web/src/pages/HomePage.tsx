import { Link } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export default function HomePage() {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <p className="text-xs tracking-[0.28em] text-gold-dim">{t.homeKicker}</p>
      <h1 className="mt-2 text-3xl font-bold text-gold">{t.homeTitle}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">{t.homeLead}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          to="/early"
          className="rounded-sm border border-line bg-panel p-6 transition hover:border-gold"
        >
          <p className="text-xs text-gold-dim">CAMPAIGN</p>
          <h2 className="mt-1 text-xl font-bold text-gold">{t.early}</h2>
          <p className="mt-2 text-sm text-muted">{t.homeEarlyBody}</p>
        </Link>
        <Link
          to="/endgame"
          className="rounded-sm border border-line bg-panel p-6 transition hover:border-gold"
        >
          <p className="text-xs text-gold-dim">ENDGAME</p>
          <h2 className="mt-1 text-xl font-bold text-gold">{t.endgame}</h2>
          <p className="mt-2 text-sm text-muted">{t.homeEndgameBody}</p>
        </Link>
      </div>
    </div>
  );
}
