import type { ReactNode } from "react";

export default function LedgerHero({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="ledger-hero">
      <h1>{title}</h1>
      <p>{children}</p>
    </header>
  );
}
