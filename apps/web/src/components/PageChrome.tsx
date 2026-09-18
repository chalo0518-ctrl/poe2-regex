import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useLocale } from "../i18n.tsx";

export function SubNav({
  items,
}: {
  items: { to: string; label: string; end?: boolean }[];
}) {
  const { t } = useLocale();
  return (
    <nav
      className="mb-6 flex flex-wrap gap-1 border-b border-line pb-3"
      aria-label={t.subNavAria}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `rounded-sm px-3 py-1.5 text-sm ${
              isActive
                ? "border border-gold bg-gold/15 text-gold"
                : "border border-transparent text-muted hover:text-paper"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useLocale();
  return (
    <section className="rounded-sm border border-dashed border-line bg-panel px-5 py-10">
      <h2 className="text-lg font-medium text-gold">{title}</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">{description}</p>
      <p className="mt-4 text-sm text-gold-dim">{t.emptyLater}</p>
    </section>
  );
}

export function PageShell({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <p className="text-xs tracking-[0.28em] text-gold-dim">{kicker}</p>
      <h1 className="mt-1 mb-5 text-2xl font-bold text-gold">{title}</h1>
      {children}
    </div>
  );
}
