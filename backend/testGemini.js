import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY_VILA;
const model = process.env.GEMINI_MODEL_VILA || "gemini-2.5-flash";

console.log("KEY cargada?", !!apiKey);
console.log("Modelo:", model);

const ai = new GoogleGenAI({ apiKey });

try {
  console.log("Llamando a Gemini...");
  const res = await ai.models.generateContent({
    model,
    contents: [
      { role: "user", parts: [{ text: "Responde solo: OK" }] }
    ]
  });

  console.log("Respuesta:", res.text);
} catch (err) {
  console.error("ERROR Gemini:", err?.message);
  console.error("ERROR name:", err?.name);
  console.error("ERROR cause:", err?.cause);
}