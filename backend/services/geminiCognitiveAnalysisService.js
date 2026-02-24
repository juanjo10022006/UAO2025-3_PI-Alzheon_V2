import fs from "node:fs/promises";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY_VILA;
const modelName = process.env.GEMINI_MODEL_VILA;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function limpiarJsonTexto(text) {
  if (!text) return null;
  const clean = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

function construirPrompt({ plantilla, notas }) {
  const tipo = plantilla?.tipo || "desconocido";
  const nombre = plantilla?.nombre || "Prueba cognitiva";
  const instrucciones = plantilla?.instrucciones || "";

  return `
Eres un asistente de apoyo clínico para seguimiento cognitivo en pacientes con posible deterioro cognitivo.
Analiza SOLO de forma observacional la imagen/PDF enviado por paciente o cuidador.

IMPORTANTE:
- NO emitas diagnóstico médico definitivo.
- NO afirmes Alzheimer ni otra enfermedad.
- Describe hallazgos visuales/estructurales observables.
- Señala limitaciones si la calidad del archivo es baja.
- Responde SOLO en JSON válido.

Contexto de la prueba:
- nombrePlantilla: ${nombre}
- tipoPlantilla: ${tipo}
- instruccionesPlantilla: ${instrucciones}
- notasDelUsuario: ${notas || ""}

Devuelve este JSON EXACTAMENTE con esta estructura:
{
  "tipoPrueba": "firma|dibujo|otro",
  "resumenObservacional": "string",
  "indicadores": [
    {
      "nombre": "legibilidad|alineacion|coherencia_trazo|estructura_dibujo|orientacion_temporal|motricidad_fina|otro",
      "observacion": "string",
      "nivel": "bajo|medio|alto|no_evaluable"
    }
  ],
  "comparabilidadFutura": {
    "util": true,
    "motivo": "string"
  },
  "alertas": ["string"],
  "calidadArchivo": {
    "nivel": "buena|media|baja",
    "motivo": "string"
  },
  "recomendacionParaMedico": "string",
  "descargo": "Análisis automatizado de apoyo, no reemplaza criterio médico."
}
`.trim();
}

export async function analizarArchivoCognitivoConGemini({ file, plantilla, notas = "" }) {
  if (!ai) {
    return {
      ok: false,
      reason: "NO_API_KEY",
      rawText: null,
      parsed: null,
      model: null
    };
  }

  if (!file?.path || !file?.mimetype) {
    throw new Error("Archivo inválido para análisis IA");
  }

  const bytes = await fs.readFile(file.path);
  const base64Data = Buffer.from(bytes).toString("base64");

  const prompt = construirPrompt({ plantilla, notas });

  // Gemini soporta análisis multimodal de imágenes y documentos (PDF),
  // y puede recibir inlineData en JS. :contentReference[oaicite:11]{index=11}
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      { text: prompt },
      {
        inlineData: {
          mimeType: file.mimetype,
          data: base64Data
        }
      }
    ]
  });

  const rawText = response?.text || "";
  const parsed = limpiarJsonTexto(rawText);

  return {
    ok: true,
    model: modelName,
    rawText,
    parsed
  };
}