import { Link } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export default function HomePage() {
  const { locale, t } = useLocale();
  const english = locale === "en";

  return (
    <main className="ledger-home">
      <div className="ledger-portals">
        <Link to="/showcase" className="ledger-portal ledger-ruins">
          <h2>{t.showcaseNav}</h2>
          <p>{english ? "Browse seasons, characters, and builds." : "瀏覽賽季、角色與流派配置。"}</p>
          <span aria-hidden="true">→</span>
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
