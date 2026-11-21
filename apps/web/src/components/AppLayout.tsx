import { Link, Outlet, useLocation } from "react-router-dom";
import { seasonHref } from "../pages/showcaseSeasons.ts";
import { useLocale } from "../i18n.tsx";

export default function AppLayout() {
  const { locale } = useLocale();
  const { pathname, search } = useLocation();
  const archive = pathname.match(/^\/showcase\/(memorial|recommended)(?:\/([^/]+))?\/?$/);
  const backTo = archive?.[2]
    ? seasonHref(`/showcase/${archive[1]}`, new URLSearchParams(search).get("season"))
    : archive || pathname === "/showcase" ? "/" : null;

  return (
    <div className="ledger-app min-h-svh">
      <header className="ledger-masthead">
        <div className="ledger-nav">
          <Link to="/" className="ledger-brand">
            <img
              className="ledger-brand-logo"
              src="https://cdn2.unrealengine.com/egs-pathofexile2-grindinggeargames-ic1-2-766x680-f06bc65a22ab.png?h=270&quality=medium&resize=1&w=480"
              alt=""
            />
            <span lang="en">Exile’s Ledger</span>
          </Link>
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
