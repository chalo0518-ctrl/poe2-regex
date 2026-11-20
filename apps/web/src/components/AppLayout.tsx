import { NavLink, Outlet } from "react-router-dom";
import { LOCALES, LOCALE_LABEL, useLocale } from "../i18n.tsx";

export default function AppLayout() {
  const { locale, setLocale, t } = useLocale();
  const modules = [
    { to: "/showcase", label: t.showcaseNav },
    { to: "/endgame/crafting", label: t.crafting },
  ];

  return (
    <div className="ledger-app min-h-svh">
      <header className="ledger-masthead">
        <div className="ledger-nav">
          <NavLink to="/" className="ledger-brand">
            <span aria-hidden="true" className="ledger-brand-mark">◇</span>
            {t.brand}
          </NavLink>
          <nav aria-label={t.navAria}>
            {modules.map(({ to, label }) => <NavLink key={to} to={to}>{label}</NavLink>)}
          </nav>
          <div className="ledger-languages" role="group" aria-label={locale === "en" ? "Language" : "語言"}>
            {LOCALES.map((id) => (
              <button key={id} type="button" onClick={() => setLocale(id)} aria-pressed={locale === id}>
                {LOCALE_LABEL[id]}
              </button>
            ))}
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
