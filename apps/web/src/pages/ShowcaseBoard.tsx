import PaperDoll from "../components/PaperDoll.tsx";
import { useLocale } from "../i18n.tsx";

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
  const { t } = useLocale();
  return (
    <div>
      {mode === "recommended" ? (
        <SessionNote />
      ) : (
        <p className="mb-4 max-w-2xl text-sm text-muted">{t.showcaseMemorialLead}</p>
      )}
      <PaperDoll mode={mode} />
    </div>
  );
}
