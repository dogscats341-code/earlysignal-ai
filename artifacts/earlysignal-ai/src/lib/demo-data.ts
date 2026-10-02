import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from './supabase'
import { MONITORS as FALLBACK_MONITORS, type Monitor } from '@workspace/earlysignal-demo'

type DemoDataContextType = {
  monitors: Monitor[]
  changes: any[]
  loading: boolean
  refresh: () => Promise<void>
}

const DemoDataContext = createContext<DemoDataContextType>({
  monitors: FALLBACK_MONITORS,
  changes: [],
  loading: false,
  refresh: async () => {},
})

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [monitors, setMonitors] = useState<Monitor[]>(FALLBACK_MONITORS)
  const [changes, setChanges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('monitors').select('*')
      if (!error && data && data.length > 0) {
        const mapped: Monitor[] = data.map((m: any) => ({
          id: m.id,
          name: m.name,
          websiteUrl: m.website_url || m.websiteUrl,
          monitorType: m.monitor_type || m.monitorType || 'Product Price',
          status: m.status || 'active',
          checkInterval: m.check_interval || m.checkInterval || '6h',
          lastPrice: m.last_price || m.lastPrice,
          lastChecked: m.last_checked || m.lastChecked || new Date().toISOString(),
          createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        }))
        setMonitors(mapped)
      }
    } catch (e) {
      console.log('Supabase fallback used', e)
    } finally {
      setLoading(false)
    }
    
    try {
      const { data: changesData } = await supabase.from('changes').select('*').order('created_at', { ascending: false }).limit(20)
      if (changesData) setChanges(changesData)
    } catch {}
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <DemoDataContext.Provider value={{ monitors, changes, loading, refresh }}>
      {children}
    </DemoDataContext.Provider>
  )
}

export function useDemoData() {
  return useContext(DemoDataContext)
}

// Keep old exports for compatibility
export const DEMO_MONITORS = FALLBACK_MONITORS
export const DEMO_MONITORS_FALLBACK = FALLBACK_MONITORS
export const DEMO_CHANGES: any[] = []
export const DEMO_STATS = {
  sitesMonitored: 6,
  changesDetectedToday: 1,
  avgResponseTime: "59ms",
  sitesDownOrBlocked: 1
}
export async function getMonitors() {
  try {
    const { data } = await supabase.from('monitors').select('*')
    if (data && data.length > 0) return data
  } catch {}
  return FALLBACK_MONITORS
}
