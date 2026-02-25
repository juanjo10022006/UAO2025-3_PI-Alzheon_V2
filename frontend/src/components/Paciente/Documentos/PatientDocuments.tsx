import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
    CognitiveAssignment,
    fetchMyCognitiveAssignments,
    getBackendBaseUrl,
    uploadCognitiveSubmission,
} from '../../../services/api'
import { SignaturePad } from './SignaturePad'
import type { GeminiCognitiveAnalysis } from '../../../types/gemini.ts'

export const PatientDocuments = () => {
    const [loading, setLoading] = useState(true)
    const [asignaciones, setAsignaciones] = useState<CognitiveAssignment[]>([])
    const [selected, setSelected] = useState<CognitiveAssignment | null>(null)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null)
    const [notas, setNotas] = useState('')
    const [uploading, setUploading] = useState(false)
    const [lastGeminiAnalysis, setLastGeminiAnalysis] = useState<GeminiCognitiveAnalysis | null>(null)


    const backend = useMemo(() => getBackendBaseUrl(), [])

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const data = await fetchMyCognitiveAssignments()
                setAsignaciones(data)
                setSelected(data[0] ?? null)
            } catch (e: any) {
                toast.error(e?.response?.data?.error ?? 'No se pudieron cargar tus asignaciones')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const plantillaUrl = useMemo(() => {
        if (!selected?.plantillaId?.assetUrl) return undefined
        return `${backend}${selected.plantillaId.assetUrl}`
    }, [backend, selected])

    const onUpload = async () => {
        if (!selected) return toast.error('Selecciona una asignación')
        if (!fileToUpload) return toast.error('Adjunta un archivo (png/jpg/pdf)')

        try {
            setUploading(true)
            await uploadCognitiveSubmission({
                idAsignacion: selected._id,
                file: fileToUpload,
                notas: notas.trim() ? notas.trim() : undefined,
            })
            toast.success('Documento subido correctamente')
            setFileToUpload(null)
            setNotas('')
            const res = await uploadCognitiveSubmission({ idAsignacion: selected._id, file: fileToUpload, notas })
            setLastGeminiAnalysis(res.analisisIA ?? null)
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? 'No se pudo subir el documento')
        } finally {
            setUploading(false)
        }
    }

    if (loading) {
        return (
            <div className="glass-panel p-8 text-white">
                <p className="text-lg font-semibold tracking-wide">Cargando documentos...</p>
            </div>
        )
    }

    return (
        <section className="space-y-6 text-white">
            <div className="glass-panel p-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="patient-section-title">Documentos y firmas</p>
                        <h2 className="text-2xl font-semibold tracking-tight mt-2">Tus asignaciones</h2>
                        <p className="text-sm text-white/70 mt-1">
                            Firma en la página o imprime la plantilla y sube el documento firmado.
                        </p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Lista asignaciones */}
                    <div className="glass-card p-5 patient-scroll max-h-[520px] overflow-auto">
                        <p className="patient-section-title mb-4">Lista</p>
                        <div className="space-y-3">
                            {asignaciones.map((a) => {
                                const active = selected?._id === a._id
                                return (
                                    <button
                                        key={a._id}
                                        type="button"
                                        onClick={() => {
                                            setSelected(a)
                                            setFileToUpload(null)
                                            setNotas('')
                                        }}
                                        className={[
                                            'w-full text-left rounded-2xl p-4 border transition-all',
                                            'glass-button',
                                            active ? 'bg-white/30 border-white/40 text-[#0E192F]' : 'border-white/15 text-white/85 hover:text-white',
                                        ].join(' ')}
                                    >
                                        <div className="font-semibold">{a.plantillaId.nombre}</div>
                                        <div className="text-xs opacity-80 mt-1">
                                            Tipo: {a.plantillaId.tipo} · Frecuencia: {a.frecuencia}
                                        </div>
                                    </button>
                                )
                            })}
                            {!asignaciones.length && (
                                <p className="text-sm text-white/70">No tienes asignaciones activas por ahora.</p>
                            )}
                        </div>
                    </div>

                    {/* Detalle + acciones */}
                    <div className="lg:col-span-2 space-y-6">
                        {selected ? (
                            <>
                                <div className="glass-card p-6 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="patient-section-title">Plantilla</p>
                                            <h3 className="text-xl font-semibold mt-2">{selected.plantillaId.nombre}</h3>
                                            {selected.plantillaId.instrucciones && (
                                                <p className="text-sm text-white/70 mt-2">{selected.plantillaId.instrucciones}</p>
                                            )}
                                        </div>

                                        {plantillaUrl && (
                                            <a href={plantillaUrl} target="_blank" rel="noreferrer">
                                                <button type="button" className="glass-button rounded-full px-6 py-2 text-sm font-semibold text-white">
                                                    Abrir / Imprimir PDF
                                                </button>
                                            </a>
                                        )}
                                    </div>

                                    <p className="text-xs text-white/70">
                                        Si firmas físico: imprime el PDF, firma, escanea o toma foto y luego sube el archivo.
                                    </p>
                                </div>

                                {/* Firma dibujada solo si la plantilla es tipo firma */}
                                {selected.plantillaId.tipo === 'firma' && (
                                    <SignaturePad onExportFile={(f) => setFileToUpload(f)} />
                                )}

                                {/* Subida de archivo */}
                                <div className="glass-card p-6 space-y-4">
                                    <p className="patient-section-title">Subir documento</p>
                                    {lastGeminiAnalysis && (
                                        <div className="glass-card p-6 text-white space-y-3">
                                            <p className="patient-section-title">Análisis IA (Gemini)</p>

                                            <div className="text-sm text-white/80">
                                                <div><b>Tipo:</b> {lastGeminiAnalysis.tipoPrueba}</div>
                                                <div className="mt-2"><b>Resumen:</b> {lastGeminiAnalysis.resumenObservacional}</div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold">Indicadores</p>
                                                {lastGeminiAnalysis.indicadores.map((i, idx) => (
                                                    <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold">{i.nombre}</span>
                                                            <span className="text-xs text-white/70">{i.nivel}</span>
                                                        </div>
                                                        <div className="text-white/70 mt-1">{i.observacion}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="text-sm text-white/80">
                                                <div><b>Calidad archivo:</b> {lastGeminiAnalysis.calidadArchivo.nivel} — {lastGeminiAnalysis.calidadArchivo.motivo}</div>
                                                <div className="mt-2"><b>Recomendación:</b> {lastGeminiAnalysis.recomendacionParaMedico}</div>
                                                {lastGeminiAnalysis.alertas?.length ? (
                                                    <div className="mt-2">
                                                        <b>Alertas:</b>
                                                        <ul className="list-disc ml-5 text-white/70">
                                                            {lastGeminiAnalysis.alertas.map((a, idx) => <li key={idx}>{a}</li>)}
                                                        </ul>
                                                    </div>
                                                ) : null}
                                                <div className="mt-3 text-xs text-white/60">{lastGeminiAnalysis.descargo}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/80 font-semibold">Archivo (PNG/JPG/PDF)</label>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,application/pdf"
                                            onChange={(e) => setFileToUpload(e.target.files?.[0] ?? null)}
                                            className="block w-full text-sm text-white/80 file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:glass-button"
                                        />
                                        {fileToUpload && (
                                            <p className="text-xs text-white/70">
                                                Listo: {fileToUpload.name} ({Math.round(fileToUpload.size / 1024)} KB)
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm text-white/80 font-semibold">Notas (opcional)</label>
                                        <textarea
                                            value={notas}
                                            onChange={(e) => setNotas(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-2xl bg-white/10 border border-white/15 p-3 text-sm text-white placeholder:text-white/50"
                                            placeholder="Ej: firmado por el paciente, fecha, observaciones..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            disabled={uploading}
                                            onClick={onUpload}
                                            className="glass-button rounded-full px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                        >
                                            {uploading ? 'Subiendo...' : 'Subir resultado'}
                                        </button>
                                        <p className="text-xs text-white/60">El peso máximo de los archivos es 10MB.</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="glass-card p-6">
                                <p className="text-white/80">Selecciona una asignación para ver la plantilla y firmar/subir.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}