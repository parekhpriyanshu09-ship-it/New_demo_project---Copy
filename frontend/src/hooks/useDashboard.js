/**
 * Dashboard Hooks
 *
 * Each hook calls the real backend via dashboardApi first.
 * If the backend request fails (403 / network error / etc.)
 * it silently falls back to mock data so the UI never breaks.
 *
 * This makes the dashboard resilient during development —
 * it works whether the backend is running or not.
 */
import { useState, useEffect, useCallback } from 'react'
import * as dashboardApi from '../api/dashboardApi'
import {
  getMockCalendarDates,
  getMockDashboardStats,
  getMockDateChart,
  getMockDepartmentCounts,
  getMockReceivingModes,
} from '../data/dashboardMockData'

// ─── Helpers ─────────────────────────────────────────────────────

const formatChartData = (items) =>
  items.map(item => ({
    name: new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    value: item.count,
    date: item.date,
  }))

// ─── useDashboardStats ──────────────────────────────────────────

export function useDashboardStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    dashboardApi.getStats()
      .then(data => { if (!cancelled) setStats(data) })
      .catch(err => {
        console.warn('[useDashboardStats] API failed, using mock data:', err.message)
        if (!cancelled) {
          setStats(getMockDashboardStats())
          setError(err)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { stats, loading, error }
}

// ─── useCalendarData ─────────────────────────────────────────────

export function useCalendarData(month, year, viewType = 'inward') {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    dashboardApi.getCalendar(month, year, viewType)
      .then(data => { if (!cancelled) setDates(data.dates || []) })
      .catch(err => {
        console.warn('[useCalendarData] API failed, using mock data:', err.message)
        if (!cancelled) {
          setDates(getMockCalendarDates(month, year, viewType))
          setError(err)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [month, year, viewType])

  return { dates, loading, error }
}

// ─── useDateChart ────────────────────────────────────────────────

export function useDateChart(date = null, viewType = 'inward', days = 14) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(() => {
    let cancelled = false
    setLoading(true)

    dashboardApi.getDateChart({ date, viewType, days })
      .then(res => { if (!cancelled) setData(formatChartData(res.data || [])) })
      .catch(err => {
        console.warn('[useDateChart] API failed, using mock data:', err.message)
        if (!cancelled) {
          setData(formatChartData(getMockDateChart(date, viewType, days)))
          setError(err)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [date, viewType, days])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// ─── useDepartmentCounts ─────────────────────────────────────────

export function useDepartmentCounts() {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    dashboardApi.getDepartmentCounts()
      .then(data => { if (!cancelled) setDepartments(data.departments || []) })
      .catch(err => {
        console.warn('[useDepartmentCounts] API failed, using mock data:', err.message)
        if (!cancelled) {
          setDepartments(getMockDepartmentCounts())
          setError(err)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { departments, loading, error }
}

// ─── useTodayCount ───────────────────────────────────────────────

export function useTodayCount(viewType = 'inward') {
  const [todayCount, setTodayCount] = useState(0)
  const [yesterdayCount, setYesterdayCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    dashboardApi.getDateChart({ date: todayStr, viewType, days: 2 })
      .then(res => {
        if (cancelled) return
        const items = res.data || []
        const todayItem = items.find(d => d.date === todayStr)

        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`
        const yestItem = items.find(d => d.date === yesterdayStr)

        setTodayCount(todayItem?.count ?? 0)
        setYesterdayCount(yestItem?.count ?? 0)
      })
      .catch(err => {
        console.warn('[useTodayCount] API failed, using mock data:', err.message)
        if (cancelled) return
        const raw = getMockDateChart(todayStr, viewType, 2)

        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

        const todayData = raw.find(d => d.date === todayStr)
        const yestData = raw.find(d => d.date === yesterdayStr)
        setTodayCount(todayData?.count ?? 0)
        setYesterdayCount(yestData?.count ?? 0)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [viewType])

  const pctChange = yesterdayCount > 0
    ? (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)
    : null

  return { todayCount, yesterdayCount, pctChange, loading }
}

// ─── useReceivingModes ───────────────────────────────────────────

export function useReceivingModes() {
  const [modes, setModes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    dashboardApi.getReceivingModes()
      .then(data => { if (!cancelled) setModes(data.receiving_modes || []) })
      .catch(err => {
        console.warn('[useReceivingModes] API failed, using mock data:', err.message)
        if (!cancelled) {
          setModes(getMockReceivingModes())
          setError(err)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return { modes, loading, error }
}
