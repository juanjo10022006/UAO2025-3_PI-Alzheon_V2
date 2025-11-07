import { useMemo } from 'react'
import { HiPlay } from 'react-icons/hi2'
import { CuidadorRecording } from '../../../services/cuidadorApi'

interface CuidadorProgressProps {
  recordings: CuidadorRecording[]
  patientName: string
  loading?: boolean
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

const formatDate = (date: string) => {
  const localeDate = new Date(date)
  return localeDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export const CuidadorProgress = ({ recordings, patientName, loading }: CuidadorProgressProps) => {
  const orderedRecordings = useMemo(
    () =>
      [...recordings].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [recordings]
  )

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalDuration = recordings.reduce((sum, r) => sum + r.duracion, 0)
    const avgDuration = recordings.length > 0 ? totalDuration / recordings.length : 0
    
    // Grabaciones por semana (últimas 4 semanas)
    const now = new Date()
    const weeks = []
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const count = recordings.filter(r => {
        const date = new Date(r.fecha)
        return date >= weekStart && date <= weekEnd
      }).length
      
      weeks.unshift({ start: weekStart, count })
    }

    return {
      totalDuration,
      avgDuration,
      weeks
    }
  }, [recordings])

  return (
    <section className="w-full px-4 pb-16 sm:px-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="patient-section-title">Progreso del paciente</p>
          <h2 className="text-3xl font-semibold">Actividad de {patientName}</h2>
        </div>
        {recordings.length > 0 && (
          <span className="glass-button rounded-full px-4 py-2 text-sm">
            {recordings.length} grabaciones totales
          </span>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Total de grabaciones</p>
          <p className="text-4xl font-semibold">{recordings.length}</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Tiempo total</p>
          <p className="text-4xl font-semibold">{formatDuration(stats.totalDuration)}</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70 mb-2">Promedio por sesión</p>
          <p className="text-4xl font-semibold">{formatDuration(Math.round(stats.avgDuration))}</p>
        </div>
      </div>

      {/* Gráfico de actividad semanal */}
      <div className="glass-panel p-6 mb-8">
        <h3 className="text-xl font-semibold mb-6">Actividad de las últimas 4 semanas</h3>
        <div className="flex items-end justify-between gap-4 h-48">
          {stats.weeks.map((week, index) => {
            const maxCount = Math.max(...stats.weeks.map(w => w.count), 1)
            const height = (week.count / maxCount) * 100
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-3">
                <div className="w-full flex items-end justify-center h-40">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-[#3B9CFF] to-[#3B9CFF]/60 transition-all duration-300"
                    style={{ height: `${height}%`, minHeight: week.count > 0 ? '20px' : '0' }}
                  >
                    {week.count > 0 && (
                      <div className="w-full text-center pt-2 text-sm font-semibold">
                        {week.count}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-white/60">
                  Semana {4 - index}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista de grabaciones */}
      {loading ? (
        <div className="glass-panel p-10 text-center">Cargando grabaciones...</div>
      ) : orderedRecordings.length === 0 ? (
        <div className="glass-panel p-10 text-center text-lg">
          {patientName} aún no ha grabado descripciones. Cuando lo haga, aparecerán aquí.
        </div>
      ) : (
        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Historial de grabaciones</h3>
          <div className="space-y-4 patient-scroll max-h-[650px] overflow-auto">
            {orderedRecordings.map((recording) => (
              <div key={recording._id} className="glass-card p-4 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-lg flex-shrink-0">
                    <img src={recording.fotoUrl} alt={recording.nota || 'Foto descrita'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.4em] text-white/70">Grabado el</p>
                    <h3 className="text-xl font-semibold">{formatDate(recording.fecha)}</h3>
                    {recording.nota && <p className="text-white/70 text-sm mt-1">{recording.nota}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-white/70">
                      Duración <span className="font-semibold text-white">{formatDuration(recording.duracion)}</span>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                        <HiPlay className="text-lg text-[#3B9CFF]" />
                        Escuchar grabación
                      </div>
                      <audio
                        controls
                        src={recording.audioUrl}
                        className="w-full"
                      >
                        Tu navegador no soporta la reproducción de audio.
                      </audio>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
