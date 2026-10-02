export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.body || {}
  if (!url) return res.status(200).json({ success: false, data: { price: 'BLOCKED' } })

  let hostname = 'unknown'
  try { hostname = new URL(url).hostname.replace('www.', '') } catch {}
  const realSource = `${hostname} Live`

  // نجربو 3 خدمات كيديرو JS rendering بلا Chrome فـ Vercel
  const fetchers = [
    async (u) => {
      const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(u)}&meta=true`, { signal: AbortSignal.timeout(15000) })
      const j = await r.json()
      return j.data?.html || j.data?.description || ''
    },
    async (u) => {
      const r = await fetch(`https://cc.bingj.com/cache.aspx?d=467-051-2024&u=${encodeURIComponent(u)}&w=&h=&q=&m=B`, { signal: AbortSignal.timeout(12000) }).catch(()=>null)
      return r? await r.text() : ''
    },
    async (u) => {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, { signal: AbortSignal.timeout(12000) })
      return await r.text()
    }
  ]

  let html = ''
  for (const fn of fetchers) {
    try {
      const t = await fn(url)
      if (t && t.length > 1500) { html = t; if (t.match(/price|prc|DH|MAD|\$/i)) break }
    } catch {}
  }

  if (!html) {
    return res.status(200).json({ success: false, data: { title: `BLOCKED - ${hostname}`, price: 'BLOCKED', numericPrice: 0, availability: 'All proxies blocked', url, source: realSource, checkedAt: new Date().toISOString() }})
  }

  let title = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || html.match(/<title[^>]*>([^<]{5,150})<\/title>/i)?.[1] || hostname
  let price = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i)?.[1] || html.match(/class="[^"]*current-price[^"]*"[^>]*>([^<]+)/i)?.[1] || html.match(/class="[^"]*prc[^"]*"[^>]*>([^<]+)/i)?.[1] || html.match(/(\d[\d\s.,]*\s*(?:DH|MAD))/i)?.[1] || html.match(/\$\s?[\d,]+\.?\d*/)?.[0] || ''

  // خاص بـ iris.ma
  if (!price) {
    const m = html.match(/<span[^>]*itemprop="price"[^>]*content="([^"]+)"/i) || html.match(/<meta property="product:price:amount" content="([^"]+)"/i)
    if (m) price = m[1]
  }

  title = title.trim().slice(0,130)
  price = price.trim()

  if (!price) {
    return res.status(200).json({ success: false, data: { title, price: 'PRICE_NOT_FOUND', numericPrice: 0, availability: `Fetched ${html.length} chars but no price`, url, source: realSource, checkedAt: new Date().toISOString(), hostname }})
  }

  if (!/DH|MAD|\$|€|£/.test(price)) price = hostname.endsWith('.ma')? price + ' DH' : '$' + price
  const numeric = parseInt(price.replace(/[^0-9]/g,''))||0

  return res.status(200).json({ success: true, data: { title, price, numericPrice: numeric, availability: 'In stock', url, source: realSource, checkedAt: new Date().toISOString(), strategy: 'microlink-render', hostname }})
}
