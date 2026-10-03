export default async function handler(req, res) {
  // إعدادات CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch {}
  }

  const { url } = body || {}
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL parameter is required' })
  }

  let hostname = 'unknown'
  try {
    hostname = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format' })
  }

  const realSource = `${hostname} Live`

  // 1. استراتيجيات الجلب (Direct Fetch + Fallback Proxies)
  const fetchers = [
    // الاستراتيجية 1: الطلب المباشر بـ User-Agent لمتصفح حقيقي (الأسرع والأنجح)
    async (u) => {
      const r = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(8000)
      })
      if (!r.ok) throw new Error(`HTTP status ${r.status}`)
      return await r.text()
    },
    // الاستراتيجية 2: Microlink API
    async (u) => {
      const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(u)}&meta=true`, {
        signal: AbortSignal.timeout(12000)
      })
      const j = await r.json()
      return j.data?.html || j.data?.description || ''
    },
    // الاستراتيجية 3: AllOrigins Proxy
    async (u) => {
      const r = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, {
        signal: AbortSignal.timeout(10000)
      })
      return await r.text()
    }
  ]

  let html = ''
  let usedStrategy = 'direct-fetch'

  for (let i = 0; i < fetchers.length; i++) {
    try {
      const content = await fetchers[i](url)
      if (content && content.length > 800) {
        html = content
        usedStrategy = i === 0 ? 'direct-fetch' : i === 1 ? 'microlink-render' : 'allorigins-proxy'
        if (content.match(/price|prc|DH|MAD|\$|€|offer|product/i)) break
      }
    } catch {}
  }

  if (!html) {
    return res.status(200).json({
      success: false,
      data: {
        title: `BLOCKED - ${hostname}`,
        price: 'BLOCKED',
        numericPrice: 0,
        availability: 'All proxies and direct fetch blocked',
        url,
        source: realSource,
        checkedAt: new Date().toISOString()
      }
    })
  }

  // دالة لتنظيف الرموز الخاصة في HTML
  const decodeEntities = (str) => {
    if (!str) return ''
    return str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }

  let title = ''
  let price = ''
  let isAvailable = true

  // 2. محاولة استخراج البيانات المنسقة JSON-LD (Schema.org) أولاً
  try {
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const cleanContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
        try {
          const parsed = JSON.parse(cleanContent)
          const items = Array.isArray(parsed) ? parsed : [parsed]

          for (const item of items) {
            const type = item['@type']
            if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
              if (item.name) title = item.name

              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
              if (offers) {
                if (offers.price) price = String(offers.price)
                if (offers.priceCurrency && price && !price.includes(offers.priceCurrency)) {
                  price = `${price} ${offers.priceCurrency}`
                }
                if (offers.availability) {
                  isAvailable = !offers.availability.includes('OutOfStock')
                }
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 3. استخراج العنوان الثانوي (Fallback)
  if (!title) {
    title = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] ||
            html.match(/<title[^>]*>([^<]{3,150})<\/title>/i)?.[1] ||
            hostname
  }
  title = decodeEntities(title).trim().slice(0, 130)

  // 4. استخراج السعر الثانوي (Fallback)
  if (!price) {
    price = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i)?.[1] ||
            html.match(/<span[^>]*itemprop="price"[^>]*content="([^"]+)"/i)?.[1] ||
            html.match(/<meta property="product:price:amount" content="([^"]+)"/i)?.[1] ||
            html.match(/class="[^"]*(?:current-price|prc|price|product-price)[^"]*"[^>]*>([^<]+)/i)?.[1] ||
            html.match(/(\d[\d\s.,]*\s*(?:DH|MAD|USD|EUR|\$|€))/i)?.[1] ||
            html.match(/(?:DH|MAD|\$|€)\s*([\d\s.,]+)/i)?.[0] || ''
  }

  price = decodeEntities(price).trim()

  if (!price) {
    return res.status(200).json({
      success: false,
      data: {
        title,
        price: 'PRICE_NOT_FOUND',
        numericPrice: 0,
        availability: `Fetched ${html.length} chars but price selector missed`,
        url,
        source: realSource,
        checkedAt: new Date().toISOString(),
        hostname
      }
    })
  }

  // تنسيق العملة تلقائياً
  if (!/DH|MAD|\$|€|£/i.test(price)) {
    price = hostname.endsWith('.ma') ? `${price} DH` : `$${price}`
  }

  // 5. تحويل السعر إلى رقم صحيح بشكل دقيق (معالجة الفواصل والكسور)
  const parseNumericPrice = (str) => {
    const rawDigits = str.replace(/[^\d.,]/g, '')
    if (!rawDigits) return 0

    let clean = rawDigits
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf(',') < clean.indexOf('.')) {
        clean = clean.replace(/,/g, '')
      } else {
        clean = clean.replace(/\./g, '').replace(',', '.')
      }
    } else if (clean.includes(',')) {
      const parts = clean.split(',')
      if (parts[1] && parts[1].length === 2) {
        clean = clean.replace(',', '.')
      } else {
        clean = clean.replace(/,/g, '')
      }
    }
    return Math.round(parseFloat(clean)) || 0
  }

  const numericPrice = parseNumericPrice(price)

  // 6. التحقق من توفر المنتج من محتوى الصفحة
  if (html.match(/out of stock|rupture de stock|غير متوفر|sold out/i)) {
    isAvailable = false
  }

  return res.status(200).json({
    success: true,
    data: {
      title,
      price,
      numericPrice,
      availability: isAvailable ? 'In stock' : 'Out of stock',
      url,
      source: realSource,
      checkedAt: new Date().toISOString(),
      strategy: usedStrategy,
      hostname
    }
  })
}
