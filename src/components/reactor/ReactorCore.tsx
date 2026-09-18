import { motion } from "motion/react";
import { useMemo } from "react";

interface Props {
  flux: number;
  temp: number;
  rods: number;
  critical: boolean;
}

export function ReactorCore({ flux, temp, rods, critical }: Props) {
  const count = Math.min(46, Math.round(flux / 2.2));
  const particles = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        angle: (i / 46) * Math.PI * 2 + i * 0.37,
        radius: 26 + ((i * 13) % 58),
        dur: 1.2 + ((i * 7) % 18) / 10,
        size: 3 + ((i * 5) % 4),
      })),
    [],
  );

  const heat = Math.min(1, Math.max(0, (temp - 60) / 560));
  const coreColor = critical
    ? "var(--danger)"
    : heat > 0.55
      ? "var(--warn)"
      : "var(--neon)";

  return (
    <div className="scanlines relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-full border border-border">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 50%, color-mix(in oklab, ${coreColor} ${20 + heat * 45}%, transparent), transparent 68%)`,
        }}
      />
      <motion.div
        className="absolute inset-[18%] rounded-full"
        animate={{
          scale: [1, 1.05 + heat * 0.06, 1],
          opacity: [0.55, 0.9, 0.55],
        }}
        transition={{ duration: Math.max(0.6, 2.4 - heat * 1.6), repeat: Infinity }}
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${coreColor} 70%, transparent), transparent 70%)`,
          filter: `blur(${6 + heat * 10}px)`,
        }}
      />

      {particles.slice(0, count).map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: coreColor,
            boxShadow: `0 0 10px ${coreColor}`,
          }}
          animate={{
            x: [0, Math.cos(p.angle) * p.radius * 1.9, Math.cos(p.angle) * p.radius * 2.6],
            y: [0, Math.sin(p.angle) * p.radius * 1.9, Math.sin(p.angle) * p.radius * 2.6],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: Math.max(0.5, p.dur - heat),
            repeat: Infinity,
            ease: "easeOut",
            delay: p.id * 0.04,
          }}
        />
      ))}

      {/* Control rods */}
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center gap-2 px-16">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[6px] rounded-b-full bg-secondary"
            style={{ boxShadow: "inset 0 0 6px color-mix(in oklab, var(--neon) 30%, transparent)" }}
            animate={{ height: `${12 + (rods / 100) * 62}%` }}
            transition={{ type: "spring", stiffness: 70, damping: 20 }}
          />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-4 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        núcleo · flujo {flux.toFixed(1)}%
      </div>
    </div>
  );
}
