import Usuario from "../models/usuario.js";
import TestTemplate from "../models/TestTemplate.js";
import TestAssignment from "../models/TestAssignment.js";
import TestSubmission from "../models/TestSubmission.js"

function includesObjectId(arr, id) {
  if (!Array.isArray(arr)) return false;
  return arr.some((x) => x?.toString?.() === id?.toString?.());
}

// (Opcional) crea las 2 plantillas por defecto si no existen
async function ensureDefaultTemplates() {
  const count = await TestTemplate.countDocuments();
  if (count > 0) return;

  await TestTemplate.insertMany([
    {
      name: "Firma y fecha",
      type: "signature",
      instructions: "Realiza tu firma y escribe la fecha.",
      assetUrl: "/assets/templates/firma-fecha-v1.pdf",
      version: 1,
      isActive: true
    },
    {
      name: "Repetición de dibujo",
      type: "repeat-drawing",
      instructions: "Realiza el mismo dibujo indicado en la plantilla.",
      assetUrl: "/assets/templates/repetir-dibujo-v1.pdf",
      version: 1,
      isActive: true
    }
  ]);
}

export async function listTemplatesService() {
  await ensureDefaultTemplates();
  return TestTemplate.find({ isActive: true }).sort({ createdAt: 1 }).lean();
}

export async function assignTemplateToPatientService({ doctor, patientId, templateId, frequency }) {
  const patient = await Usuario.findById(patientId).lean();
  if (!patient) throw Object.assign(new Error("Paciente no encontrado"), { status: 404 });
  if (patient.rol !== "paciente") throw Object.assign(new Error("El usuario no es paciente"), { status: 400 });

  const template = await TestTemplate.findById(templateId).lean();
  if (!template || !template.isActive) throw Object.assign(new Error("Plantilla inválida"), { status: 400 });

  // Permiso (suave): si el doctor tiene pacientesAsignados, y NO incluye al paciente -> 403
  if (Array.isArray(doctor.pacientesAsignados) && doctor.pacientesAsignados.length > 0) {
    if (!includesObjectId(doctor.pacientesAsignados, patientId)) {
      throw Object.assign(new Error("No tienes asignado este paciente"), { status: 403 });
    }
  }

  // Evitar duplicado activo de la misma plantilla
  const existing = await TestAssignment.findOne({
    doctorId: doctor._id,
    patientId,
    templateId,
    status: "active"
  });

  if (existing) return existing;

  return TestAssignment.create({
    doctorId: doctor._id,
    patientId,
    templateId,
    frequency: frequency || "monthly",
    status: "active",
    startDate: new Date()
  });
}

export async function listMyAssignmentsService({ user }) {
  let patientId;

  if (user.rol === "paciente") {
    patientId = user._id;
  } else if (user.rol === "cuidador/familiar") {
    if (!user.pacienteAsociado) {
      throw Object.assign(new Error("El cuidador/familiar no tiene paciente asociado"), { status: 400 });
    }
    patientId = user.pacienteAsociado;
  } else {
    throw Object.assign(new Error("Rol no permitido"), { status: 403 });
  }

  const assignments = await TestAssignment.find({ patientId, status: "active" })
    .populate("templateId", "name type instructions assetUrl version")
    .populate("doctorId", "nombre email")
    .sort({ createdAt: -1 });

  return assignments;
}

export async function createSubmissionService({ user, assignmentId, file, notes }) {
  if (!file) throw Object.assign(new Error("Debes adjuntar un archivo (png/jpg/pdf)"), { status: 400 });

  // Determinar patientId según rol
  let patientId;
  if (user.rol === "paciente") patientId = user._id;
  if (user.rol === "cuidador/familiar") patientId = user.pacienteAsociado;

  if (!patientId) throw Object.assign(new Error("No se pudo determinar el paciente"), { status: 400 });

  const assignment = await TestAssignment.findById(assignmentId).lean();
  if (!assignment) throw Object.assign(new Error("Asignación no encontrada"), { status: 404 });
  if (assignment.status !== "active") throw Object.assign(new Error("Asignación no activa"), { status: 400 });

  // Seguridad: el submission debe corresponder al paciente
  if (assignment.patientId.toString() !== patientId.toString()) {
    throw Object.assign(new Error("Esta asignación no pertenece a este paciente"), { status: 403 });
  }

  // Como sirves /uploads estático, construimos URL pública local:
  const filename = file.filename;
  const fileUrl = `/uploads/submissions/${filename}`;

  const submission = await TestSubmission.create({
    assignmentId: assignment._id,
    patientId: assignment.patientId,
    doctorId: assignment.doctorId,
    templateId: assignment.templateId,

    submittedBy: user._id,

    fileUrl,
    mimeType: file.mimetype,
    originalName: file.originalname,
    size: file.size,
    notes: notes || ""
  });

  return submission;
}

export async function listPatientSubmissionsService({ doctor, patientId }) {
  // Permiso (suave): si el doctor tiene pacientesAsignados y no incluye -> 403
  if (Array.isArray(doctor.pacientesAsignados) && doctor.pacientesAsignados.length > 0) {
    if (!includesObjectId(doctor.pacientesAsignados, patientId)) {
      throw Object.assign(new Error("No tienes asignado este paciente"), { status: 403 });
    }
  }

  return TestSubmission.find({ patientId, doctorId: doctor._id })
    .populate("templateId", "name type assetUrl version")
    .populate("submittedBy", "nombre rol")
    .sort({ createdAt: -1 });
}