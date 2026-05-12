/**
 * API Barrel Export
 *
 * Usage options:
 *
 *   // Option 1 — Named imports from barrel (good for one-off usage)
 *   import { getStats, getCalendar } from '../api'
 *
 *   // Option 2 — Namespaced import (good when using many from one module)
 *   import * as dashboardApi from '../api/dashboardApi'
 *   dashboardApi.getStats()
 *
 *   // Option 3 — Direct module import
 *   import { getStats } from '../api/dashboardApi'
 */

export * from './authApi'
export * from './entriesApi'
export * from './dashboardApi'
export * from './logsApi'
export * from './qrApi'
export * from './adminApi'
export * from './trackApi'
