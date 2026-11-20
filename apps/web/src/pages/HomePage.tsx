import { Link } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export default function HomePage() {
  const { locale, t } = useLocale();
  const english = locale === "en";

  return (
    <main className="ledger-home">
      <div className="ledger-portals">
        <Link to="/showcase" className="ledger-season-card ledger-home-season" data-art="canvas">
          <h2>Runes of Aldur</h2>
          <span className="ledger-season-enter">
            {english ? "Open season recap" : "進入賽季回顧"}
          </span>
        </Link>
        <Link to="/endgame/crafting" className="ledger-portal ledger-forge">
          <h2>{t.crafting}</h2>
          <p>{english ? "Choose your affixes and plan the next step." : "選擇目標詞綴，規劃裝備的下一步。"}</p>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
