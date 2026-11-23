import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { useLocale } from "../i18n.tsx";

export default function AppLayout() {
  const { locale, t } = useLocale();
  const { pathname } = useLocation();
  const english = locale === "en";
  return (
    <div className="ledger-app min-h-svh">
      <header className="ledger-masthead">
        <div className="ledger-nav">
          <Link to="/showcase" className="ledger-brand">
            <img
              className="ledger-brand-logo"
              src="https://cdn2.unrealengine.com/egs-pathofexile2-grindinggeargames-ic1-2-766x680-f06bc65a22ab.png?h=270&quality=medium&resize=1&w=480"
              alt=""
            />
            <span lang="en">Exile’s Ledger</span>
          </Link>
          <nav className="ledger-module-nav" aria-label={english ? "Main sections" : "主要板塊"}>
            <NavLink to="/showcase">{english ? "Season Recap" : "賽季回顧"}</NavLink>
            <NavLink to="/early">{t.early}</NavLink>
            <NavLink to="/endgame/waystones" className={pathname.startsWith("/endgame/") && !pathname.startsWith("/endgame/crafting") ? "active" : undefined}>{t.endgame}</NavLink>
            <NavLink to="/endgame/crafting">{english ? "Crafting" : "裝備製作"}</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
