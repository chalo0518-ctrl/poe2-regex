import { NavLink, Outlet } from "react-router-dom";
import { LOCALES, LOCALE_LABEL, useLocale } from "../i18n.tsx";

export default function AppLayout() {
  const { locale, setLocale, t } = useLocale();
  const modules = [
    { to: "/early", label: t.early, match: "/early" },
    { to: "/endgame", label: t.endgame, match: "/endgame" },
  ];

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="shrink-0 text-sm font-bold tracking-wide text-gold">
            {t.brand}
          </NavLink>
          <nav className="flex flex-wrap gap-1" aria-label={t.navAria}>
            {modules.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-sm px-3 py-1.5 text-sm ${
                    isActive
                      ? "bg-gold/15 text-gold"
                      : "text-muted hover:text-paper"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div
            className="ml-auto flex overflow-hidden rounded-sm border border-line text-xs"
            role="group"
            aria-label="Language"
          >
            {LOCALES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setLocale(id)}
                className={`px-2 py-1 ${locale === id ? "bg-gold text-ink" : "text-muted hover:text-paper"}`}
              >
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
