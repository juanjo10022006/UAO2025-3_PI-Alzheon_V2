import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../store/store'
import { checkAuthStatus } from '../store/thunks/authThunk'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const authState = useSelector((state: RootState) => state.auth)
  const userState = useSelector((state: RootState) => state.user)

  useEffect(() => {
    if (authState.status === 'checking') {
      dispatch(checkAuthStatus())
    }
  }, [authState.status, dispatch])

  const isAuthenticated = authState.status === 'authenticated'
  const isPatient = userState.rol?.toLowerCase() === 'paciente'
  const isCuidador = userState.rol?.toLowerCase() === 'cuidador/familiar'
  const isMedico = userState.rol?.toLowerCase() === 'medico'

  return {
    status: authState.status,
    errorMessage: authState.errorMessage,
    user: userState,
    isAuthenticated,
    isPatient,
    isCuidador,
    isMedico,
  }
}
