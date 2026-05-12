/**
 * Admin API Module
 * Maps to: backend/routers/admin.py
 * Prefix:  /api/admin
 *
 * All functions return response.data (unwrapped Axios response).
 * All endpoints require admin role on the backend.
 */
import api from '../services/api'

// ─── User Management ─────────────────────────────────────────────

/**
 * Get paginated list of users with optional search/role filter.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.per_page=10]
 * @param {string} [params.search]
 * @param {string} [params.role]
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number, pages: number }>}
 */
export const getUsers = (params = {}) =>
  api.get('/api/admin/users', { params }).then(r => r.data)

/**
 * Create a new user (admin action).
 * @param {{ username: string, email: string, password: string, role: string, department: string }} data
 * @returns {Promise<Object>} Created user object
 */
export const createUser = (data) =>
  api.post('/api/admin/users', data).then(r => r.data)

/**
 * Update an existing user.
 * @param {number} id
 * @param {Object} data - Partial update fields (email, role, department, is_active, …)
 * @returns {Promise<Object>} Updated user object
 */
export const updateUser = (id, data) =>
  api.put(`/api/admin/users/${id}`, data).then(r => r.data)

/**
 * Delete a user (cannot delete yourself).
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteUser = (id) =>
  api.delete(`/api/admin/users/${id}`).then(r => r.data)

// ─── Audit Logs ──────────────────────────────────────────────────

/**
 * Get paginated audit logs with optional filters.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.per_page=20]
 * @param {string} [params.action] - Filter by action type
 * @param {number} [params.user_id] - Filter by user
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number, pages: number }>}
 */
export const getAuditLogs = (params = {}) =>
  api.get('/api/admin/audit-logs', { params }).then(r => r.data)
