import Usuario from "../models/usuario.js";
import TestTemplate from "../models/TestTemplate.js";
import TestAssignment from "../models/TestAssignment.js";
import TestSubmission from "../models/TestSubmission.js";

function includesObjectId(arr, id) {
  if (!Array.isArray(arr)) return false;
  return arr.some((x) => x?.toString?.() === id?.toString?.());
}

async function ensureDefaultTemplates() {
  const count = await TestTemplate.countDocuments();
  if (count > 0) return;

  await TestTemplate.insertMany([
    {
      nombre: "Firma y fecha",
      tipo: "firma",
      instrucciones: "Realiza tu firma y escribe la fecha.",
      assetUrl: "/assets/templates/firma-fecha-v1.pdf",
      version: 1,
      isActivo: true
    },
    {
      nombre: "Repetición de dibujo",
      tipo: "dibujo",
      instrucciones: "Realiza el mismo dibujo indicado en la plantilla.",
      assetUrl: "/assets/templates/repetir-dibujo-v1.pdf",
      version: 1,
      isActivo: true
    }
  ]);
}

export async function listTemplatesService() {
  await ensureDefaultTemplates();
  return TestTemplate.find({ isActivo: true }).sort({ nombre: 1 }).lean();
}

export async function assignTemplateToPatientService({doctor,pacienteId,plantillaId,frecuencia}) {
  const paciente = await Usuario.findById(pacienteId).lean();
  if (!paciente) throw Object.assign(new Error("Paciente no encontrado"), { status: 404 });
  if (paciente.rol !== "paciente") throw Object.assign(new Error("El usuario no es paciente"), { status: 400 });

  const plantilla = await TestTemplate.findById(plantillaId).lean();
  if (!plantilla || !plantilla.isActivo) {
    throw Object.assign(new Error("Plantilla inválida o inactiva"), { status: 400 });
  }
  if (Array.isArray(doctor.pacientesAsignados) && doctor.pacientesAsignados.length > 0) {
    if (!includesObjectId(doctor.pacientesAsignados, pacienteId)) {
      throw Object.assign(new Error("No tienes asignado este paciente"), { status: 403 });
    }
  }

  const existing = await TestAssignment.findOne({
    doctorId: doctor._id,
    pacienteId,
    plantillaId,
    estado: "activo"
  });

  if (existing) return existing;

  const asignacion = await TestAssignment.create({
    doctorId: doctor._id,
    pacienteId,
    plantillaId,
    frecuencia: frecuencia || "mensual",
    estado: "activo",
    fechaInicio: new Date()
  });

  return asignacion;
}

export async function listMyAssignmentsService({ user }) {
  let pacienteId;

  if (user.rol === "paciente") {
    pacienteId = user._id;
  } else if (user.rol === "cuidador/familiar") {
    if (!user.pacienteAsociado) {
      throw Object.assign(new Error("El cuidador/familiar no tiene paciente asociado"), { status: 400 });
    }
    pacienteId = user.pacienteAsociado;
  } else {
    throw Object.assign(new Error("Rol no permitido"), { status: 403 });
  }

  return TestAssignment.find({ pacienteId, estado: "activo" })
    .populate("plantillaId", "nombre tipo instrucciones assetUrl version isActivo")
    .populate("doctorId", "nombre email")
    .sort({ createdAt: -1 });
}

export async function createSubmissionService({ user, idAsignacion, file, notas }) {
  if (!file) throw Object.assign(new Error("Debes adjuntar un archivo (png/jpg/pdf)"), { status: 400 });

  let pacienteId;
  if (user.rol === "paciente") pacienteId = user._id;
  if (user.rol === "cuidador/familiar") pacienteId = user.pacienteAsociado;

  if (!pacienteId) throw Object.assign(new Error("No se pudo determinar el paciente"), { status: 400 });

  const asignacion = await TestAssignment.findById(idAsignacion).lean();
  if (!asignacion) throw Object.assign(new Error("Asignación no encontrada"), { status: 404 });
  if (asignacion.estado !== "activo") throw Object.assign(new Error("La asignación está pausada/inactiva"), { status: 400 });

  if (asignacion.pacienteId.toString() !== pacienteId.toString()) {
    throw Object.assign(new Error("Esta asignación no pertenece a este paciente"), { status: 403 });
  }

  const assetUrl = `/uploads/submissions/${file.filename}`;

  const submission = await TestSubmission.create({
    asignacionId: asignacion._id,
    pacienteId: asignacion.pacienteId,
    doctorId: asignacion.doctorId,
    plantillaId: asignacion.plantillaId,

    subidoPor: user._id,
    assetUrl,
    mimeType: file.mimetype,
    nombreOriginal: file.originalname,
    tamano: file.size,

    notas: notas || ""
  });

  return submission;
}

export async function listPatientSubmissionsService({ doctor, idPaciente }) {
  if (Array.isArray(doctor.pacientesAsignados) && doctor.pacientesAsignados.length > 0) {
    if (!includesObjectId(doctor.pacientesAsignados, idPaciente)) {
      throw Object.assign(new Error("No tienes asignado este paciente"), { status: 403 });
    }
  }

  return TestSubmission.find({ pacienteId: idPaciente, doctorId: doctor._id })
    .populate("plantillaId", "nombre tipo assetUrl version")
    .populate("subidoPor", "nombre rol")
    .sort({ createdAt: -1 });
}