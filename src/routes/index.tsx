import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Gauge } from "@/components/reactor/Gauge";
import { ReactorCore } from "@/components/reactor/ReactorCore";
import { TrendChart, FuelChart } from "@/components/reactor/Charts";
import { Panel } from "@/components/reactor/Panel";
import { EventLog } from "@/components/reactor/EventLog";
import { IncidentAnalysis } from "@/components/reactor/IncidentAnalysis";
import { exportReactorReport } from "@/lib/report";
import type { IncidentReport } from "@/lib/incident.functions";
import { LIMITS, MODE_LABEL, SCENARIOS, useReactor, type ReactorMode } from "@/lib/reactor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Núcleo | Simulador de Reactor Nuclear" },
      {
        name: "description",
        content:
          "Simulador interactivo de un reactor nuclear: controla las varillas, vigila temperatura, presión y potencia en tiempo real.",
      },
      { property: "og:title", content: "Núcleo | Simulador de Reactor Nuclear" },
      {
        property: "og:description",
        content:
          "Panel de control futurista para operar un reactor nuclear simulado, con gráficas en tiempo real y modo SCRAM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReactorSimulator,
});

const MODES: { id: ReactorMode; label: string }[] = [
  { id: "startup", label: "Arranque" },
  { id: "normal", label: "Operación" },
  { id: "scram", label: "SCRAM" },
  { id: "shutdown", label: "Apagado" },
];

function ReactorSimulator() {
  const { state, setRods, setCoolant, setMode, loadScenario, reset } = useReactor();
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);
  const critical = state.temp >= LIMITS.tempCritical || state.mode === "scram";
  const warning = state.temp >= LIMITS.tempWarn;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportReactorReport(state, chartsRef.current, report);
    } finally {
      setExporting(false);
    }
  };


  const statusColor = critical ? "text-destructive" : warning ? "text-warn" : "text-primary";

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
            Central Nuclear · Unidad 01
          </p>
          <h1 className="glow-text text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            SALA DE CONTROL
          </h1>
        </div>
        <div className={`text-right ${statusColor}`}>
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Estado</p>
          <p className="glow-text text-lg font-bold">{MODE_LABEL[state.mode]}</p>
          <p className="text-xs text-muted-foreground">
            t + {Math.floor(state.elapsed)}s · combustible {state.fuel.toFixed(1)}%
          </p>
        </div>
      </header>

      <AnimatePresence>
        {state.alarms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="alarm-pulse mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3"
          >
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-destructive">
              ⚠ Alarma
            </span>
            <span className="text-xs text-destructive/90">{state.alarms.join(" · ")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Núcleo del reactor" className="lg:col-span-2">
          <ReactorCore
            flux={state.flux}
            temp={state.temp}
            rods={state.rods}
            critical={critical}
          />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Readout label="Potencia" value={`${Math.round(state.power)}`} unit="MW" />
            <Readout label="Energía" value={state.energy.toFixed(2)} unit="MWh" />
            <Readout label="Flujo n" value={state.flux.toFixed(1)} unit="%" />
            <Readout label="Varillas" value={Math.round(state.rods).toString()} unit="% ins." />
          </div>
        </Panel>

        <div className="grid gap-5">
          <Panel title="Instrumentación">
            <div className="grid grid-cols-2 gap-2">
              <Gauge
                value={state.temp}
                max={LIMITS.tempMelt}
                label="Temperatura"
                unit="°C"
                tone={critical ? "danger" : warning ? "warn" : "neon"}
                size={150}
              />
              <Gauge
                value={state.pressure}
                max={200}
                label="Presión"
                unit="bar"
                tone={state.pressure >= LIMITS.pressureWarn ? "danger" : "accent"}
                size={150}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Gauge
                value={state.power}
                max={LIMITS.maxPower}
                label="Potencia"
                unit="MW"
                tone="plasma"
                size={150}
              />
              <Gauge
                value={state.flux}
                max={100}
                label="Neutrones"
                unit="%"
                tone="neon"
                size={150}
              />
            </div>
          </Panel>

          <Panel title="Controles">
            <div className="space-y-5">
              <ControlSlider
                label="Varillas de control (inserción)"
                value={state.rods}
                onChange={setRods}
                disabled={state.mode === "scram"}
                hint={state.rods > 80 ? "Reactor frenado" : "Reacción en cadena activa"}
              />
              <ControlSlider
                label="Caudal de refrigerante"
                value={state.coolant}
                onChange={setCoolant}
                hint={`${Math.round(state.coolant)}% de capacidad de bombas`}
              />
              <div className="grid grid-cols-2 gap-2">
                {MODES.map((m) => (
                  <Button
                    key={m.id}
                    variant={state.mode === m.id ? "default" : "outline"}
                    className={
                      m.id === "scram"
                        ? "border-destructive/60 text-destructive hover:bg-destructive/15"
                        : ""
                    }
                    onClick={() => setMode(m.id)}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={reset}>
                Reiniciar simulación
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel
          title="Escenarios de práctica"
          right={
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary">
              {state.scenario}
            </span>
          }
        >
          <div className="grid gap-2">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => {
                  setReport(null);
                  loadScenario(sc);
                }}
                className="rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/60 hover:bg-secondary/60"
              >
                <p className="text-sm font-bold text-primary">{sc.name}</p>
                <p className="text-[11px] text-muted-foreground">{sc.description}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Registro cronológico"
          right={
            <span className="text-[10px] text-muted-foreground">{state.events.length} eventos</span>
          }
        >
          <EventLog events={state.events} />
        </Panel>

        <Panel
          title="Análisis de incidente (IA)"
          right={
            <Button size="sm" variant="outline" disabled={exporting} onClick={handleExport}>
              {exporting ? "Generando…" : "Exportar PDF"}
            </Button>
          }
        >
          <IncidentAnalysis state={state} report={report} onReport={setReport} />
        </Panel>
      </div>

      <div ref={chartsRef} className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="Temperatura vs tiempo">
          <TrendChart
            data={state.history}
            dataKey="temp"
            color="var(--chart-2)"
            domain={[0, LIMITS.tempMelt]}
            unit="°C"
          />
        </Panel>
        <Panel title="Potencia generada vs tiempo">
          <TrendChart
            data={state.history}
            dataKey="power"
            color="var(--chart-1)"
            domain={[0, LIMITS.maxPower]}
            unit="MW"
          />
        </Panel>
        <Panel title="Uso de combustible">
          <FuelChart data={state.history} />
        </Panel>
      </div>

      <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Simulación educativa · los valores no representan un reactor real
      </p>
    </main>
  );
}

function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="glow-text text-xl font-bold text-primary">
        {value} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function ControlSlider({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-bold text-primary">{Math.round(value)}%</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={1}
        disabled={disabled ?? false}
        onValueChange={(vals) => onChange(vals[0] ?? 0)}
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
