import jsPDF from "jspdf";
import { formatClock, LIMITS, MODE_LABEL, type ReactorState } from "./reactor";
import type { IncidentReport } from "./incident.functions";

const M = 14;

export async function exportReactorReport(
  state: ReactorState,
  chartsEl: HTMLElement | null,
  incident?: IncidentReport | null,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  let y = M;

  const line = (text: string, size = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, w - M * 2) as string[];
    for (const l of lines) {
      if (y > h - M) {
        doc.addPage();
        y = M;
      }
      doc.text(l, M, y);
      y += size * 0.52 + 1.6;
    }
  };

  doc.setFillColor(12, 18, 32);
  doc.rect(0, 0, w, 26, "F");
  doc.setTextColor(120, 225, 245);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("INFORME DE SIMULACIÓN — REACTOR UNIDAD 01", M, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generado: ${new Date().toLocaleString("es")}  ·  Escenario: ${state.scenario}`,
    M,
    20,
  );
  doc.setTextColor(20, 20, 20);
  y = 34;

  line("MÉTRICAS FINALES", 12, true);
  y += 1;
  const metrics: [string, string][] = [
    ["Duración", `${formatClock(state.elapsed)} (${Math.round(state.elapsed)} s)`],
    ["Modo final", MODE_LABEL[state.mode]],
    ["Temperatura del núcleo", `${state.temp.toFixed(0)} °C (crítico ${LIMITS.tempCritical})`],
    ["Presión", `${state.pressure.toFixed(1)} bar`],
    ["Potencia", `${state.power.toFixed(0)} MW`],
    ["Energía generada", `${state.energy.toFixed(3)} MWh`],
    ["Flujo neutrónico", `${state.flux.toFixed(1)} %`],
    ["Varillas insertadas", `${state.rods.toFixed(0)} %`],
    ["Refrigerante", `${state.coolant.toFixed(0)} %`],
    ["Combustible restante", `${state.fuel.toFixed(1)} %`],
  ];
  for (const [k, v] of metrics) line(`• ${k}: ${v}`);
  y += 3;

  line("ALARMAS ACTIVAS AL CIERRE", 12, true);
  if (state.alarms.length) state.alarms.forEach((a) => line(`• ${a}`));
  else line("• Ninguna");
  y += 3;

  const chartW = w - M * 2;
  const chartH = 42;

  const drawChart = (
    title: string,
    values: number[],
    maxValue: number,
    color: [number, number, number],
    unit: string,
  ) => {
    if (y + chartH + 16 > h - M) {
      doc.addPage();
      y = M;
    }
    line(title, 11, true);
    const top = y;
    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.2);
    doc.rect(M, top, chartW, chartH);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 130);
    doc.text(`${Math.round(maxValue)} ${unit}`, M + 1, top + 3.2);
    doc.text(`0 ${unit}`, M + 1, top + chartH - 1.2);
    doc.setTextColor(20, 20, 20);

    if (values.length > 1) {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.5);
      const stepX = chartW / (values.length - 1);
      for (let i = 1; i < values.length; i += 1) {
        const p = values[i - 1] ?? 0;
        const c = values[i] ?? 0;
        doc.line(
          M + (i - 1) * stepX,
          top + chartH - (Math.min(p, maxValue) / maxValue) * chartH,
          M + i * stepX,
          top + chartH - (Math.min(c, maxValue) / maxValue) * chartH,
        );
      }
    }
    y = top + chartH + 6;
  };

  line("GRÁFICAS DE LA SIMULACIÓN", 12, true);
  y += 1;
  drawChart(
    "Temperatura vs tiempo",
    state.history.map((s) => s.temp),
    LIMITS.tempMelt,
    [225, 140, 40],
    "°C",
  );
  drawChart(
    "Potencia generada vs tiempo",
    state.history.map((s) => s.power),
    LIMITS.maxPower,
    [40, 170, 210],
    "MW",
  );
  drawChart(
    "Uso de combustible",
    state.history.map((s) => s.fuel),
    100,
    [150, 90, 220],
    "%",
  );
  void chartsEl;

  doc.addPage();
  y = M;
  line("REGISTRO CRONOLÓGICO DE EVENTOS", 12, true);
  y += 1;
  if (state.events.length) {
    for (const e of state.events) {
      line(`[${formatClock(e.t)}] ${e.kind.toUpperCase()} — ${e.message}`, 9);
    }
  } else {
    line("Sin eventos registrados.");
  }

  if (incident) {
    y += 5;
    line("ANÁLISIS ASISTIDO POR IA", 12, true);
    line(`Severidad: ${incident.severity.toUpperCase()} — ${incident.titulo}`, 10, true);
    line(incident.resumen);
    y += 2;
    line("Causas probables:", 10, true);
    incident.causas.forEach((c) => line(`• ${c}`));
    line("Acciones recomendadas:", 10, true);
    incident.acciones.forEach((a) => line(`• ${a}`));
    line("Pronóstico:", 10, true);
    line(incident.pronostico);
  }

  doc.save(`informe-reactor-${Date.now()}.pdf`);
}
