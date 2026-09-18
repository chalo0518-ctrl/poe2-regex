import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <p className="text-xs tracking-[0.28em] text-gold-dim">PATH OF EXILE 2</p>
      <h1 className="mt-2 text-3xl font-bold text-gold">正則工具</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        依遊玩階段選擇模組。開荒依章節提供商店裝備預設正則；終局已填入換界石與碑牌詞綴正則。
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          to="/early"
          className="rounded-sm border border-line bg-panel p-6 transition hover:border-gold"
        >
          <p className="text-xs text-gold-dim">CAMPAIGN</p>
          <h2 className="mt-1 text-xl font-bold text-gold">開荒／新手</h2>
          <p className="mt-2 text-sm text-muted">
            章節地圖、商店裝備篩選（各章預設生命／移速／抗性）、流派推薦裝備。盾牌詞綴實驗頁暫放於此。
          </p>
        </Link>
        <Link
          to="/endgame"
          className="rounded-sm border border-line bg-panel p-6 transition hover:border-gold"
        >
          <p className="text-xs text-gold-dim">ENDGAME</p>
          <h2 className="mt-1 text-xl font-bold text-gold">終局</h2>
          <p className="mt-2 text-sm text-muted">
            換界石（低／中／高階）與八種碑牌詞綴正則。碑牌必須先選種類。
          </p>
        </Link>
      </div>
    </div>
  );
}
