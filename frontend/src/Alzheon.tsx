import { Navigate, Route, Routes } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import ResetPassword from './pages/auth/ResetPassword'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PatientRoute } from './pages/auth/PatientRoute'
import { CuidadorRoute } from './pages/auth/CuidadorRoute'
import { PatientApp } from './pages/paciente/PatientApp'
import { CuidadorApp } from './pages/cuidador/CuidadorApp'
import { RootRedirect } from './pages/RootRedirect'
import { LandingPage } from './pages/LandingPage'

export const Alzheon = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<PatientRoute />}>
        <Route path="/paciente/*" element={<PatientApp />} />
      </Route>

      <Route element={<CuidadorRoute />}>
        <Route path="/cuidador/*" element={<CuidadorApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
