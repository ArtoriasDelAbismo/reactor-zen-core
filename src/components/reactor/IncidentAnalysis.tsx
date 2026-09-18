import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeIncident, type IncidentReport } from "@/lib/incident.functions";
import { formatClock, MODE_LABEL, type ReactorState } from "@/lib/reactor";

const severityStyle: Record<string, string> = {
  normal: "text-accent",
  aviso: "text-warn",
  critico: "text-destructive",
  emergencia: "text-destructive",
};

export function IncidentAnalysis({
  state,
  report,
  onReport,
}: {
  state: ReactorState;
  report: IncidentReport | null;
  onReport: (r: IncidentReport | null) => void;
}) {
  const analyze = useServerFn(analyzeIncident);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyze({
        data: {
          mode: MODE_LABEL[state.mode],
          temp: state.temp,
          pressure: state.pressure,
          power: state.power,
          flux: state.flux,
          rods: state.rods,
          coolant: state.coolant,
          fuel: state.fuel,
          alarms: state.alarms,
          events: state.events.slice(-15).map((e) => `[${formatClock(e.t)}] ${e.message}`),
          notes,
        },
      });
      onReport(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el informe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Condiciones observadas por el operador: vibraciones, caudal irregular, lecturas anómalas…"
        className="min-h-[86px] resize-none bg-secondary/40 text-xs"
      />
      <Button onClick={run} disabled={loading} className="w-full">
        {loading ? "Analizando condiciones…" : "Generar informe con IA"}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">{report.titulo}</h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.2em] ${severityStyle[report.severity] ?? "text-primary"}`}
            >
              {report.severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{report.resumen}</p>
          <Section title="Causas probables" items={report.causas} />
          <Section title="Acciones recomendadas" items={report.acciones} />
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Pronóstico
            </p>
            <p className="text-xs text-foreground/90">{report.pronostico}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.map((i, idx) => (
          <li key={idx} className="text-xs text-foreground/90">
            · {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
