import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { Login } from '../pages/auth/Login'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/generics/Navbar'
import { Footer } from '../components/generics/Footer'
import { checkAuthStatus } from '../store/thunks/authThunk'

export const Layout = () => {
  const dispatch = useDispatch<AppDispatch>()
  const authStatus = useSelector((state: RootState) => state.auth.status);

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch])


  return (
    <div>
      <Navbar />

      <main className='min-h-[calc(100dvh-260px)]'>
        <Outlet />
        {authStatus !== 'authenticated' && <Login />}
      </main>

      <Footer />

    </div>
  )
}
