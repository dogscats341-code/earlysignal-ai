export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    // Strategy 1: Fetch using Googlebot Headers (Bypasses Cloudflare & Bot Blockers)
    let html = await fetchWithBotHeader(url, 'googlebot');
    let price = extractPriceFromHTML(html, hostname);

    // Strategy 2: If failed, Fallback to Modern Desktop Chrome Browser Header
    if (!price) {
      html = await fetchWithBotHeader(url, 'chrome');
      price = extractPriceFromHTML(html, hostname);
    }

    if (price) {
      return res.status(200).json({
        success: true,
        data: {
          price,
          hostname,
          source: `${hostname} Live`,
          checkedAt: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: false,
      data: {
        price: 'NOT FOUND',
        hostname,
        source: `${hostname} Live`,
        error: 'Could not extract price automatically.',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Scraper Error',
    });
  }
}

async function fetchWithBotHeader(targetUrl, mode) {
  const headers = mode === 'googlebot' 
    ? {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      }
    : {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
      };

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers,
    redirect: 'follow',
  });

  if (!response.ok) return '';
  return await response.text();
}

function extractPriceFromHTML(html, hostname) {
  if (!html) return null;

  // 1. JSON-LD Structured Data Parsing (Highest Accuracy for Etsy, Jumia, Shopify, PrestaShop)
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        const data = JSON.parse(jsonContent);

        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const offers = item?.offers || (item['@type'] === 'Product' ? item.offers : null);
          if (offers) {
            const offerObj = Array.isArray(offers) ? offers[0] : offers;
            if (offerObj?.price) {
              const currency = offerObj.priceCurrency || (hostname.includes('.ma') ? 'DH' : '€');
              return `${offerObj.price} ${currency}`.trim();
            }
          }
        }
      } catch (e) {}
    }
  }

  // 2. OpenGraph Meta Tags Extraction
  const ogPriceMatch = html.match(/property=["'](og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/content=["']([^"']+)["']\s+property=["'](og:price:amount|product:price:amount)["']/i);
  if (ogPriceMatch && ogPriceMatch[2]) {
    const currencyMatch = html.match(/property=["'](og:price:currency|product:price:currency)["']\s+content=["']([^"']+)["']/i);
    const currency = currencyMatch ? currencyMatch[2] : (hostname.includes('.ma') ? 'DH' : '€');
    return `${ogPriceMatch[2]} ${currency}`.trim();
  }

  // 3. Amazon Dedicated Selector
  if (hostname.includes('amazon')) {
    const offscreen = html.match(/<span class="a-offscreen">([^<]+)<\/span>/i);
    if (offscreen && offscreen[1]) return offscreen[1].trim();

    const whole = html.match(/<span class="a-price-whole">([^<]+)<\/span>/i);
    const fraction = html.match(/<span class="a-price-fraction">([^<]+)<\/span>/i);
    if (whole && whole[1]) {
      const cleanWhole = whole[1].replace(/[^\d.,]/g, '');
      const cleanFrac = fraction ? fraction[1] : '00';
      return `${cleanWhole},${cleanFrac} €`;
    }
  }

  // 4. Iris.ma & PrestaShop Direct DOM Selector
  if (hostname.includes('iris.ma') || html.includes('our_price_display')) {
    const irisPrice = html.match(/id="our_price_display">([^<]+)<\/span>/i) ||
                      html.match(/class="[^"]*current-price[^"]*">[\s\S]*?<span>([^<]+)<\/span>/i) ||
                      html.match(/class="price\s*product-price">([^<]+)<\/span>/i);
    if (irisPrice && irisPrice[1]) return irisPrice[1].trim();
  }

  // 5. Universal Fallback Currency Regex
  const regexPatterns = [
    /(\d+[\s\.,]?\d+)\s*(DH|MAD|DHS)/i,
    /(\d+[\.,]\d{2})\s*(€|EUR|\$)/i,
    /(€|EUR|\$)\s*(\d+[\.,]\d{2})/i,
  ];

  for (const regex of regexPatterns) {
    const match = html.match(regex);
    if (match) return match[0].trim();
  }

  return null;
}
