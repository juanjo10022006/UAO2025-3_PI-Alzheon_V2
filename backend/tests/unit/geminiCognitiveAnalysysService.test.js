import { analizarArchivoCognitivoConGemini } from "../../services/geminiCognitiveAnalysisService.js";


describe("geminiCognitiveAnalysisService (unit)", () => {
  test("si no hay API key, devuelve ok=false y reason=NO_API_KEY", async () => {
    const prev = process.env.GEMINI_API_KEY_VILA;
    delete process.env.GEMINI_API_KEY_VILA;

    const res = await analizarArchivoCognitivoConGemini({
      file: { path: "x", mimetype: "application/pdf" },
      plantilla: { tipo: "firma", nombre: "x", instrucciones: "y" },
      notas: ""
    });

    expect(res.ok).toBe(false);
    expect(res.reason).toBe("NO_API_KEY");

    if (prev) process.env.GEMINI_API_KEY_VILA = prev;
  });
});