# Reactor Zen Core

An interactive nuclear reactor control room simulator built for the web — control rod insertion, coolant flow, and reactor mode while watching temperature, pressure, power, and neutron flux respond in real time. Trigger a SCRAM, live through a meltdown scenario, and get an AI-generated incident report you can export as a PDF.

## Features

- **Real-time simulation** — a physics-flavored model ticks every 120ms, updating flux, heat, pressure, power output, energy accumulated, and fuel depletion.
- **Reactor modes** — `APAGADO` (shutdown), `ARRANQUE` (startup), `OPERACIÓN NORMAL` (normal), and `EMERGENCIA · SCRAM`, with automatic SCRAM triggered by critical core temperature.
- **Manual controls** — sliders for control rod insertion and coolant pump capacity.
- **Practice scenarios** — preset conditions (cold startup, stable operation, rapid temperature ramp, imminent emergency) to drill operator responses.
- **Live instrumentation** — animated gauges and charts for temperature, pressure, power, and neutron flux, plus a chronological event log.
- **AI incident analysis** — sends current reactor conditions to an LLM (via the Lovable AI Gateway) and returns a structured incident report (severity, causes, recommended actions, forecast).
- **PDF export** — generate a shareable report combining reactor state, charts, and the AI analysis.

> UI copy and generated reports are in Spanish; simulated values do not represent a real reactor.

## Tech stack

- [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- React 19 + TypeScript
- Tailwind CSS v4
- Radix UI primitives + shadcn-style components
- Recharts for live charts
- Vercel AI SDK (`ai`, `@ai-sdk/openai`) for the incident-analysis LLM call
- jsPDF for report export
- Vite + Nitro

Originally scaffolded with [Lovable](https://lovable.dev).

## Getting started

Requires Node.js. The repo includes both `bun.lock` and `package-lock.json`; either Bun or npm will work.

```sh
git clone https://github.com/ArtoriasDelAbismo/reactor-zen-core.git
cd reactor-zen-core
npm install   # or: bun install
npm run dev   # or: bun run dev
```

The app runs at `http://localhost:3000` (Vite dev server) by default.

### Environment variables

The AI incident-analysis feature calls the OpenAI API directly (`gpt-4o-mini`) and requires an API key:

```
OPENAI_API_KEY=your-key-here
```

Without it, the rest of the simulator (controls, gauges, charts, scenarios) still works — only "Análisis de incidente (IA)" will fail.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the codebase with Prettier |

## Project structure

```
src/
├── components/
│   ├── reactor/       # Reactor-specific UI: core visualization, gauges, charts, event log, incident analysis
│   └── ui/             # Reusable UI primitives (shadcn/Radix-based)
├── lib/
│   ├── reactor.ts              # Simulation state machine and physics model (useReactor hook)
│   ├── incident.functions.ts   # Server function that calls the LLM for incident analysis
│   └── report.ts                # PDF report generation
├── routes/
│   ├── __root.tsx      # Root layout
│   └── index.tsx        # Main control room page
├── router.tsx
├── server.ts
└── start.ts
```
