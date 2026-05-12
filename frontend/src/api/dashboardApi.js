/**
 * Dashboard API Module
 * Maps to: backend/routers/dashboard.py
 * Prefix:  /api/dashboard
 *
 * All functions return response.data (unwrapped Axios response).
 */
import api from '../services/api'

// ─── Stats ───────────────────────────────────────────────────────

/**
 * Get overall dashboard statistics.
 * @returns {Promise<{ total_entries: number, active_entries: number, closed_entries: number, department_counts: Object }>}
 */
export const getStats = () =>
  api.get('/api/dashboard/stats').then(r => r.data)

// ─── Calendar ────────────────────────────────────────────────────

/**
 * Get calendar date counts for a given month/year.
 * @param {number} month - 1–12
 * @param {number} year
 * @param {string} [viewType='inward'] - 'inward' | 'outward'
 * @returns {Promise<{ month: number, year: number, dates: Array<{ date: string, count: number }> }>}
 */
export const getCalendar = (month, year, viewType = 'inward') =>
  api.get('/api/dashboard/calendar', {
    params: { month, year, view_type: viewType },
  }).then(r => r.data)

// ─── Department Data ─────────────────────────────────────────────

/**
 * Get received + current counts per department.
 * @returns {Promise<{ departments: Array<{ department: string, received: number, current: number }> }>}
 */
export const getDepartmentCounts = () =>
  api.get('/api/dashboard/department-counts').then(r => r.data)

/**
 * Get forward stats (how many patraks each department forwarded).
 * @returns {Promise<{ forward_counts: Object }>}
 */
export const getForwardStats = () =>
  api.get('/api/dashboard/forward-stats').then(r => r.data)

/**
 * Get received + forwarded counts per department.
 * @returns {Promise<{ departments: Array<{ department: string, received: number, forwarded: number }> }>}
 */
export const getDepartmentForwarded = () =>
  api.get('/api/dashboard/department-forwarded').then(r => r.data)

// ─── Charts ──────────────────────────────────────────────────────

/**
 * Get daily chart data for a date range.
 * @param {Object} [params]
 * @param {string} [params.date] - Target date (YYYY-MM-DD), defaults to today on backend
 * @param {string} [params.viewType='inward'] - 'inward' | 'outward'
 * @param {number} [params.days=7] - Number of days to include
 * @returns {Promise<{ data: Array<{ date: string, count: number }> }>}
 */
export const getDateChart = ({ date, viewType = 'inward', days = 7 } = {}) => {
  const params = { view_type: viewType, days }
  if (date) params.date = date
  return api.get('/api/dashboard/date-chart', { params }).then(r => r.data)
}

// ─── Receiving Modes ─────────────────────────────────────────────

/**
 * Get patrak counts grouped by receiving mode (Physical, Mails, Fax).
 * @returns {Promise<{ receiving_modes: Array<{ mode: string, count: number }> }>}
 */
export const getReceivingModes = () =>
  api.get('/api/dashboard/receiving-modes').then(r => r.data)

// ─── Recent Activity ─────────────────────────────────────────────

/**
 * Get recent department log activity.
 * @param {number} [limit=10] - Max results (1–50)
 * @returns {Promise<{ activity: Array }>}
 */
export const getRecentActivity = (limit = 10) =>
  api.get('/api/dashboard/recent-activity', { params: { limit } }).then(r => r.data)
