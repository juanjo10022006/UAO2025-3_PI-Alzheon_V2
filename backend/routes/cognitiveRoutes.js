import { authMiddleware, requireRole } from "../middleware/auth.js";
import { uploadSubmission } from "../middleware/uploadSubmission.js";

import {
  listTemplatesController,
  assignTemplateToPatientController,
  listMyAssignmentsController,
  createSubmissionController,
  listPatientSubmissionsController
} from "../controllers/cognitiveController.js";

import express from "express"

const router = express.Router();
//Querido Jorge, este get es para que el medico pueda listar todas las plantillas que hay (que por el momento solo son dos)
router.get("/plantillas", authMiddleware, requireRole("medico"), listTemplatesController);

//Jorge lindo, este post es para que el medico le asigne a un paciente una plantilla
router.post("/asignar/paciente/:idPaciente", authMiddleware, requireRole("medico"), assignTemplateToPatientController);

//Semidios Jorge, este get es para que el paciente pueda ver las plantillas que le ha asignado el medico, la idea es que el cuidador/familiar tambien pueda ver las plantillas que tiene asignado el paciente
router.get("/mis/asignaciones", authMiddleware, requireRole("paciente", "cuidador/familiar"), listMyAssignmentsController);

//Jesús, este es el endpoint de que el paciente sube sus resultados (ya sea que lo suba el paciente o el cuidador)
router.post("/resultados/asignacion/:idAsignacion", authMiddleware, requireRole("paciente", "cuidador/familiar"), uploadSubmission.single("file"), createSubmissionController);


//Y por ultimo mi querido Jorge este es el endpoint para que el medico pueda visualizar los resultados del paciente
router.get("/resultados/paciente/:idPaciente", authMiddleware, requireRole("medico"), listPatientSubmissionsController);

export default router;