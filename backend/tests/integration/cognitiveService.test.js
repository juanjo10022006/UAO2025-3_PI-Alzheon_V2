import { jest } from "@jest/globals";

// Mock PRIMERO
jest.mock("../../services/geminiCognitiveAnalysisService.js", () => ({
  analizarArchivoCognitivoConGemini: jest.fn().mockResolvedValue({
    ok: true,
    model: "gemini-test",
    rawText: '{"ok":true}',
    parsed: { ok: true }
  })
}));

// DESPUÉS del jest.mock, importa
import {
  listTemplatesService,
  assignTemplateToPatientService,
  listMyAssignmentsService,
  createSubmissionService
} from "../../services/cogniteService.js";

import TestAssignment from "../../models/TestAssignment.js";
import TestSubmission from "../../models/TestSubmission.js";

import { makeDoctor, makePatient, makeCaregiver } from "../helpers/makeusers.js";
import { makeTemplate } from "../helpers/makeTemplates.js";
import { fakeFile } from "../helpers/fakefile.js";

describe("cognitiveService (integration)", () => {
  test("listTemplatesService crea plantillas por defecto si no existen", async () => {
    const templates = await listTemplatesService();
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates[0]).toHaveProperty("nombre");
  });

  test("assignTemplateToPatientService crea asignación activa", async () => {
    const patient = await makePatient();
    const doctor = await makeDoctor({ pacientesAsignados: [patient._id] });
    const template = await makeTemplate({ tipo: "firma" });

    const asignacion = await assignTemplateToPatientService({
      doctor,
      pacienteId: patient._id,
      plantillaId: template._id,
      frecuencia: "mensual"
    });

    expect(asignacion).toBeTruthy();
    expect(asignacion.estado).toBe("activo");

    const count = await TestAssignment.countDocuments();
    expect(count).toBe(1);
  });

  test("assignTemplateToPatientService devuelve existing si ya hay una activa igual", async () => {
    const patient = await makePatient();
    const doctor = await makeDoctor({ pacientesAsignados: [patient._id] });
    const template = await makeTemplate({ tipo: "firma" });

    const a1 = await assignTemplateToPatientService({
      doctor,
      pacienteId: patient._id,
      plantillaId: template._id
    });

    const a2 = await assignTemplateToPatientService({
      doctor,
      pacienteId: patient._id,
      plantillaId: template._id
    });

    expect(a2._id.toString()).toBe(a1._id.toString());
    expect(await TestAssignment.countDocuments()).toBe(1);
  });

  test("listMyAssignmentsService paciente ve sus asignaciones", async () => {
    const patient = await makePatient();
    const doctor = await makeDoctor({ pacientesAsignados: [patient._id] });
    const template = await makeTemplate();

    await assignTemplateToPatientService({
      doctor,
      pacienteId: patient._id,
      plantillaId: template._id
    });

    const asignaciones = await listMyAssignmentsService({ user: patient });
    expect(asignaciones.length).toBe(1);
  });

  test("listMyAssignmentsService cuidador ve asignaciones del paciente asociado", async () => {
    const patient = await makePatient();
    const caregiver = await makeCaregiver({ pacienteAsociado: patient._id });

    const doctor = await makeDoctor({ pacientesAsignados: [patient._id] });
    const template = await makeTemplate();

    await assignTemplateToPatientService({
      doctor,
      pacienteId: patient._id,
      plantillaId: template._id
    });

    const asignaciones = await listMyAssignmentsService({ user: caregiver });
    expect(asignaciones.length).toBe(1);
  });
});