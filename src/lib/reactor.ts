import { useCallback, useEffect, useRef, useState } from "react";

export type ReactorMode = "shutdown" | "startup" | "normal" | "scram";

export type EventKind = "mode" | "alarm" | "scram" | "rods" | "scenario" | "info";

export interface ReactorEvent {
  id: number;
  t: number; // seconds of simulation
  kind: EventKind;
  message: string;
}

export interface ReactorSample {
  t: number;
  temp: number;
  power: number;
  flux: number;
  fuel: number;
}

export interface ReactorState {
  mode: ReactorMode;
  rods: number; // % inserted (100 = fully inserted)
  temp: number; // °C
  flux: number; // % of nominal neutron flux
  pressure: number; // bar
  power: number; // MW
  energy: number; // MWh accumulated
  fuel: number; // % remaining
  coolant: number; // % pump capacity
  elapsed: number; // seconds
  history: ReactorSample[];
  alarms: string[];
  events: ReactorEvent[];
  scenario: string;
}

export const LIMITS = {
  tempWarn: 480,
  tempCritical: 560,
  tempMelt: 680,
  pressureWarn: 165,
  maxPower: 1250,
};

const TICK_MS = 120;
const MAX_POINTS = 120;
const MAX_EVENTS = 200;

export const MODE_LABEL: Record<ReactorMode, string> = {
  shutdown: "APAGADO",
  startup: "ARRANQUE",
  normal: "OPERACIÓN NORMAL",
  scram: "EMERGENCIA · SCRAM",
};

export interface Scenario {
  id: string;
  name: string;
  description: string;
  apply: (s: ReactorState) => Partial<ReactorState>;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "startup",
    name: "Arranque en frío",
    description: "Reactor frío, varillas casi insertadas. Sube potencia poco a poco.",
    apply: () => ({
      mode: "startup",
      rods: 88,
      temp: 40,
      flux: 2,
      coolant: 70,
      fuel: 100,
    }),
  },
  {
    id: "stable",
    name: "Operación estable",
    description: "Régimen nominal con refrigeración adecuada y temperatura controlada.",
    apply: () => ({
      mode: "normal",
      rods: 52,
      temp: 330,
      flux: 46,
      coolant: 80,
      fuel: 92,
    }),
  },
  {
    id: "ramp",
    name: "Aumento rápido de temperatura",
    description: "Varillas muy extraídas y bombas al mínimo: la temperatura se dispara.",
    apply: () => ({
      mode: "normal",
      rods: 22,
      temp: 430,
      flux: 74,
      coolant: 32,
      fuel: 76,
    }),
  },
  {
    id: "emergency",
    name: "Emergencia inminente",
    description: "Núcleo al límite con refrigeración degradada. Practica el SCRAM.",
    apply: () => ({
      mode: "normal",
      rods: 8,
      temp: 520,
      flux: 92,
      coolant: 20,
      fuel: 58,
    }),
  },
];

let eventSeq = 0;
function mkEvent(t: number, kind: EventKind, message: string): ReactorEvent {
  eventSeq += 1;
  return { id: eventSeq, t: Math.round(t * 10) / 10, kind, message };
}

function pushEvents(s: ReactorState, events: ReactorEvent[]): ReactorEvent[] {
  return [...s.events, ...events].slice(-MAX_EVENTS);
}

const initialState: ReactorState = {
  mode: "shutdown",
  rods: 100,
  temp: 24,
  flux: 0,
  pressure: 1,
  power: 0,
  energy: 0,
  fuel: 100,
  coolant: 60,
  elapsed: 0,
  history: [],
  alarms: [],
  events: [],
  scenario: "libre",
};

