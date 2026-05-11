import { useAuth } from '../context/AuthContext'

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()

  if (!isLoading && !isAuthenticated) {
    window.location.href = '/login'
    return false
  }

  return true
}

export function useRequireRole(allowedRoles) {
  const { user, isLoading } = useAuth()

  if (!isLoading && user && !allowedRoles.includes(user.role)) {
    return false
  }

  return true
}