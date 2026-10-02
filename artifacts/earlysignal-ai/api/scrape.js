import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

export const config = {
  maxDuration: 30
}

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

  let browser = null
  try {
    chromium.setGraphicsMode = false
    const executablePath = await chromium.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v131.0.0/chromium-v131.0.0-pack.tar'
    )

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await new Promise(r => setTimeout(r, 3000))

    const data = await page.evaluate(() => {
      let title = document.querySelector('meta[property="og:title"]')?.content || document.title || ''
      let price = document.querySelector('[itemprop="price"]')?.content || document.querySelector('.current-price-value')?.innerText || document.querySelector('.current-price span')?.innerText || document.querySelector('.prc')?.innerText || document.querySelector('[data-buy-box-region="price"] p')?.innerText || ''
      if (!price) {
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
        for (const s of scripts) {
          try {
            const j = JSON.parse(s.innerText)
            const prod = Array.isArray(j) ? j.find(x=>x['@type']==='Product') : (j['@type']==='Product'?j:null)
            if (prod?.offers?.price) { price = prod.offers.price.toString(); title = prod.name || title; break }
          } catch {}
        }
      }
      const image = document.querySelector('meta[property="og:image"]')?.content || ''
      return { title: title.trim().slice(0,130), price: price.trim(), image }
    })

    await browser.close()
    browser = null

    if (!data.price) {
      return res.status(200).json({ success: false, data: { title: data.title||hostname, price: 'PRICE_NOT_FOUND', numericPrice: 0, availability: `Page loaded but price selector not found for ${hostname}`, url, source: realSource, checkedAt: new Date().toISOString(), hostname }})
    }

    let finalPrice = data.price
    if (!/DH|MAD|\$|€|£/.test(finalPrice)) finalPrice = hostname.endsWith('.ma') ? finalPrice + ' DH' : '$' + finalPrice
    const numeric = parseInt(finalPrice.replace(/[^0-9]/g,''))||0

    return res.status(200).json({ success: true, data: { title: data.title, price: finalPrice, numericPrice: numeric, availability: 'In stock', image: data.image, url, source: realSource, checkedAt: new Date().toISOString(), strategy: 'chrome-min-v131', hostname } })

  } catch (e) {
    if (browser) await browser.close()
    return res.status(200).json({ success: false, blocked: true, data: { title: `ERROR - ${hostname}`, price: 'BLOCKED', numericPrice: 0, availability: e.message.slice(0,300), url, source: realSource, checkedAt: new Date().toISOString() }})
  }
}
