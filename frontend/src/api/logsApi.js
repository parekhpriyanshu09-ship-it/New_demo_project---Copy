/**
 * Logs API Module
 * Maps to: backend/routers/logs.py
 * Prefix:  /api/logs
 *
 * All functions return response.data (unwrapped Axios response).
 */
import api from '../services/api'

// ─── Paginated Logs ──────────────────────────────────────────────

/**
 * Get paginated department logs with optional filters.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.per_page=20]
 * @param {number} [params.entry_id] - Filter by entry
 * @param {string} [params.department] - Filter by department name
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number, pages: number }>}
 */
export const getLogs = (params = {}) =>
  api.get('/api/logs', { params }).then(r => r.data)

// ─── Entry-specific Logs ─────────────────────────────────────────

/**
 * Get all department logs for a specific entry (chronological order).
 * @param {number} entryId
 * @returns {Promise<Array>} Array of log objects
 */
export const getEntryLogs = (entryId) =>
  api.get(`/api/logs/entry/${entryId}`).then(r => r.data)