function step(s: ReactorState): ReactorState {
  const dt = TICK_MS / 1000;
  const scrammed = s.mode === "scram";
  const rods = scrammed ? Math.min(100, s.rods + 260 * dt) : s.rods;

  const fuelFactor = Math.max(0, s.fuel / 100);
  const reactivity = Math.max(0, (100 - rods) / 100) * fuelFactor;

  const targetFlux = reactivity * 100;
  const noise = s.flux > 0.5 ? (Math.random() - 0.5) * 2.2 : 0;
  const flux = Math.max(0, s.flux + (targetFlux - s.flux) * 2.2 * dt + noise * dt);

  const heat = flux * 7.4;
  const cooling = (s.temp - 24) * (0.35 + (s.coolant / 100) * 0.9);
  const temp = Math.max(20, s.temp + (heat - cooling) * 0.45 * dt);

  const pressure = Math.max(1, 1 + Math.pow(Math.max(0, temp - 60) / 100, 1.65) * 42);
  const power = Math.max(0, (flux / 100) * LIMITS.maxPower * (0.6 + (s.coolant / 100) * 0.4));
  const energy = s.energy + (power * dt) / 3600;
  const fuel = Math.max(0, s.fuel - flux * 0.00045 * dt * 10);

  const alarms: string[] = [];
  if (temp >= LIMITS.tempWarn) alarms.push("TEMPERATURA ELEVADA");
  if (temp >= LIMITS.tempCritical) alarms.push("NÚCLEO EN ESTADO CRÍTICO");
  if (pressure >= LIMITS.pressureWarn) alarms.push("SOBREPRESIÓN EN CIRCUITO PRIMARIO");
  if (fuel < 15) alarms.push("COMBUSTIBLE BAJO");
  if (s.coolant < 25 && flux > 10) alarms.push("REFRIGERACIÓN INSUFICIENTE");

  const elapsed = s.elapsed + dt;
  const newEvents: ReactorEvent[] = [];

  for (const a of alarms) {
    if (!s.alarms.includes(a)) newEvents.push(mkEvent(elapsed, "alarm", `Alarma activada: ${a}`));
  }
  for (const a of s.alarms) {
    if (!alarms.includes(a)) newEvents.push(mkEvent(elapsed, "info", `Alarma resuelta: ${a}`));
  }

  let mode = s.mode;
  if (temp >= LIMITS.tempCritical && mode !== "scram") {
    mode = "scram";
    newEvents.push(
      mkEvent(
        elapsed,
        "scram",
        `SCRAM automático por temperatura crítica (${Math.round(temp)} °C)`,
      ),
    );
  }
  if (mode === "startup" && flux > 25 && temp > 180) {
    mode = "normal";
    newEvents.push(mkEvent(elapsed, "mode", "Transición a OPERACIÓN NORMAL"));
  }
  if (mode === "scram" && rods >= 100 && temp < 120 && flux < 0.5) {
    mode = "shutdown";
    newEvents.push(mkEvent(elapsed, "mode", "Reactor estabilizado en APAGADO"));
  }

  const sample: ReactorSample = {
    t: Math.round(elapsed * 10) / 10,
    temp: Math.round(temp),
    power: Math.round(power),
    flux: Math.round(flux * 10) / 10,
    fuel: Math.round(fuel * 10) / 10,
  };
  const history = [...s.history, sample].slice(-MAX_POINTS);

  return {
    ...s,
    mode,
    rods,
    flux,
    temp,
    pressure,
    power,
    energy,
    fuel,
    elapsed,
    history,
    alarms,
    events: newEvents.length ? pushEvents(s, newEvents) : s.events,
  };
}

export function formatClock(t: number) {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
}

export function useReactor() {
  const [state, setState] = useState<ReactorState>(initialState);
  const lastLoggedRods = useRef(100);

  useEffect(() => {
    const id = setInterval(() => setState(step), TICK_MS);
    return () => clearInterval(id);
  }, []);

  const setRods = useCallback((rods: number) => {
    setState((s) => {
      if (s.mode === "scram") return s;
      let events = s.events;
      if (Math.abs(rods - lastLoggedRods.current) >= 8) {
        const dir = rods > lastLoggedRods.current ? "Inserción" : "Extracción";
        lastLoggedRods.current = rods;
        events = pushEvents(s, [
          mkEvent(s.elapsed, "rods", `${dir} de varillas → ${Math.round(rods)} % insertadas`),
        ]);
      }
      return { ...s, rods, events };
    });
  }, []);

  const setCoolant = useCallback((coolant: number) => {
    setState((s) => ({ ...s, coolant }));
  }, []);

  const setMode = useCallback((mode: ReactorMode) => {
    setState((s) => {
      if (s.mode === mode) return s;
      const events = pushEvents(s, [
        mkEvent(
          s.elapsed,
          mode === "scram" ? "scram" : "mode",
          mode === "scram"
            ? "SCRAM manual activado por el operador"
            : `Cambio de modo → ${MODE_LABEL[mode]}`,
        ),
      ]);
      const base = { ...s, mode, events };
      if (mode === "scram" || mode === "shutdown") return { ...base, rods: 100 };
      if (mode === "startup") return { ...base, rods: Math.min(s.rods, 82) };
      return { ...base, rods: Math.min(s.rods, 45) };
    });
  }, []);

  const loadScenario = useCallback((scenario: Scenario) => {
    setState((s) => {
      const patch = scenario.apply(s);
      lastLoggedRods.current = patch.rods ?? s.rods;
      return {
        ...initialState,
        ...patch,
        scenario: scenario.name,
        elapsed: 0,
        history: [],
        energy: 0,
        events: [mkEvent(0, "scenario", `Escenario cargado: ${scenario.name}`)],
      };
    });
  }, []);

  const reset = useCallback(() => {
    lastLoggedRods.current = 100;
    setState({ ...initialState, history: [], events: [], scenario: "libre" });
  }, []);

  return { state, setRods, setCoolant, setMode, loadScenario, reset };
}
