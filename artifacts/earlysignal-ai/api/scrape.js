import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { url } = req.body || {}
  if (!url) return res.status(200).json({ success: false, blocked: true, data: { price: 'BLOCKED' } })

  let hostname = 'unknown'
  try { hostname = new URL(url).hostname.replace('www.', '') } catch {}
  const realSource = `${hostname} Live`

  let browser = null
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 })
    await new Promise(r => setTimeout(r, 2500))

    const data = await page.evaluate(() => {
      let title = document.querySelector('meta[property="og:title"]')?.content || document.title || ''
      let price = ''
      let image = document.querySelector('meta[property="og:image"]')?.content || ''
      
      // iris.ma PrestaShop
      price = document.querySelector('[itemprop="price"]')?.content || document.querySelector('[itemprop="price"]')?.innerText || ''
      if (!price) price = document.querySelector('.current-price-value')?.innerText || document.querySelector('.current-price span')?.innerText || ''
      // Etsy
      if (!price) price = document.querySelector('[data-buy-box-region="price"] p')?.innerText || document.querySelector('.wt-text-title-03')?.innerText || ''
      // Jumia
      if (!price) price = document.querySelector('.prc')?.innerText || ''
      // JSON-LD
      if (!price) {
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
        for (const s of scripts) {
          try {
            const j = JSON.parse(s.innerText)
            const prod = Array.isArray(j) ? j.find(x=>x['@type']==='Product') : (j['@type']==='Product'?j:null)
            if (prod?.offers?.price) { price = prod.offers.price.toString(); if(!title) title=prod.name||title; break }
          } catch {}
        }
      }
      return { title: title.trim().slice(0,130), price: price.trim(), image, htmlLen: document.documentElement.innerHTML.length }
    })

    await browser.close()

    if (!data.price) {
      return res.status(200).json({
        success: false, blocked: false,
        data: { title: data.title||hostname, price: 'PRICE_NOT_FOUND', numericPrice: 0, availability: `Loaded ${data.htmlLen} chars but no price - custom selector needed for ${hostname}`, url, source: realSource, checkedAt: new Date().toISOString(), hostname }
      })
    }

    let finalPrice = data.price
    if (!/DH|MAD|\$|€|£/.test(finalPrice)) finalPrice = hostname.endsWith('.ma') ? finalPrice + ' DH' : '$' + finalPrice
    const numeric = parseInt(finalPrice.replace(/[^0-9]/g,''))||0

    return res.status(200).json({
      success: true,
      data: { title: data.title, price: finalPrice, numericPrice: numeric, availability: 'In stock', image: data.image, url, source: realSource, checkedAt: new Date().toISOString(), strategy: 'real-browser-chrome', hostname }
    })

  } catch (e) {
    if (browser) await browser.close()
    return res.status(200).json({
      success: false, blocked: true,
      data: { title: `ERROR - ${hostname}`, price: 'BLOCKED', numericPrice: 0, availability: e.message.slice(0,200), url, source: realSource, checkedAt: new Date().toISOString() }
    })
  }
}
