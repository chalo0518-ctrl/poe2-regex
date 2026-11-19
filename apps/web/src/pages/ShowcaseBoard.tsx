import PaperDoll from "../components/PaperDoll.tsx";
import { useLocale } from "../i18n.tsx";
import { useShowcase } from "./showcaseState.tsx";

export function SessionNote() {
  const { t } = useLocale();
  return (
    <p className="mb-4 max-w-2xl text-sm text-muted">
      {t.showcaseSessionBefore}
      <span>{t.showcaseSessionStrong}</span>
      {t.showcaseSessionAfter}
    </p>
  );
}

export default function ShowcaseBoard({ mode }: { mode: "memorial" | "recommended" }) {
  const { locale, t } = useLocale();
  const { snapshot } = useShowcase();
  const identity = snapshot.level
    ? locale === "en"
      ? `Level ${snapshot.level} ${snapshot.classEn ?? ""} · ${snapshot.leagueEn ?? ""}`
      : `${snapshot.level} 級 ${snapshot.classZh ?? ""} · ${snapshot.leagueZh ?? ""}`
    : "";
  return (
    <div>
      {identity ? <p className="mb-2 text-sm text-muted">{identity}</p> : null}
      {mode === "recommended" ? (
        <SessionNote />
      ) : (
        <p className="mb-4 max-w-2xl text-sm text-muted">{t.showcaseMemorialLead}</p>
      )}
      <PaperDoll mode={mode} />
    </div>
  );
}
