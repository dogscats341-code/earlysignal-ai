export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const { url } = req.body || {}
    if (!url) throw new Error('No URL')
    const strategies = [
      { name: 'desktop', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8' }, url: url },
      { name: 'mobile', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' }, url: url.replace('www.', 'm.') }
    ]
    let html = ''
    let stratUsed = ''
    let lastStatus = ''
    for (const s of strategies) {
      try {
        const r = await fetch(s.url, { headers: s.headers })
        const t = await r.text()
        const low = t.toLowerCase()
        const blocked = low.includes('captcha') || low.includes('robot') || low.includes('access denied') || r.status===403 || r.status===503 || t.length<800
        if (!blocked) { html = t; stratUsed = s.name; lastStatus = r.status; break }
        lastStatus = 'blocked-'+r.status
      } catch(e) { lastStatus = e.message }
    }
    if (!html) {
      return res.status(200).json({ success: false, blocked: true, data: { title: 'BLOCKED by anti-bot', price: 'BLOCKED', numericPrice: 0, availability: 'Site blocks Vercel IP - '+lastStatus, url, source: 'Blocked', checkedAt: new Date().toISOString(), strategy: 'all-failed' } })
    }
    const title = (html.match(/<title[^>]*>([^<]{5,120})<\/title>/i)?.[1] || 'Live Product').trim().slice(0,100)
    let price = null
    const m1 = html.match(/class="prc"[^>]*>([^<]+DH[^<]*)/i)
    if (m1) price = m1[1].trim()
    if (!price) { const m2 = html.match(/"price"\s*:\s*"?([\d.,]+)"?/i); if (m2) price = m2[1] + (url.includes('jumia')?' DH':'') }
    if (!price) { const m3 = html.match(/(\d[\d\s,]{2,}\s*DH)/i); if (m3) price = m3[0].trim() }
    if (!price) { const m4 = html.match(/\$\s?[\d,]+\.?\d*/); if (m4) price = m4[0] }
    if (!price) {
      return res.status(200).json({ success: false, blocked: false, data: { title, price: 'PRICE_NOT_FOUND', numericPrice: 0, availability: 'Price pattern not found - strategy '+stratUsed, url, source: 'NotFound', checkedAt: new Date().toISOString(), strategy: stratUsed } })
    }
    const numeric = parseInt(price.replace(/[^0-9]/g,''))||0
    const avail = html.toLowerCase().includes('out of stock')||html.toLowerCase().includes('rupture')?'Out of stock':'In stock'
    const src = url.includes('jumia')?'Jumia Live':url.includes('【entity-amazon¦canonical_name=Amazon】')?'【entity-Amazon¦canonical_name=Amazon】 Live':url.includes('【entity-zara¦canonical_name=Zara】')?'【entity-Zara¦canonical_name=Zara】 Live':'Live Global'
    return res.status(200).json({ success: true, blocked: false, data: { title, price, numericPrice: numeric, availability: avail, url, source: src, checkedAt: new Date().toISOString(), strategy: stratUsed } })
  } catch(e) {
    return res.status(200).json({ success: false, blocked: true, data: { title: 'Error', price: 'ERROR', numericPrice: 0, availability: e.message, url: req.body?.url, source: 'Error', checkedAt: new Date().toISOString() } })
  }
}
