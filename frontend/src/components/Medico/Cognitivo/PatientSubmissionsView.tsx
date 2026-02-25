import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { HiArrowDownTray, HiDocumentText } from 'react-icons/hi2'
import {
    CognitiveSubmission,
    fetchPatientCognitiveSubmissions,
    getBackendBaseUrl,
} from '../../../services/medicoApi'


interface Props {
    pacienteId: string
}

const formatBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    return `${(kb / 1024).toFixed(2)} MB`
}

export const PatientSubmissionsView = ({ pacienteId }: Props) => {
    const [loading, setLoading] = useState(true)
    const [items, setItems] = useState<CognitiveSubmission[]>([])
    const backend = useMemo(() => getBackendBaseUrl(), [])

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await fetchPatientCognitiveSubmissions(pacienteId)
                setItems(data)
            } catch (e: any) {
                toast.error(e?.response?.data?.error ?? 'No se pudieron cargar los resultados')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [pacienteId])

    if (loading) {
        return (
            <div className="glass-card p-6 text-white">
                Cargando resultados...
            </div>
        )
    }

    return (
        <div className="glass-card p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="patient-section-title">Resultados subidos</p>
                    <h3 className="text-xl font-semibold mt-2">Documentos cognitivos</h3>
                    <p className="text-sm text-white/70 mt-1">
                        Archivos (pdf/jpg/png) subidos por paciente o cuidador.
                    </p>
                </div>
            </div>

            {!items.length ? (
                <div className="text-white/70 text-sm">No hay resultados todavía.</div>
            ) : (
                <div className="space-y-3">
                    {items.map((s) => {
                        const aiMeta = s.analisisIA as any
                        const ai = aiMeta?.resultadoJson ?? null // <-- AQUÍ está tu estructura
                        const indicadores = Array.isArray(ai?.indicadores) ? ai.indicadores : []
                        const alertas = Array.isArray(ai?.alertas) ? ai.alertas : []
                        const url = `${backend}${s.assetUrl}`
                        return (
                            <div key={s._id} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <HiDocumentText className="text-xl text-white/80" />
                                            <p className="font-semibold truncate">
                                                {s.plantillaId?.nombre ?? 'Plantilla'}
                                            </p>
                                        </div>
                                        <p className="text-xs text-white/70 mt-1">
                                            Archivo: {s.nombreOriginal} · {formatBytes(s.tamano)} · {new Date(s.createdAt).toLocaleString('es-ES')}
                                        </p>
                                        {s.notas ? (
                                            <p className="text-xs text-white/70 mt-2">Notas: {s.notas}</p>
                                        ) : null}
                                    </div>

                                    <a href={url} target="_blank" rel="noreferrer">
                                        <button className="glass-button rounded-full px-4 py-2 text-sm font-semibold text-white flex items-center gap-2">
                                            <HiArrowDownTray className="text-lg" />
                                            Abrir
                                        </button>
                                    </a>
                                    {aiMeta && (
                                        <details className="mt-3">
                                            <summary className="cursor-pointer text-sm text-white/80">
                                                Ver análisis IA (Gemini)
                                            </summary>

                                            <div className="mt-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white whitespace-pre-wrap">
                                                {/* Estados sin resultado */}
                                                {aiMeta.estado !== 'completado' && (
                                                    <div className="text-white/80">
                                                        <div><b>Estado:</b> {aiMeta.estado}</div>
                                                        {aiMeta.error ? <div className="mt-1"><b>Error:</b> {aiMeta.error}</div> : null}
                                                    </div>
                                                )}

                                                {/* Estado completado: mostrar resultadoJson */}
                                                {aiMeta.estado === 'completado' && ai && (
                                                    <>
                                                        <div><b>Modelo:</b> {aiMeta.modelo ?? '—'}</div>
                                                        <div><b>Generado:</b> {aiMeta.generadoEn ? new Date(aiMeta.generadoEn).toLocaleString('es-ES') : '—'}</div>

                                                        <div className="mt-2"><b>Tipo:</b> {ai.tipoPrueba}</div>
                                                        <div className="mt-1"><b>Resumen:</b> {ai.resumenObservacional}</div>

                                                        <div className="mt-2">
                                                            <b>Indicadores:</b>
                                                            {indicadores.length ? (
                                                                <ul className="list-disc ml-5">
                                                                    {indicadores.map((i: any, idx: number) => (
                                                                        <li key={idx}>
                                                                            {i.nombre} – {i.nivel}: {i.observacion}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <div className="text-white/70 mt-1">No hay indicadores.</div>
                                                            )}
                                                        </div>

                                                        <div className="mt-2">
                                                            <b>Calidad:</b> {ai.calidadArchivo?.nivel ?? '—'} – {ai.calidadArchivo?.motivo ?? '—'}
                                                        </div>

                                                        <div className="mt-2">
                                                            <b>Recomendación:</b> {ai.recomendacionParaMedico ?? '—'}
                                                        </div>

                                                        {alertas.length > 0 && (
                                                            <div className="mt-2">
                                                                <b>Alertas:</b>
                                                                <ul className="list-disc ml-5">
                                                                    {alertas.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        <div className="mt-3 text-white/60 text-[10px]">
                                                            {ai.descargo ?? 'Análisis automatizado de apoyo, no reemplaza criterio médico.'}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}