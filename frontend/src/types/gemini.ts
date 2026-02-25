export type GeminiNivel = 'bajo' | 'medio' | 'alto' | 'no_evaluable'
export type GeminiCalidad = 'buena' | 'media' | 'baja'

export type GeminiIndicadorNombre =
    | 'legibilidad'
    | 'alineacion'
    | 'coherencia_trazo'
    | 'estructura_dibujo'
    | 'orientacion_temporal'
    | 'motricidad_fina'
    | 'otro'

export type GeminiTipoPrueba = 'firma' | 'dibujo' | 'otro'

export interface GeminiIndicador {
    nombre: GeminiIndicadorNombre
    observacion: string
    nivel: GeminiNivel
}

export interface GeminiComparabilidadFutura {
    util: boolean
    motivo: string
}

export interface GeminiCalidadArchivo {
    nivel: GeminiCalidad
    motivo: string
}

export interface GeminiCognitiveAnalysis {
    tipoPrueba: GeminiTipoPrueba
    resumenObservacional: string
    indicadores: GeminiIndicador[]
    comparabilidadFutura: GeminiComparabilidadFutura
    alertas: string[]
    calidadArchivo: GeminiCalidadArchivo
    recomendacionParaMedico: string
    descargo: string
}