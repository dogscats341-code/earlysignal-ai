export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.body || {}
  if (!url) return res.status(200).json({ success: false, blocked: true, data: { price: 'BLOCKED', source: 'No URL' } })

  let hostname = 'unknown'
  try { hostname = new URL(url).hostname.replace('www.', '') } catch {}
  const realSource = `${hostname} Live`

  // 1. محاولات جلب الصفحة - من أسهل لأصعب
  const attempts = [
    { name: 'direct', getUrl: (u) => u },
    { name: 'allorigins', getUrl: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { name: 'corsproxy', getUrl: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
  ]

  let html = ''
  let used = ''

  for (const attempt of attempts) {
    try {
      const fetchUrl = attempt.getUrl(url)
      const r = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,ar-MA;q=0.8,en-US;q=0.7,en;q=0.6',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(12000)
      })
      const text = await r.text()
      // الصفحة خاصها تكون كبيرة وما فيهاش بلوك
      if (text && text.length > 2000 &&!text.toLowerCase().includes('checking if the site connection') &&!text.toLowerCase().includes('ddos protection by')) {
        html = text
        used = attempt.name
        // إلا لقينا ثمن فالصفحة، حبسو
        if (text.match(/price|prc|DH|MAD|\$|€/i)) break
      }
    } catch (e) { continue }
  }

  if (!html) {
    return res.status(200).json({
      success: false, blocked: true,
      data: {
        title: `BLOCKED - ${hostname}`,
        price: 'BLOCKED',
        numericPrice: 0,
        availability: `All proxies blocked by ${hostname} - Site needs JS browser`,
        url, source: realSource, checkedAt: new Date().toISOString(), hostname
      }
    })
  }

  // 2. استخراج المعلومات الحقيقية - 4 طرق

  // الطريقة 1: JSON-LD (أقوى طريقة - 80% ديال المواقع كيستعملوها)
  let title = '', price = '', availability = '', image = '', currency = ''
  try {
    const jsonLdMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    for (const m of jsonLdMatches) {
      try {
        const data = JSON.parse(m[1])
        const obj = Array.isArray(data)? data.find(d => d['@type'] === 'Product') : data
        const product = obj && obj['@type'] === 'Product'? obj : (obj?.['@graph']?.find(g => g['@type'] === 'Product') || null)
        if (product) {
          if (!title) title = product.name || ''
          if (!price && product.offers) {
            const offer = Array.isArray(product.offers)? product.offers[0] : product.offers
            price = offer?.price?.toString() || offer?.lowPrice?.toString() || ''
            currency = offer?.priceCurrency || ''
            availability = offer?.availability || ''
          }
          if (!image) image = (Array.isArray(product.image)? product.image[0] : product.image) || ''
          if (price) break
        }
      } catch {}
    }
  } catch {}

  // الطريقة 2: Meta tags
  if (!title) title = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] || html.match(/<title[^>]*>([^<]{5,150})<\/title>/i)?.[1] || hostname
  if (!price) price = html.match(/<meta property="product:price:amount" content="([^"]+)"/i)?.[1] || html.match(/<meta property="og:price:amount" content="([^"]+)"/i)?.[1] || ''
  if (!image) image = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] || ''

  // الطريقة 3: Regex كلاسيكي للمواقع المغربية والعالمية
  if (!price) {
    const regexList = [
      /class="[^"]*current-price[^"]*"[^>]*>\s*([^<]{2,30})/i,
      /class="[^"]*price[^"]*"[^>]*>\s*([^<]*\d[^<]{1,20})/i,
      /class="prc"[^>]*>([^<]+DH[^<]*)/i,
      /"price"\s*:\s*"([\d.,]+)"/i,
      /(\d[\d\s.,]*\s*(?:DH|MAD|DHS))/i,
      /\$\s?[\d,]+\.?\d*/,
      /€\s?[\d,]+\.?\d*/
    ]
    for (const re of regexList) {
      const m = html.match(re)
      if (m && m[1] && m[1].replace(/[^0-9]/g,'').length >= 2) { price = m[1].trim(); break }
      if (m && m[0] &&!m[1] && m[0].replace(/[^0-9]/g,'').length >= 2) { price = m[0].trim(); break }
    }
  }

  // تنضيف
  title = title.trim().slice(0, 130)
  let finalPrice = (price || '').toString().trim()

  if (!finalPrice) {
    return res.status(200).json({
      success: false, blocked: false,
      data: {
        title,
        price: 'PRICE_NOT_FOUND',
        numericPrice: 0,
        availability: `HTML fetched (${html.length} chars) but no price found - Site uses JS rendering, needs browser`,
        url, source: realSource, checkedAt: new Date().toISOString(), strategy: used, hostname
      }
    })
  }

  // زيد العملة إلا ما كايناش
  if (!/DH|MAD|\$|€|£/.test(finalPrice)) {
    if (hostname.endsWith('.ma') || currency === 'MAD') finalPrice = finalPrice + ' DH'
    else if (currency === 'EUR') finalPrice = finalPrice + ' €'
    else finalPrice = '$' + finalPrice
  }

  const numeric = parseInt(finalPrice.replace(/[^0-9]/g, '')) || 0
  const low = html.toLowerCase()
  let availText = 'In stock'
  if (availability) {
    availText = availability.includes('OutOfStock')? 'Out of stock' : 'In stock'
  } else {
    if (low.includes('out of stock') || low.includes('rupture') || low.includes('indisponible') || low.includes('non disponible')) availText = 'Out of stock'
  }

  return res.status(200).json({
    success: true, blocked: false,
    data: {
      title, // عنوان حقيقي
      price: finalPrice, // ثمن حقيقي
      numericPrice: numeric,
      availability: availText,
      currency: currency || (finalPrice.includes('DH')? 'MAD' : 'USD'),
      image,
      url,
      source: realSource, // دابا iris.ma Live ماشي Jumia
      checkedAt: new Date().toISOString(),
      strategy: used,
      hostname
    }
  })
}
