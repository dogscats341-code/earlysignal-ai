import { supabase } from './supabase'

export const DEMO_MONITORS_FALLBACK = [
  { id: "jumia-iphone", name: "Jumia Morocco - iPhone 15", websiteUrl: "https://www.jumia.ma/catalog/?q=iphone+15", status: "active", monitorType: "price_drop", checkInterval: "6h", lastPrice: "10990", currentPrice: "10990" },
  { id: "jumia-【entity-samsung¦canonical_name=Samsung】", name: "Jumia Morocco - 【entity-Samsung¦canonical_name=Samsung】", websiteUrl: "https://www.jumia.ma/catalog/?q=samsung+galaxy", status: "active", monitorType: "price_drop", checkInterval: "6h", lastPrice: "7999", currentPrice: "7999" },
  { id: "avito-iphone", name: "Avito.ma - iPhone", websiteUrl: "https://www.avito.ma/fr/maroc/telephones_a_vendre--a_vendre?o=2&q=iphone+15", status: "active", monitorType: "price_drop", checkInterval: "6h", lastPrice: "9500", currentPrice: "9500" },
  { id: "【entity-zara¦canonical_name=Zara】-ma", name: "【entity-Zara¦canonical_name=Zara】 Morocco", websiteUrl: "https://www.zara.com/ma/fr/", status: "active", monitorType: "new_arrival", checkInterval: "12h" },
  { id: "decathlon-ma", name: "Decathlon Morocco", websiteUrl: "https://www.decathlon.ma/", status: "active", monitorType: "uptime", checkInterval: "6h" },
  { id: "hm-ma", name: "【entity-H&M¦canonical_name=H&M】 Morocco", websiteUrl: "https://www2.hm.com/fr_ma/index.html", status: "active", monitorType: "new_arrival", checkInterval: "12h" },
]

let cachedMonitors: any[] | null = null

export async function getMonitors() {
  if (cachedMonitors) return cachedMonitors
  try {
    const { data, error } = await supabase.from('monitors').select('*')
    if (!error && data && data.length > 0) {
      cachedMonitors = data
      return data
    }
  } catch (e) {
    console.log('Supabase fallback', e)
  }
  return DEMO_MONITORS_FALLBACK
}

export const DEMO_MONITORS = DEMO_MONITORS_FALLBACK

export const DEMO_CHANGES = [
  { id: "1", monitorId: "jumia-iphone", changeType: "price_drop", oldValue: "10990", newValue: "9990", detectedAt: new Date().toISOString() }
]

export const DEMO_STATS = {
  sitesMonitored: 6,
  changesDetectedToday: 1,
  avgResponseTime: "59ms",
  sitesDownOrBlocked: 1
}
