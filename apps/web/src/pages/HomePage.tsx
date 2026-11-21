import { Link } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export default function HomePage() {
  const { locale } = useLocale();
  const english = locale === "en";

  return (
    <main className="ledger-home">
      <div className="ledger-portals">
        <Link to="/showcase/memorial" className="ledger-season-card ledger-home-season" data-art="canvas">
          <div className="ledger-season-copy">
            <h2>Runes of Aldur</h2>
            <span className="ledger-season-enter">{english ? "Open season recap" : "進入賽季回顧"}</span>
          </div>
        </Link>
      </div>
    </main>
  );
}
