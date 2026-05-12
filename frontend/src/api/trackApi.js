/**
 * Track API Module (Public)
 * Maps to: backend/routers/track.py
 * Prefix:  /api/track
 *
 * These are PUBLIC endpoints — no authentication required.
 * All functions return response.data (unwrapped Axios response).
 */
import api from '../services/api'

// ─── Search ──────────────────────────────────────────────────────

/**
 * Search patraks by subject, date, or location (public).
 * @param {Object} [params]
 * @param {string} [params.subject]
 * @param {string} [params.date] - YYYY-MM-DD
 * @param {string} [params.location]
 * @returns {Promise<Array<{ unique_id: string, subject: string, current_department: string, received_date: string, sender_name: string }>>}
 */
export const searchPatraks = (params = {}) =>
  api.get('/api/track/search', { params }).then(r => r.data)

// ─── Track ───────────────────────────────────────────────────────

/**
 * Get public tracking details for a patrak by its unique ID.
 * @param {string} patrakId - e.g. "PTRK-20260510-A1B2C3"
 * @returns {Promise<{ patrak_id: string, subject: string, current_status: string, current_department: string, total_movements: number, timeline: Array }>}
 */
export const trackPatrak = (patrakId) =>
  api.get(`/api/track/${patrakId}`).then(r => r.data)
