/**
 * Forward API Module
 * Maps to: backend/routers/forward.py
 * Prefix:  /api/forward
 */
import api from '../services/api'

export const forwardPatrak = (data) =>
  api.post('/api/forward', data).then(r => r.data)

export const getEntryMovements = (entryId) =>
  api.get(`/api/forward/entry/${entryId}/movements`).then(r => r.data)

export const receivePatrak = (entryId) =>
  api.post(`/api/forward/receive/${entryId}`).then(r => r.data)

export const closePatrak = (entryId) =>
  api.post(`/api/forward/close/${entryId}`).then(r => r.data)

export const getDepartments = () =>
  api.get('/api/forward/departments').then(r => r.data)