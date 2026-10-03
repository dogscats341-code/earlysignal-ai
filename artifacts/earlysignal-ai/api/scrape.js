export default async function handler(req, res) {
  // 1. Handling CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Layer 1: Direct Fetching
    let price = await fetchDirect(url, hostname);

    // Layer 2: Proxy Bypass Fetching (For Amazon, Etsy & Cloudflare protected sites)
    if (!price) {
      price = await fetchViaProxy(url, hostname);
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
        error: 'Could not extract price from page',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Scraper Error',
    });
  }
}

async function fetchDirect(url, hostname) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
      },
      redirect: 'follow',
    });

    if (!response.ok) return null;
    const html = await response.text();
    return parsePriceFromHTML(html, hostname);
  } catch {
    return null;
  }
}

async function fetchViaProxy(targetUrl, hostname) {
  try {
    // Uses Jina AI reader service to bypass anti-bot, Cloudflare, and Amazon CAPTCHA barriers
    const proxyUrl = `https://r.jina.ai/${targetUrl}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'X-No-Cache': 'true',
      },
    });

    if (!response.ok) return null;
    const text = await response.text();
    return parsePriceFromText(text, hostname);
  } catch {
    return null;
  }
}

function parsePriceFromHTML(html, hostname) {
  // 1. JSON-LD Structured Data
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
              const currency = offerObj.priceCurrency || (hostname.includes('.fr') ? '€' : '$');
              return `${offerObj.price} ${currency}`.trim();
            }
          }
        }
      } catch {}
    }
  }

  // 2. OpenGraph Meta Tags
  const ogPriceMatch = html.match(/property=["'](og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i);
  if (ogPriceMatch && ogPriceMatch[2]) {
    const currencyMatch = html.match(/property=["'](og:price:currency|product:price:currency)["']\s+content=["']([^"']+)["']/i);
    const currency = currencyMatch ? currencyMatch[2] : (hostname.includes('.fr') ? '€' : '$');
    return `${ogPriceMatch[2]} ${currency}`.trim();
  }

  return parsePriceFromText(html, hostname);
}

function parsePriceFromText(text, hostname) {
  // Amazon Price Regex Patterns
  const amazonMatch =
    text.match(/Price:\s*([$€£]\s*\d+[\.,]\d{2})/i) ||
    text.match(/([$€£]\s*\d+[\.,]\d{2})/i) ||
    text.match(/(\d+[\.,]\d{2}\s*[$€£])/i);

  if (amazonMatch && amazonMatch[1]) {
    return amazonMatch[1].trim();
  }

  // Universal Currency Regex
  const patterns = [
    /(\$\s*\d+[\.,]\d{2})/,
    /(\d+[\.,]\d{2}\s*€)/,
    /(\d+[\.,]\d{2}\s*DH)/i,
    /(EUR\s*\d+[\.,]\d{2})/i,
    /(USD\s*\d+[\.,]\d{2})/i,
    /(\d+[\.,]\d{2}\s*MAD)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
}
