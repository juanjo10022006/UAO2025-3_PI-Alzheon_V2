import {
  listTemplatesService,
  assignTemplateToPatientService,
  listMyAssignmentsService,
  createSubmissionService,
  listPatientSubmissionsService
} from "../services/cogniteService.js";

function handleError(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Error interno" });
}

export async function listTemplatesController(req, res) {
  try {
    const plantillas = await listTemplatesService();
    res.json({ plantillas });
  } catch (err) {
    handleError(res, err);
  }
}

export async function assignTemplateToPatientController(req, res) {
  try {
    const { idPaciente } = req.params;
    const { plantillaId, frecuencia } = req.body;

    if (!plantillaId) {
      return res.status(400).json({ error: "plantillaId es requerido" });
    }

    const asignacion = await assignTemplateToPatientService({
      doctor: req.usuario,
      pacienteId: idPaciente,
      plantillaId,
      frecuencia
    });

    res.status(201).json({ asignacion });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listMyAssignmentsController(req, res) {
  try {
    const asignaciones = await listMyAssignmentsService({ user: req.usuario });
    res.json({ asignaciones });
  } catch (err) {
    handleError(res, err);
  }
}

export async function createSubmissionController(req, res) {
  try {
    const { idAsignacion } = req.params;
    const { notas } = req.body;

    const submission = await createSubmissionService({
      user: req.usuario,
      idAsignacion,
      file: req.file,
      notas
    });

    res.status(201).json({
      submission,
      analisisIA: submission.analisisIA ?? null,
    });
  } catch (err) {
    handleError(res, err);
  }
}

export async function listPatientSubmissionsController(req, res) {
  try {
    const { idPaciente } = req.params;

    const submissions = await listPatientSubmissionsService({
      doctor: req.usuario,
      idPaciente
    });

    res.json({ submissions });
  } catch (err) {
    handleError(res, err);
  }
}

