import { createServerFn } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const IncidentInput = z.object({
  mode: z.string(),
  temp: z.number(),
  pressure: z.number(),
  power: z.number(),
  flux: z.number(),
  rods: z.number(),
  coolant: z.number(),
  fuel: z.number(),
  alarms: z.array(z.string()),
  events: z.array(z.string()),
  notes: z.string(),
});

export type IncidentInputData = z.infer<typeof IncidentInput>;

const IncidentSchema = z.object({
  severity: z.enum(["normal", "aviso", "critico", "emergencia"]),
  titulo: z.string(),
  resumen: z.string(),
  causas: z.array(z.string()),
  acciones: z.array(z.string()),
  pronostico: z.string(),
});

export type IncidentReport = z.infer<typeof IncidentSchema>;

export const analyzeIncident = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => IncidentInput.parse(input))
  .handler(async ({ data }): Promise<IncidentReport> => {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) throw new Error("Falta OPENAI_API_KEY");

    const openai = createOpenAI({ apiKey: key });

    const prompt = [
      "Eres el ingeniero jefe de una sala de control nuclear (simulación educativa).",
      "Analiza las condiciones reportadas y redacta un informe de incidente en español.",
      "Sé concreto y operativo. Máximo 3 causas y 5 acciones, cada una en una frase corta.",
      "",
      `Modo: ${data.mode}`,
      `Temperatura del núcleo: ${data.temp.toFixed(0)} °C (umbral crítico 560 °C)`,
      `Presión: ${data.pressure.toFixed(1)} bar (aviso 165 bar)`,
      `Potencia: ${data.power.toFixed(0)} MW`,
      `Flujo neutrónico: ${data.flux.toFixed(1)} %`,
      `Varillas de control insertadas: ${data.rods.toFixed(0)} %`,
      `Refrigerante: ${data.coolant.toFixed(0)} %`,
      `Combustible restante: ${data.fuel.toFixed(1)} %`,
      `Alarmas activas: ${data.alarms.length ? data.alarms.join(", ") : "ninguna"}`,
      "",
      "Últimos eventos registrados:",
      ...(data.events.length ? data.events.map((e) => `- ${e}`) : ["- sin eventos"]),
      "",
      `Notas del operador: ${data.notes || "(sin notas)"}`,
    ].join("\n");

    try {
      const result = streamText({
        model: openai("gpt-4o-mini"),
        output: Output.object({ schema: IncidentSchema }),
        prompt,
      });
      return await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("El modelo no devolvió un informe válido. Inténtalo de nuevo.");
      }
      throw error;
    }
  });
