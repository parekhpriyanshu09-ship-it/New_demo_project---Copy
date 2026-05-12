/**
 * Entries API Module
 * Maps to: backend/routers/entries.py
 * Prefix:  /api/entries
 *
 * All functions return response.data (unwrapped Axios response).
 */
import api from '../services/api'

// ─── Read ────────────────────────────────────────────────────────

/**
 * Get paginated, filterable list of patrak entries.
 * @param {Object} [params]
 * @param {number} [params.page=1]
 * @param {number} [params.per_page=10]
 * @param {string} [params.search]
 * @param {string} [params.department]
 * @param {string} [params.priority]
 * @param {string} [params.status_filter]
 * @param {string} [params.sort_by='created_at']
 * @param {string} [params.sort_order='desc']
 * @returns {Promise<{ items: Array, total: number, page: number, per_page: number, pages: number }>}
 */
export const getEntries = (params = {}) =>
  api.get('/api/entries', { params }).then(r => r.data)

/**
 * Get a single patrak entry by ID.
 * @param {number} id
 * @returns {Promise<Object>} PatrakEntry object
 */
export const getEntry = (id) =>
  api.get(`/api/entries/${id}`).then(r => r.data)

// ─── Create / Update / Delete ────────────────────────────────────

/**
 * Create a new patrak entry.
 * @param {Object} data - { subject, sender_name, sender_designation, received_date, priority, description, receiving_mode, sender_email?, fax_number? }
 * @returns {Promise<Object>} Created entry
 */
export const createEntry = (data) =>
  api.post('/api/entries', data).then(r => r.data)

/**
 * Update an existing patrak entry.
 * @param {number} id
 * @param {Object} data - Partial update fields
 * @returns {Promise<Object>} Updated entry
 */
export const updateEntry = (id, data) =>
  api.put(`/api/entries/${id}`, data).then(r => r.data)

/**
 * Delete a patrak entry (admin only).
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteEntry = (id) =>
  api.delete(`/api/entries/${id}`).then(r => r.data)

// ─── Tracking ────────────────────────────────────────────────────

/**
 * Get full tracking timeline for a patrak entry.
 * Returns the entry, department logs, and a timeline array.
 * @param {number} id
 * @returns {Promise<{ entry: Object, logs: Array, timeline: Array }>}
 */
export const getEntryTracking = (id) =>
  api.get(`/api/entries/${id}/tracking`).then(r => r.data)
