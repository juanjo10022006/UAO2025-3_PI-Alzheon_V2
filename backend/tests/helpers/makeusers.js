import Usuario from "../../models/usuario.js";

export async function makeDoctor({ pacientesAsignados = [] } = {}) {
  return Usuario.create({
    nombre: "Dr. Juan",
    email: `doc${Date.now()}@test.com`,
    password: "123",
    rol: "medico",
    pacientesAsignados
  });
}

export async function makePatient() {
  return Usuario.create({
    nombre: "Paciente",
    email: `pac${Date.now()}@test.com`,
    password: "123",
    rol: "paciente"
  });
}

export async function makeCaregiver({ pacienteAsociado }) {
  return Usuario.create({
    nombre: "Cuidador",
    email: `cui${Date.now()}@test.com`,
    password: "123",
    rol: "cuidador/familiar",
    pacienteAsociado
  });
}