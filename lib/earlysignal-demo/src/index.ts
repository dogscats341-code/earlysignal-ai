export type Monitor = {
  id: string
  name: string
  websiteUrl: string
  monitorType: "Product Price" | "Stock Availability" | "New Arrival" | "Uptime"
  status: "active" | "paused" | "error"
  checkInterval?: string
  lastPrice?: number
  lastChecked?: string
  createdAt?: string
}

export const MONITORS: Monitor[] = [
  { id: "jumia-iphone", name: "Jumia Morocco - iPhone 15", websiteUrl: "https://www.jumia.ma/catalog/?q=iphone+15", monitorType: "Product Price", status: "active", checkInterval: "6h", lastPrice: 10990, lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "jumia-samsung", name: "Jumia Morocco - Samsung", websiteUrl: "https://www.jumia.ma/catalog/?q=samsung+galaxy", monitorType: "Product Price", status: "active", checkInterval: "6h", lastPrice: 7999, lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "avito-iphone", name: "Avito.ma - iPhone 15", websiteUrl: "https://www.avito.ma/fr/maroc/telephones_a_vendre--a_vendre?o=2&q=iphone+15", monitorType: "Product Price", status: "active", checkInterval: "6h", lastPrice: 9500, lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "【entity-zara¦canonical_name=Zara】-ma", name: "【entity-Zara¦canonical_name=Zara】 Morocco", websiteUrl: "https://www.zara.com/ma/fr/", monitorType: "New Arrival", status: "active", checkInterval: "12h", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "decathlon-ma", name: "Decathlon Morocco", websiteUrl: "https://www.decathlon.ma/", monitorType: "Uptime", status: "active", checkInterval: "6h", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "hm-ma", name: "【entity-H&M¦canonical_name=H&M】 Morocco", websiteUrl: "https://www2.hm.com/fr_ma/index.html", monitorType: "New Arrival", status: "active", checkInterval: "12h", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
]

export const REFRESH_INTERVAL = 6 * 60 * 60 * 1000
export const NEXT_CHECK_LABEL = "Next check in 6h"

export type DemoMonitor = Monitor
export const DEMO_MONITORS: DemoMonitor[] = MONITORS

export type DemoChange = {
  id: string
  monitorId: string
  severity: "low" | "medium" | "high"
  title: string
  description: string
  createdAt: string
  previousValue?: any
  currentValue?: any
}

export const DEMO_CHANGES: DemoChange[] = []

export type DemoAIAnalysis = {
  id: string
  changeId: string
  summary: string
  impact?: string
}

export const DEMO_AI_ANALYSES: DemoAIAnalysis[] = []
