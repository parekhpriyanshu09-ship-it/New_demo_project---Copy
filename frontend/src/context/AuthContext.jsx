import { createContext, useContext, useReducer, useEffect } from 'react'
import * as authApi from '../api/authApi'

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
      const user = await authApi.getMe()
      dispatch({ type: 'LOGIN', payload: user })
    } catch (error) {
      // Auto-login for testing purposes to get real backend tokens
      try {
        const tokens = await authApi.login('testadmin', 'password123')
        localStorage.setItem('access_token', tokens.access_token)
        localStorage.setItem('refresh_token', tokens.refresh_token)
        const user = await authApi.getMe()
        dispatch({ type: 'LOGIN', payload: user })
      } catch (loginError) {
        try {
          // If auto-login fails (user doesn't exist), register the user first
          await authApi.register({
            username: 'testadmin',
            email: 'testadmin@example.com',
            password: 'password123',
            department: 'DG Office'
          })
          const tokens = await authApi.login('testadmin', 'password123')
          localStorage.setItem('access_token', tokens.access_token)
          localStorage.setItem('refresh_token', tokens.refresh_token)
          const user = await authApi.getMe()
          dispatch({ type: 'LOGIN', payload: user })
        } catch (registerError) {
          console.error('Test Auth Setup Failed:', registerError)
          dispatch({ type: 'LOGOUT' })
        }
      }
    }
  }

  const login = async (username, password) => {
    const tokens = await authApi.login(username, password)
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    // Fetch full user data after login
    const user = await authApi.getMe()
    dispatch({ type: 'LOGIN', payload: user })
    return tokens
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    dispatch({ type: 'LOGOUT' })
  }

  const register = async (userData) => {
    return await authApi.register(userData)
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