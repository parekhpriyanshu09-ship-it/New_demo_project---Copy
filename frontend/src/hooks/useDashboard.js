import { useState, useEffect, useCallback } from 'react'
import {
  getMockCalendarDates,
  getMockDashboardStats,
  getMockDateChart,
  getMockDepartmentCounts,
  getMockReceivingModes,
} from '../data/dashboardMockData'

const formatChartData = (items) =>
  items.map(item => ({
    name: new Date(`${item.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    value: item.count,
    date: item.date,
  }))

export function useDashboardStats() {
  const [stats, setStats] = useState(getMockDashboardStats())
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  useEffect(() => {
    setStats(getMockDashboardStats())
    setLoading(false)
  }, [])

  return { stats, loading, error }
}

export function useCalendarData(month, year, viewType = 'inward') {
  const [dates, setDates] = useState(() => getMockCalendarDates(month, year, viewType))
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  useEffect(() => {
    setDates(getMockCalendarDates(month, year, viewType))
    setLoading(false)
  }, [month, year, viewType])

  return { dates, loading, error }
}

export function useDateChart(date = null, viewType = 'inward', days = 14) {
  const [data, setData] = useState(() => formatChartData(getMockDateChart(date, viewType, days)))
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  const fetch = useCallback(() => {
    setData(formatChartData(getMockDateChart(date, viewType, days)))
    setLoading(false)
  }, [date, viewType, days])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useDepartmentCounts() {
  const [departments, setDepartments] = useState(getMockDepartmentCounts())
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  useEffect(() => {
    setDepartments(getMockDepartmentCounts())
    setLoading(false)
  }, [])

  return { departments, loading, error }
}

export function useTodayCount(viewType = 'inward') {
  const [todayCount, setTodayCount] = useState(0)
  const [yesterdayCount, setYesterdayCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

    const raw = getMockDateChart(todayStr, viewType, 2)
    const todayData = raw.find(d => d.date === todayStr)
    const yestData = raw.find(d => d.date === yesterdayStr)

    setTodayCount(todayData?.count ?? 0)
    setYesterdayCount(yestData?.count ?? 0)
    setLoading(false)
  }, [viewType])

  const pctChange = yesterdayCount > 0
    ? (((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1)
    : null

  return { todayCount, yesterdayCount, pctChange, loading }
}

export function useReceivingModes() {
  const [modes, setModes] = useState(getMockReceivingModes())
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  useEffect(() => {
    setModes(getMockReceivingModes())
    setLoading(false)
  }, [])

  return { modes, loading, error }
}
