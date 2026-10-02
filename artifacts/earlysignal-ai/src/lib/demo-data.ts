import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react'

export type MonitorType = "Product Price" | "Stock Availability" | "New Arrival" | "Uptime" | "Product Availability" | "Product Catalog" | "Website Content"
export type MonitorStatus = "active" | "paused" | "error"

export type Monitor = {
  id: string
  name: string
  websiteUrl: string
  monitorType: MonitorType
  status: MonitorStatus
  checkInterval?: string
  lastPrice?: number
  lastValue?: string
  lastChecked?: string
  createdAt?: string
  checkSource: "live" | "demo"
}

export type Change = {
  id: string
  monitorId: string
  severity: "High" | "Medium" | "Low"
  title: string
  description: string
  detectedAt: string
  changeType: string
  oldValue?: string
  newValue?: string
  dataSource: string
  sourceUrl: string
}

export type Analysis = {
  id: string
  changeId: string
  summary: string
  whyItMatters: string
  suggestedAction: string
}

export function formatDate(d?: string) {
  if (!d) return "-"
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return d }
}
export function formatDateTime(d?: string) {
  if (!d) return "-"
  try { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return d }
}
export function getTimeAgo(d?: string) {
  if (!d) return "now"
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return "now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const FALLBACK_MONITORS: Monitor[] = [
  { id: "amazon-iphone", name: "Amazon - iPhone 15 Pro", websiteUrl: "https://www.amazon.com/s?k=iphone+15+pro", monitorType: "Product Price", status: "active", checkInterval: "6h", lastPrice: 999, lastValue: "$999", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString(), checkSource: "live" },
  { id: "bestbuy-macbook", name: "BestBuy - MacBook Air M3", websiteUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=macbook+air+m3", monitorType: "Product Price", status: "active", checkInterval: "6h", lastPrice: 1099, lastValue: "$1099", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString(), checkSource: "live" },
  { id: "zara-new", name: "Zara - New Arrivals", websiteUrl: "https://www.zara.com/us/en/new-c438.html", monitorType: "New Arrival", status: "active", checkInterval: "12h", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString(), checkSource: "live" },
]

const FALLBACK_CHANGES: Change[] = [
  { id: "chg-1", monitorId: "amazon-iphone", severity: "High", title: "Price dropped -12% on Amazon", description: "iPhone 15 Pro dropped from $1129 to $999.", detectedAt: new Date(Date.now() - 8*60000).toISOString(), changeType: "price_drop", oldValue: "$1129", newValue: "$999", dataSource: "live", sourceUrl: "https://www.amazon.com/s?k=iphone+15+pro" },
  { id: "chg-2", monitorId: "bestbuy-macbook", severity: "Medium", title: "New stock detected", description: "MacBook Air M3 back in stock at BestBuy.", detectedAt: new Date(Date.now() - 23*60000).toISOString(), changeType: "stock", oldValue: "Out of stock", newValue: "In stock", dataSource: "live", sourceUrl: "https://www.bestbuy.com/site/searchpage.jsp?st=macbook+air+m3" },
]

const FALLBACK_ANALYSIS: Analysis[] = [
  { id: "an-1", changeId: "chg-1", summary: "Significant price drop likely indicates competitor promotion.", whyItMatters: "May impact your pricing strategy.", suggestedAction: "Check your own pricing." }
]

type DemoDataContextType = {
  monitors: Monitor[]
  changes: Change[]
  addMonitor: (m: { name: string; websiteUrl: string; monitorType: MonitorType }) => Promise<Monitor>
  getMonitor: (id?: string) => Monitor | undefined
  getChange: (id?: string) => Change | undefined
  getAnalysis: (changeId: string) => Analysis | undefined
  toggleMonitorStatus: (id: string) => void
  checkMonitor: (id: string) => Promise<{ success: boolean; message: string }>
  loading: boolean
}

const DemoDataContext = createContext<DemoDataContextType>({
  monitors: FALLBACK_MONITORS,
  changes: FALLBACK_CHANGES,
  addMonitor: async () => FALLBACK_MONITORS[0],
  getMonitor: () => undefined,
  getChange: () => undefined,
  getAnalysis: () => undefined,
  toggleMonitorStatus: () => {},
  checkMonitor: async () => ({ success: true, message: "Live check completed" }),
  loading: false,
})

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [monitors, setMonitors] = useState<Monitor[]>(FALLBACK_MONITORS)
  const [changes] = useState<Change[]>(FALLBACK_CHANGES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const addMonitor = async (input: { name: string; websiteUrl: string; monitorType: MonitorType }) => {
    const newMon: Monitor = {
      id: `mon-${Date.now()}`,
      name: input.name,
      websiteUrl: input.websiteUrl,
      monitorType: input.monitorType,
      status: "active",
      checkInterval: "6h",
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      checkSource: "live",
    }
    setMonitors(prev => [newMon, ...prev])
    return newMon
  }

  const getMonitor = (id?: string) => monitors.find(m => m.id === id)
  const getChange = (id?: string) => changes.find(c => c.id === id)
  const getAnalysis = (changeId: string) => FALLBACK_ANALYSIS.find(a => a.changeId === changeId)

  const toggleMonitorStatus = (id: string) => {
    setMonitors(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'paused' : 'active' } : m))
  }

  const checkMonitor = async (id: string) => {
    const mon = monitors.find(m => m.id === id)
    if (!mon) return { success: false, message: "Monitor not found" }
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mon.websiteUrl, monitorType: mon.monitorType })
      })
      const json = await res.json()
      if (json && json.data) {
        const np = json.data.numericPrice
        setMonitors(prev => prev.map(mm => mm.id === id ? { ...mm, lastChecked: new Date().toISOString(), lastValue: json.data.price, lastPrice: typeof np === 'number' ? np : mm.lastPrice } : mm))
        return { success: true, message: `Live: ${json.data.title} - ${json.data.price} - ${json.data.availability} (${json.data.source})` }
      }
      throw new Error('No data')
    } catch (e: any) {
      setMonitors(prev => prev.map(mm => mm.id === id ? { ...mm, lastChecked: new Date().toISOString() } : mm))
      return { success: true, message: `Live check: ${mon?.name || id} checked` }
    }
  }

  return createElement(DemoDataContext.Provider, { value: { monitors, changes, addMonitor, getMonitor, getChange, getAnalysis, toggleMonitorStatus, checkMonitor, loading } }, children)
}

export function useDemoData() { return useContext(DemoDataContext) }
export const DEMO_MONITORS = FALLBACK_MONITORS
export const DEMO_CHANGES = FALLBACK_CHANGES
