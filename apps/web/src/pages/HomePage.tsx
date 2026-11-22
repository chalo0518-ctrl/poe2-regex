import { Link } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export default function HomePage() {
  const { locale } = useLocale();
  const english = locale === "en";

  return (
    <main className="ledger-home">
      <div className="ledger-portals">
        <Link to="/showcase" className="ledger-season-card ledger-home-season" data-art="canvas">
          <div className="ledger-season-copy">
            <h2>{english ? "Season Recap" : "賽季回顧"}</h2>
            <span className="ledger-season-enter">{english ? "Choose a season" : "選擇賽季"}</span>
          </div>
        </Link>
      </div>
    </main>
  );
}
