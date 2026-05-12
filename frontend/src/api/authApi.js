/**
 * Auth API Module
 * Maps to: backend/auth/router.py
 * Prefix:  /api/auth
 *
 * All functions return response.data (unwrapped Axios response).
 * Error handling is done by the Axios interceptors in services/api.js.
 */
import api from '../services/api'

// ─── Authentication ──────────────────────────────────────────────

/**
 * Login with username + password.
 * Sets httpOnly cookies on the backend; also returns tokens in body.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ access_token: string, refresh_token: string }>}
 */
export const login = (username, password) =>
  api.post('/api/auth/login', { username, password }).then(r => r.data)

/**
 * Register a new user (self-registration — role defaults to Viewer).
 * @param {{ username: string, email: string, password: string, department?: string }} userData
 * @returns {Promise<Object>} Created user object
 */
export const register = (userData) =>
  api.post('/api/auth/register', userData).then(r => r.data)

/**
 * Logout the current user. Clears httpOnly cookies on the backend.
 * @returns {Promise<{ message: string }>}
 */
export const logout = () =>
  api.post('/api/auth/logout').then(r => r.data)

/**
 * Refresh the access token using a refresh token.
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, refresh_token: string }>}
 */
export const refreshToken = (refreshToken) =>
  api.post('/api/auth/refresh', { refresh_token: refreshToken }).then(r => r.data)

/**
 * Get the currently authenticated user's profile.
 * @returns {Promise<Object>} User object (id, username, email, role, department, …)
 */
export const getMe = () =>
  api.get('/api/auth/me').then(r => r.data)
