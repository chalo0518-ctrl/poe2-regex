import { NavLink, Outlet } from "react-router-dom";

const modules = [
  { to: "/early", label: "開荒／新手", match: "/early" },
  { to: "/endgame", label: "終局", match: "/endgame" },
];

export default function AppLayout() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="shrink-0 text-sm font-bold tracking-wide text-gold">
            流放之路 2 正則
          </NavLink>
          <nav className="flex flex-wrap gap-1" aria-label="主模組">
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
        </div>
      </header>
      <Outlet />
    </div>
  );
}
