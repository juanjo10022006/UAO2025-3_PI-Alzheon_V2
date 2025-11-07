import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const RootRedirect = () => {
  const { status, isAuthenticated, isPatient } = useAuth()

  if (status === 'checking') {
    return (
      <div className="min-h-screen patient-gradient-bg flex flex-col items-center justify-center text-white">
        <div className="glass-panel px-10 py-6 text-center">
          <p className="text-lg font-semibold tracking-wide">Verificando tus datos...</p>
          <span className="text-sm text-white/70">Un momento por favor</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated && isPatient) {
    return <Navigate to="/paciente/dashboard" replace />
  }

  return <Navigate to="/login" replace />
}
