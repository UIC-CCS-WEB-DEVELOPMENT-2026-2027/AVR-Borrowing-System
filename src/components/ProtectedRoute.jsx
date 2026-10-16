import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/useAuth'

export function ProtectedRoute({ allowedRoles }) {
  const { user, isReady } = useAuth()
  const location = useLocation()

  if (!isReady) {
    return (
      <div className="auth-loading" role="status">
        Restoring your secure session...
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/home' : '/dashboard'} replace />
  }

  return <Outlet />
}
