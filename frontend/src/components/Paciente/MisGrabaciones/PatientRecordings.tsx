import { useMemo, useRef } from 'react'
import { HiPlay } from 'react-icons/hi2'
import { PatientRecording } from '../../../services/api'

interface PatientRecordingsProps {
  recordings: PatientRecording[]
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
  })
}

export const PatientRecordings = ({ recordings, loading }: PatientRecordingsProps) => {
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const orderedRecordings = useMemo(
    () =>
      [...recordings].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [recordings]
  )

  const handlePlay = (targetId: string) => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      if (id !== targetId) {
        audio?.pause()
      }
    })
  }

  return (
    <section className="w-full px-4 pb-16 sm:px-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="patient-section-title">Mis grabaciones</p>
          <h2 className="text-3xl font-semibold">Escucha lo que has compartido</h2>
        </div>
        {recordings.length > 0 && (
          <span className="glass-button rounded-full px-4 py-2 text-sm">
            {recordings.length} registros
          </span>
        )}
      </div>

      {loading ? (
        <div className="glass-panel p-10 text-center">Cargando grabaciones...</div>
      ) : orderedRecordings.length === 0 ? (
        <div className="glass-panel p-10 text-center text-lg">
          Aún no has grabado descripciones. Cuando lo hagas, aparecerán aquí.
        </div>
      ) : (
        <div className="glass-panel p-6 space-y-4 patient-scroll max-h-[650px] overflow-auto">
          {orderedRecordings.map((recording) => (
            <div key={recording._id} className="glass-card p-4 flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
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
                      ref={(element) => {
                        audioRefs.current[recording._id] = element
                      }}
                      onPlay={() => handlePlay(recording._id)}
                    >
                      Tu navegador no soporta la reproducción de audio.
                    </audio>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
