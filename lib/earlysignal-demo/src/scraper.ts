// Phase 5 - Proxy scraper with 3-tier fallback for Moroccan sites
export type ScrapeResult = {
  status: "ok" | "blocked_cached" | "blocked" | "down"
  price?: number
  currency?: string
  html?: string
  error?: string
  source: "direct" | "proxy" | "cache"
}

const MOROCCAN_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-MA,fr;q=0.9,ar-MA;q=0.8,ar;q=0.7,en-US;q=0.6,en;q=0.5",
  "Referer": "https://www.google.co.ma/"
}

const cache = new Map<string, { price: number, time: number }>()

async function tryDirect(url: string): Promise<Response> {
  return fetch(url, { headers: MOROCCAN_HEADERS, next: { revalidate: 21600 } as any })
}

async function tryProxy(url: string): Promise<Response> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`
  ]
  for (const p of proxies) {
    try {
      const r = await fetch(p)
      if (r.ok) return r
    } catch {}
  }
  throw new Error("proxy failed")
}

function extractPrice(html: string): number | null {
  const m1 = html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]+)?)"?/)
  if (m1) return parseFloat(m1[1])
  const m2 = html.match(/([0-9]{2,3}[\s\,]?[0-9]{3})\s*D?H/i)
  if (m2) return parseFloat(m2[1].replace(/[\s,]/g,""))
  const m3 = html.match(/data-price="([0-9.]+)"/)
  if (m3) return parseFloat(m3[1])
  return null
}

export async function scrapeWithFallback(url: string, lastPrice?: number): Promise<ScrapeResult> {
  try {
    const res = await tryDirect(url)
    if (res.status === 403 || res.status === 429) throw new Error(`blocked_${res.status}`)
    if (res.status >= 500) return { status: "down", error: `HTTP ${res.status}`, source: "direct" }
    if (!res.ok) throw new Error(`blocked_${res.status}`)
    const html = await res.text()
    const price = extractPrice(html)
    if (price) {
      cache.set(url, { price, time: Date.now() })
      return { status: "ok", price, currency: "MAD", html: html.slice(0,5000), source: "direct" }
    }
    const cached = cache.get(url)
    return { status: "blocked_cached", price: cached?.price ?? lastPrice, currency: "MAD", source: "direct", error: "Price not detected - using cached" }
  } catch (e:any) {
    try {
      const res = await tryProxy(url)
      const html = await res.text()
      const price = extractPrice(html)
      if (price) {
        cache.set(url, { price, time: Date.now() })
        return { status: "ok", price, currency: "MAD", source: "proxy" }
      }
    } catch {}
    const cached = cache.get(url)
    if (cached || lastPrice) {
      return { status: "blocked_cached", price: cached?.price ?? lastPrice, currency: "MAD", source: "cache", error: "Blocked by anti-bot - showing cached data" }
    }
    return { status: "blocked", error: "Blocked by anti-bot protection (HTTP 403) - Last known price retained", source: "cache" }
  }
}
