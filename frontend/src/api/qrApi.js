/**
 * QR API Module
 * Maps to: backend/routers/qr.py
 * Prefix:  /api/qr
 *
 * All functions return response.data (unwrapped Axios response).
 */
import api from '../services/api'

// ─── Generate ────────────────────────────────────────────────────

/**
 * Generate a QR code for an entry.
 * @param {number} entryId
 * @returns {Promise<{ entry_id: number, unique_id: string, qr_image: string }>}
 */
export const generateQr = (entryId) =>
  api.get(`/api/qr/generate/${entryId}`).then(r => r.data)

/**
 * Regenerate QR code for an entry (fixes old/broken QR data).
 * @param {number} entryId
 * @returns {Promise<{ entry_id: number, unique_id: string, qr_image: string }>}
 */
export const regenerateQr = (entryId) =>
  api.post(`/api/qr/regenerate/${entryId}`).then(r => r.data)

// ─── Scan ────────────────────────────────────────────────────────

/**
 * Scan a QR code (camera-based).
 * Moves the entry to the next department in the pipeline.
 * @param {{ entry_id: number, department_name: string, remarks?: string }} data
 * @returns {Promise<{ message: string, entry_id: number, department: string, log_id: number }>}
 */
export const scanQr = (data) =>
  api.post('/api/qr/scan', data).then(r => r.data)

/**
 * Upload a QR code image for scanning.
 * @param {FormData} formData - Must contain: entry_id, department_name, file. Optional: remarks.
 * @returns {Promise<{ message: string, entry_id: number, department: string, log_id: number }>}
 */
export const uploadScan = (formData) =>
  api.post('/api/qr/upload-scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)

// ─── Decode ──────────────────────────────────────────────────────

/**
 * Decode raw QR text on the backend (fallback when frontend can't parse).
 * @param {string} text - Raw QR code text content
 * @returns {Promise<{ entry_id: number, unique_id: string }>}
 */
export const decodeQr = (text) =>
  api.post('/api/qr/decode', { text }).then(r => r.data)

// ─── Electronic Receive ──────────────────────────────────────────

/**
 * Digitally receive an electronic patrak (Mails/Fax) without QR scan.
 * @param {{ entry_id: number, department_name: string, remarks?: string }} data
 * @returns {Promise<{ message: string, entry_id: number, department: string, log_id: number }>}
 */
export const receiveElectronic = (data) =>
  api.post('/api/qr/receive-electronic', data).then(r => r.data)
