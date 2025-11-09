import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5500'

export const medicoApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Interfaces
export interface MedicoPatient {
  _id: string
  nombre: string
  email: string
  createdAt: string
  cuidadores: {
    _id: string
    nombre: string
    email: string
  }[]
  estadisticas?: {
    totalFotos: number
    totalGrabaciones: number
    grabacionesEstaSemana: number
    metaSemanal: number
  }
}

export interface PatientDetails extends MedicoPatient {
  estadisticas: {
    totalFotos: number
    totalGrabaciones: number
    grabacionesEstaSemana: number
    metaSemanal: number
    sesionesCompletadas: number
    ultimaGrabacion: {
      fecha: string
      duracion: number
    } | null
  }
}

export interface MedicoPhoto {
  _id: string
  etiqueta: string
  url_contenido: string
  descripcion?: string
  pacienteId: string
  cuidadorId: {
    _id: string
    nombre: string
    email: string
  }
  createdAt: string
}

export interface MedicoRecording {
  _id: string
  photoId: string
  fotoUrl: string
  fecha: string
  duracion: number
  audioUrl?: string
  nota?: string
  descripcionTexto?: string
  transcripcion?: string
  tipoContenido?: 'audio' | 'texto' | 'ambos'
}

export interface Caregiver {
  _id: string
  nombre: string
  email: string
  pacienteAsociado?: {
    _id: string
    nombre: string
  } | null
}

export interface DoctorStats {
  totalPacientes: number
  totalFotos: number
  totalGrabaciones: number
  grabacionesEstaSemana: number
}

// Obtener estadísticas generales del médico
export const fetchDoctorStats = async (): Promise<DoctorStats> => {
  const { data } = await medicoApiClient.get('/api/medico/estadisticas')
  return data
}

// Obtener todos los pacientes asignados
export const fetchAssignedPatients = async (): Promise<MedicoPatient[]> => {
  const { data } = await medicoApiClient.get('/api/medico/pacientes')
  return data
}

// Obtener detalles de un paciente
export const fetchPatientDetails = async (pacienteId: string): Promise<PatientDetails> => {
  const { data } = await medicoApiClient.get(`/api/medico/pacientes/${pacienteId}`)
  return data
}

// Obtener fotos de un paciente
export const fetchPatientPhotos = async (pacienteId: string): Promise<MedicoPhoto[]> => {
  const { data } = await medicoApiClient.get(`/api/medico/pacientes/${pacienteId}/fotos`)
  return data
}

// Obtener grabaciones de un paciente
export const fetchPatientRecordings = async (pacienteId: string): Promise<MedicoRecording[]> => {
  const { data } = await medicoApiClient.get(`/api/medico/pacientes/${pacienteId}/grabaciones`)
  return data
}

// Obtener todos los pacientes disponibles
export const fetchAvailablePatients = async (): Promise<MedicoPatient[]> => {
  const { data } = await medicoApiClient.get('/api/medico/pacientes/disponibles')
  return data
}

// Asignar paciente al médico
export const assignPatient = async (pacienteId: string): Promise<void> => {
  await medicoApiClient.post('/api/medico/pacientes', { pacienteId })
}

// Desasignar paciente
export const unassignPatient = async (pacienteId: string): Promise<void> => {
  await medicoApiClient.delete(`/api/medico/pacientes/${pacienteId}`)
}

// Actualizar información de un paciente
export const updatePatientInfo = async (
  pacienteId: string,
  data: { nombre: string; email: string }
): Promise<PatientDetails> => {
  const { data: updatedPatient } = await medicoApiClient.put(
    `/api/medico/pacientes/${pacienteId}`,
    data
  )
  return updatedPatient
}

// Obtener cuidadores disponibles
export const fetchAvailableCaregivers = async (): Promise<Caregiver[]> => {
  const { data } = await medicoApiClient.get('/api/medico/cuidadores')
  return data
}

// Asignar cuidador a paciente
export const assignCaregiverToPatient = async (
  pacienteId: string,
  cuidadorId: string
): Promise<void> => {
  await medicoApiClient.post('/api/medico/asignar-cuidador', {
    pacienteId,
    cuidadorId,
  })
}
