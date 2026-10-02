export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.body || {}
  if (!url) return res.status(200).json({ success: false, data: { title: 'No URL', price: 'BLOCKED', numericPrice: 0, availability: 'No URL' } })

  // 3 proxies مجانيين كيتجاوزو بلوك Vercel
  const proxies = [
    (u) => u, // مباشر
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
  ]

  let html = ''
  let used = ''

  for (let i = 0; i < proxies.length; i++) {
    try {
      const proxyUrl = proxies[i](url)
      const r = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'fr-FR,fr;q=0.9,ar-MA;q=0.8,en;q=0.7'
        }
      })
      const t = await r.text()
      if (t && t.length > 2000 &&!t.toLowerCase().includes('captcha') &&!t.toLowerCase().includes('access denied')) {
        // قلب على الثمن فهاد الصفحة
        if (t.includes('prc') || t.includes('DH') || t.includes('price') || t.includes('$')) {
          html = t
          used = i === 0? 'direct' : `proxy-${i}`
          break
        }
      }
    } catch (e) { continue }
  }

  if (!html) {
    return res.status(200).json({
      success: false,
      blocked: true,
      data: {
        title: 'BLOCKED - All proxies failed',
        price: 'BLOCKED',
        numericPrice: 0,
        availability: 'Jumia blocks US IPs - Proxy also blocked, try Zara/BestBuy',
        url, source: 'Blocked', checkedAt: new Date().toISOString()
      }
    })
  }

  // استخراج الثمن
  const title = (html.match(/<title[^>]*>([^<]{5,120})<\/title>/i)?.[1] || 'Live Product').trim().slice(0,100)
  let price = null

  // Jumia
  let m = html.match(/class="prc"[^>]*>([^<]+DH[^<]*)/i)
  if (m) price = m[1].trim()
  if (!price) { m = html.match(/"price":\s*"?([\d.,]+)"?/i); if (m) price = m[1] + ' DH' }
  if (!price) { m = html.match(/(\d[\d\s.,]{2,}\s*DH)/i); if (m) price = m[0].trim() }
  if (!price) { m = html.match(/\$\s?[\d,]+\.?\d*/); if (m) price = m[0] }
  if (!price) { m = html.match(/€\s?[\d,]+\.?\d*/); if (m) price = m[0] }

  if (!price) {
    return res.status(200).json({
      success: false,
      data: {
        title,
        price: 'PRICE_NOT_FOUND',
        numericPrice: 0,
        availability: 'HTML fetched but price pattern not found - strategy: ' + used,
        url, source: 'NotFound', checkedAt: new Date().toISOString()
      }
    })
  }

  const numeric = parseInt(price.replace(/[^0-9]/g, '')) || 0
  const low = html.toLowerCase()
  const avail = low.includes('out of stock') || low.includes('rupture')? 'Out of stock' : 'In stock'
  const source = url.includes('jumia')? 'Jumia Live via Proxy' : 'Live via Proxy'

  return res.status(200).json({
    success: true,
    data: { title, price, numericPrice: numeric, availability: avail, url, source: source + ' [' + used + ']', checkedAt: new Date().toISOString() }
  })
}
