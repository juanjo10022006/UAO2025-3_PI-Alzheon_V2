import { Navigate, Route, Routes } from 'react-router-dom'
import { Login } from './pages/auth/Login'
import { PatientRoute } from './pages/auth/PatientRoute'
import { PatientApp } from './pages/paciente/PatientApp'
import { RootRedirect } from './pages/RootRedirect'

export const Alzheon = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route element={<PatientRoute />}>
        <Route path="/paciente/*" element={<PatientApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
