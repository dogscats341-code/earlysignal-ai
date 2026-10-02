export type Monitor = {
  id: string
  name: string
  url: string
  type: "price" | "stock" | "new_arrival" | "uptime"
  checkInterval: string
  lastPrice?: number
  status: "active" | "paused" | "error"
  lastChecked?: string
  createdAt?: string
  [key: string]: any
}

export const MONITORS: Monitor[] = [
  { id: "jumia-iphone", name: "Jumia Morocco - iPhone 15", url: "https://www.jumia.ma/catalog/?q=iphone+15", type: "price", checkInterval: "6h", lastPrice: 10990, status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "jumia-samsung", name: "Jumia Morocco - Samsung", url: "https://www.jumia.ma/catalog/?q=samsung+galaxy", type: "price", checkInterval: "6h", lastPrice: 7999, status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "avito-iphone", name: "Avito.ma - iPhone 15", url: "https://www.avito.ma/fr/maroc/telephones_a_vendre--a_vendre?o=2&q=iphone+15", type: "price", checkInterval: "6h", lastPrice: 9500, status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "zara-ma", name: "Zara Morocco", url: "https://www.zara.com/ma/fr/", type: "new_arrival", checkInterval: "12h", status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "decathlon-ma", name: "Decathlon Morocco", url: "https://www.decathlon.ma/", type: "uptime", checkInterval: "6h", status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
  { id: "hm-ma", name: "H&M Morocco", url: "https://www2.hm.com/fr_ma/index.html", type: "new_arrival", checkInterval: "12h", status: "active", lastChecked: new Date().toISOString(), createdAt: new Date().toISOString() },
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
}
export const DEMO_CHANGES: DemoChange[] = []

export type DemoAIAnalysis = {
  id: string
  changeId: string
  summary: string
}
export const DEMO_AI_ANALYSES: DemoAIAnalysis[] = []
