import { Link, Outlet, useLocation } from "react-router-dom";
import { LOCALES, LOCALE_LABEL, useLocale } from "../i18n.tsx";

export default function AppLayout() {
  const { locale, setLocale, t } = useLocale();
  const { pathname, search } = useLocation();
  const archive = pathname.match(/^\/showcase\/(memorial|recommended)(?:\/([^/]+))?\/?$/);
  const backTo = archive?.[2]
    ? `/showcase/${archive[1]}`
    : archive || (pathname === "/showcase" && new URLSearchParams(search).has("season"))
      ? "/showcase"
      : pathname === "/showcase" || pathname === "/endgame/crafting"
        ? "/"
        : null;

  return (
    <div className="ledger-app min-h-svh">
      <header className="ledger-masthead">
        <div className="ledger-nav">
          <Link to="/" className="ledger-brand">
            <span aria-hidden="true" className="ledger-brand-mark">◇</span>
            {t.brand}
          </Link>
          <div className="ledger-languages" role="group" aria-label={locale === "en" ? "Language" : "語言"}>
            {LOCALES.map((id) => (
              <button key={id} type="button" onClick={() => setLocale(id)} aria-pressed={locale === id}>
                {LOCALE_LABEL[id]}
              </button>
            ))}
          </div>
        </div>
      </header>
      {backTo ? (
        <div className="ledger-back-row">
          <Link className="ledger-back" to={backTo}>
            <span aria-hidden="true">←</span> {locale === "en" ? "Back" : "返回"}
          </Link>
        </div>
      ) : null}
      <Outlet />
    </div>
  );
}
