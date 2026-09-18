import type { ReactNode } from "react";

export function Panel({
  title,
  children,
  right,
  className = "",
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel p-4 sm:p-5 ${className}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{title}</h2>
        {right}
      </header>
      {children}
    </section>
  );
}
