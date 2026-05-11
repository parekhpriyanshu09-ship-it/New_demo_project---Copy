import { createContext, useContext, useReducer, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Attempt to fetch current user with existing tokens
      const response = await api.get('/api/auth/me')
      dispatch({ type: 'LOGIN', payload: response.data })
    } catch (error) {
      // Auto-login for testing purposes to get real backend tokens
      try {
        const loginResponse = await api.post('/api/auth/login', { username: 'testadmin', password: 'password123' })
        localStorage.setItem('access_token', loginResponse.data.access_token)
        localStorage.setItem('refresh_token', loginResponse.data.refresh_token)
        const userResponse = await api.get('/api/auth/me')
        dispatch({ type: 'LOGIN', payload: userResponse.data })
      } catch (loginError) {
        try {
          // If auto-login fails (user doesn't exist), register the user first
          await api.post('/api/auth/register', {
            username: 'testadmin',
            email: 'testadmin@example.com',
            password: 'password123',
            department: 'DG Office'
          })
          const loginResponse = await api.post('/api/auth/login', { username: 'testadmin', password: 'password123' })
          localStorage.setItem('access_token', loginResponse.data.access_token)
          localStorage.setItem('refresh_token', loginResponse.data.refresh_token)
          const userResponse = await api.get('/api/auth/me')
          dispatch({ type: 'LOGIN', payload: userResponse.data })
        } catch (registerError) {
          console.error('Test Auth Setup Failed:', registerError)
          dispatch({ type: 'LOGOUT' })
        }
      }
    }
  }

  const login = async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password })
    localStorage.setItem('access_token', response.data.access_token)
    localStorage.setItem('refresh_token', response.data.refresh_token)
    // Fetch full user data after login
    const userResponse = await api.get('/api/auth/me')
    dispatch({ type: 'LOGIN', payload: userResponse.data })
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    dispatch({ type: 'LOGOUT' })
  }

  const register = async (userData) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}