import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
    assignTemplateToPatient,
    fetchCognitiveTemplates,
    CognitiveTemplate,
    CognitiveAssignmentFrequency,
} from '../../../services/medicoApi'

export const AssignTemplateToPatient = () => {
    const { id } = useParams<{ id: string }>() // id del paciente
    const navigate = useNavigate()

    const [templates, setTemplates] = useState<CognitiveTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [plantillaId, setPlantillaId] = useState('')
    const [frecuencia, setFrecuencia] = useState<CognitiveAssignmentFrequency>('semanal')
    const [fechaInicio, setFechaInicio] = useState<string>(() => new Date().toISOString().slice(0, 10))
    const [fechaEntrega, setFechaEntrega] = useState<string>('')

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchCognitiveTemplates()
                setTemplates(data.filter((t) => t.isActivo))
            } catch {
                toast.error('No se pudieron cargar las plantillas')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const onSubmit = async () => {
        if (!id) return toast.error('Paciente inválido')
        if (!plantillaId) return toast.error('Selecciona una plantilla')

        try {
            await assignTemplateToPatient({
                idPaciente: id,
                plantillaId,
                frecuencia,
                fechaInicio: new Date(fechaInicio).toISOString(),
                fechaEntrega: fechaEntrega ? new Date(fechaEntrega).toISOString() : undefined,
            })
            toast.success('Plantilla asignada correctamente')
            navigate(`/medico/pacientes/${id}`)
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? 'No se pudo asignar la plantilla')
        }
    }

    if (loading) {
        return (
            <div className="glass-panel p-8 text-white">
                <p>Cargando plantillas...</p>
            </div>
        )
    }

    return (
        <section className="glass-panel p-8 text-white space-y-6">
            <h2 className="text-2xl font-semibold">Asignar plantilla cognitiva</h2>

            <div className="space-y-2">
                <label className="text-sm font-semibold">Plantilla</label>
                <select
                    value={plantillaId}
                    onChange={(e) => setPlantillaId(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 p-3"
                >
                    <option value="">Selecciona una plantilla</option>
                    {templates.map((t) => (
                        <option key={t._id} value={t._id}>
                            {t.nombre} ({t.tipo})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Frecuencia</label>
                    <select
                        value={frecuencia}
                        onChange={(e) => setFrecuencia(e.target.value as CognitiveAssignmentFrequency)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 p-3"
                    >
                        <option value="semanal">Semanal</option>
                        <option value="mensual">Mensual</option>
                        <option value="trimestral">Trimestral</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Fecha inicio</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 p-3"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold">Fecha entrega (opcional)</label>
                    <input
                        type="date"
                        value={fechaEntrega}
                        onChange={(e) => setFechaEntrega(e.target.value)}
                        className="w-full rounded-xl bg-white/10 border border-white/20 p-3"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onSubmit}
                    className="glass-button rounded-full px-6 py-2 text-sm font-semibold text-white"
                >
                    Asignar plantilla
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="glass-button rounded-full px-6 py-2 text-sm font-semibold text-white"
                >
                    Cancelar
                </button>
            </div>
        </section>
    )
}