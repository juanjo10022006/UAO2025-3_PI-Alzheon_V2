import TestTemplate from "../../models/TestTemplate.js";

export async function makeTemplate({ tipo = "firma", isActivo = true } = {}) {
  return TestTemplate.create({
    nombre: "Plantilla Test",
    tipo,
    instrucciones: "Instrucciones",
    assetUrl: "/assets/templates/demo.pdf",
    version: 1,
    isActivo
  });
}