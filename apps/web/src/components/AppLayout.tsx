import { Link, Outlet } from "react-router-dom";

export default function AppLayout() {
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
        </div>
      </header>
      <Outlet />
    </div>
  );
}
