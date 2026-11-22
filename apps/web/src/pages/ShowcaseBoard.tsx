import MemorialTreeView from "../components/MemorialTreeView.tsx";
import CharacterStats from "../components/CharacterStats.tsx";
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
  const character = locale === "en" ? snapshot.titleEn : snapshot.titleZh;
  return (
    <div>
      <h2 className="ledger-character">{character}</h2>
      {identity ? <p className="mb-2 text-sm text-muted">{identity}</p> : null}
      {mode === "recommended" ? (
        <SessionNote />
      ) : (
        <p className="mb-4 max-w-2xl text-sm text-muted">{t.showcaseMemorialLead}</p>
      )}
      <div className="memorial-layout">
        <PaperDoll mode={mode} />
        {mode === "memorial" && snapshot.level ? <CharacterStats /> : null}
      </div>
      {mode === "memorial" && <div className="memorial-tree-grid">
        <MemorialTreeView title={locale === "en" ? "Ascendancy tree" : "昇華天賦樹"} tree={snapshot.ascendancyTree} />
        <MemorialTreeView title={locale === "en" ? "Passive skill tree" : "天賦樹"} tree={snapshot.passiveTree} />
      </div>}
    </div>
  );
}
