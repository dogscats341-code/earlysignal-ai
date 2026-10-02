export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.body || {}
  if (!url) return res.status(200).json({ success: false, data: { title: 'No URL', price: 'N/A', numericPrice: 0, availability: 'No URL', url, source: 'Error', checkedAt: new Date().toISOString(), blocked: true } })

  // --- 1. Detect platform ---
  const domain = (() => { try { return new URL(url).hostname } catch { return '' } })()
  const isJumia = domain.includes('jumia')
  const isAmazon = domain.includes('amazon')
  const isZara = domain.includes('zara')
  const isBestBuy = domain.includes('bestbuy')
  const isWalmart = domain.includes('【entity-walmart¦canonical_name=Walmart】')
  const isEbay = domain.includes('【entity-ebay¦canonical_name=eBay】')
  const isTarget = domain.includes('【entity-target¦canonical_name=Target】')
  const isNoon = domain.includes('noon')
  const isNike = domain.includes('【entity-nike¦canonical_name=Nike】')

  const sourceMap = {
    jumia: 'Jumia Global', amazon: 'Amazon Global', zara: 'Zara Global', bestbuy: 'BestBuy', 【entity-walmart¦canonical_name=Walmart】: '【entity-Walmart¦canonical_name=Walmart】', 【entity-ebay¦canonical_name=eBay】: '【entity-eBay¦canonical_name=eBay】', 【entity-target¦canonical_name=Target】: '【entity-Target¦canonical_name=Target】', noon: 'Noon', 【entity-nike¦canonical_name=Nike】: '【entity-Nike¦canonical_name=Nike】', default: 'Live Global'
  }
  let srcKey = Object.keys(sourceMap).find(k => domain.includes(k)) || 'default'
  const source = sourceMap[srcKey]

  // --- 2. Bypass strategies ---
  const strategies = [
    {
      name: 'desktop',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache'
      },
      url: url
    },
    {
      name: 'mobile',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      url: url.replace('www.', 'm.').replace('https://amazon.com', 'https://m.amazon.com')
    },
    {
      name: 'bot-google',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': '*/*',
      },
      url: url
    }
  ]

  let html = ''
  let lastError = ''
  let usedStrategy = ''

  for (const strat of strategies) {
    try {
      const r = await fetch(strat.url, { headers: strat.headers, redirect: 'follow' })
      const text = await r.text()
      // Detect block page
      const low = text.toLowerCase()
      const isBlocked = low.includes('captcha') || low.includes('are you a robot') || low.includes('pardon our interruption') || low.includes('access denied') || low.includes('robot check') || low.includes('sorry, we just need to make sure') || text.length < 800 || r.status === 403 || r.status === 503

      if (!isBlocked && text.length > 1000) {
        html = text
        usedStrategy = strat.name
        break
      } else {
        lastError = `Blocked (${strat.name}: ${r.status})`
      }
    } catch (e) {
      lastError = e.message
      continue
    }
  }

  if (!html) {
    return res.status(200).json({
      success: false,
      blocked: true,
      data: {
        title: 'Blocked by anti-bot protection',
        price: 'BLOCKED',
        numericPrice: 0,
        availability: `All strategies blocked - ${lastError} - Site protects against Vercel IP`,
        url, source, checkedAt: new Date().toISOString(), strategy: 'all-failed', domain
      }
    })
  }

  // --- 3. Universal Price Extractors ---
  const title = (html.match(/<title[^>]*>([^<]{5,150})<\/title>/i)?.[1] || 'Live Product').trim().replace(/\s+/g, ' ').slice(0,120)

  let price = null
  let raw = null

  const extractors = [
    // Jumia / Noon / DH / MAD / EGP
    () => html.match(/class="prc"[^>]*>([^<]*DH[^<]*)/i)?.[1],
    () => html.match(/class="[^"]*price[^"]*"[^>]*>([^<]*\d[^<]*DH[^<]*)/i)?.[1],
    () => html.match(/(\d[\d\s,\.]{1,}\s*(?:DH|MAD|DHS|EGP|SAR|AED))/i)?.[0],
    // Amazon a-price
    () => {
      const whole = html.match(/class="a-price-whole"[^>]*>([^<]+)/i)?.[1]
      const frac = html.match(/class="a-price-fraction"[^>]*>([^<]+)/i)?.[1]
      const off = html.match(/class="a-offscreen"[^>]*>\s*\$([\d,\.]+)/i)?.[1]
      if (whole) return '$' + whole.replace(/[^0-9]/g,'') + '.' + (frac||'00')
      if (off) return '$' + off
      return null
    },
    // JSON-LD
    () => {
      const j = html.match(/"price"\s*:\s*"?([\d\.,]+)"?/i)?.[1]
      if (j) return j
      return null
    },
    // Generic $ € £
    () => html.match(/\$\s?[\d,]+\.?\d*/)?.[0],
    () => html.match(/€\s?[\d,]+\.?\d*/)?.[0],
    () => html.match(/£\s?[\d,]+\.?\d*/)?.[0],
    // data-price / meta
    () => html.match(/data-price="([\d\.]+)"/i)?.[1],
    () => html.match(/property="product:price:amount" content="([\d\.]+)"/i)?.[1],
  ]

  for (const fn of extractors) {
    try {
      const val = fn()
      if (val && val.toString().replace(/[^0-9]/g,'').length >= 2) {
        price = val.toString().trim()
        raw = val
        break
      }
    } catch {}
  }

  if (!price) {
    return res.status(200).json({
      success: false,
      blocked: false,
      data: {
        title,
        price: 'PRICE_NOT_FOUND',
        numericPrice: 0,
        availability: `Price pattern not found - site changed HTML (strategy: ${usedStrategy})`,
        url, source, checkedAt: new Date().toISOString(), strategy: usedStrategy, domain,
        htmlLength: html.length
      }
    })
  }

  // Format price
  let finalPrice = price
  if (isJumia || /DH|MAD/i.test(price)) {
    finalPrice = price.includes('DH')? price : price + ' DH'
  } else if (!/[$€£]/.test(price) && raw) {
    // Add $ if generic number and not DH
    if (!isNaN(parseFloat(raw))) finalPrice = '$' + parseFloat(raw).toString()
  }

  const numeric = parseInt(finalPrice.replace(/[^0-9]/g, '')) || 0
  const low = html.toLowerCase()
  let avail = 'Live'
  if (low.includes('out of stock') || low.includes('rupture') || low.includes('out-of-stock') || low.includes('temporarily out')) avail = 'Out of stock'
  else if (low.includes('in stock') || low.includes('add to cart') || low.includes('ajouter au panier') || low.includes('add to basket')) avail = 'In stock'

  return res.status(200).json({
    success: true,
    blocked: false,
    data: {
      title,
      price: finalPrice,
      numericPrice: numeric,
      availability: avail,
      url, source,
      checkedAt: new Date().toISOString(),
      strategy: usedStrategy,
      domain,
      global: true
    }
  })
}
