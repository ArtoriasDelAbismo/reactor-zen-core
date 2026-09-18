import { AnimatePresence, motion } from "motion/react";
import { formatClock, type EventKind, type ReactorEvent } from "@/lib/reactor";

const kindStyle: Record<EventKind, string> = {
  mode: "text-primary border-primary/40",
  alarm: "text-warn border-warn/40",
  scram: "text-destructive border-destructive/50",
  rods: "text-accent border-accent/40",
  scenario: "text-plasma border-plasma/40",
  info: "text-muted-foreground border-border",
};

export function EventLog({ events }: { events: ReactorEvent[] }) {
  const ordered = [...events].reverse();
  return (
    <div className="h-[260px] overflow-y-auto pr-1">
      {ordered.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sin eventos todavía. Mueve las varillas o cambia de modo.
        </p>
      )}
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {ordered.map((e) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex gap-2 rounded-md border-l-2 bg-secondary/30 px-2 py-1.5 text-[11px] ${kindStyle[e.kind]}`}
            >
              <span className="shrink-0 tabular-nums opacity-70">{formatClock(e.t)}</span>
              <span className="text-foreground/90">{e.message}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
