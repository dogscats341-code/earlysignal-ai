import { supabase } from './supabase'

export const DEMO_MONITORS_FALLBACK = [
  { id: "jumia-iphone", name: "Jumia Morocco - iPhone 15", url: "https://www.jumia.ma/catalog/?q=iphone+15", websiteUrl: "https://www.jumia.ma/catalog/?q=iphone+15", status: "active", monitorType: "price_drop", checkInterval: "6h", lastPrice: 10990 },
  { id: "jumia-samsung", name: "Jumia Morocco - Samsung", url: "https://www.jumia.ma/catalog/?q=samsung+galaxy", websiteUrl: "https://www.jumia.ma/catalog/?q=samsung+galaxy", status: "active", monitorType: "price_drop", checkInterval: "6h", lastPrice: 7999 },
]

export async function getMonitors() {
  try {
    const { data, error } = await supabase.from('monitors').select('*')
    if (!error && data && data.length > 0) return data
  } catch (e) { console.log('using fallback') }
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
