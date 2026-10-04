export default async function handler(req, res) {
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
    const hostname = parsedUrl.hostname.replace('www.', '').toUpperCase();

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    // 1. Attempt Direct Fetch
    let html = null;
    let isProxied = false;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        html = await response.text();
      }
    } catch (e) {
      // Direct fetch failed
    }

    // 2. Fallback Proxy Fetch (Bypasses Cloudflare / Etsy / Amazon blocks on Vercel IPs)
    if (!html || html.includes('Just a moment...') || html.includes('403 Forbidden')) {
      const proxyEndpoints = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];

      for (const proxyUrl of proxyEndpoints) {
        try {
          const proxyRes = await fetch(proxyUrl, {
            headers: { 'User-Agent': userAgent },
          });
          if (proxyRes.ok) {
            const text = await proxyRes.text();
            if (text && text.length > 500 && !text.includes('Enable JavaScript')) {
              html = text;
              isProxied = true;
              break;
            }
          }
        } catch (err) {
          // Try next proxy
        }
      }
    }

    if (!html) {
      return res.status(200).json({
        success: false,
        data: {
          price: 'BLOCKED',
          hostname,
          source: `${hostname} LIVE`,
          error: 'Website anti-bot protection blocked all attempts',
        },
      });
    }

    // 3. Extract Price
    const price = extractPriceFromHTML(html, hostname);

    if (price) {
      return res.status(200).json({
        success: true,
        data: {
          price,
          hostname,
          source: `${hostname} LIVE`,
          checkedAt: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: false,
      data: {
        price: 'NOT FOUND',
        hostname,
        source: `${hostname} LIVE`,
        error: 'Could not parse price element',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Scraper Execution Error',
    });
  }
}

function extractPriceFromHTML(html, hostname) {
  // A. Etsy / Shopify / General JSON-LD
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
            const offer = Array.isArray(offers) ? offers[0] : offers;
            if (offer?.price) {
              const currency = offer.priceCurrency || '€';
              return `${offer.price} ${currency}`.trim();
            }
          }
        }
      } catch (e) {}
    }
  }

  // B. OpenGraph & Meta Tags
  const ogMatch = html.match(/property=["'](og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i) ||
                  html.match(/content=["']([^"']+)["']\s+property=["'](og:price:amount|product:price:amount)["']/i);
  if (ogMatch && ogMatch[2]) {
    return `${ogMatch[2]} €`.trim();
  }

  // C. Etsy Specific DOM Selectors
  if (hostname.includes('ETSY')) {
    const etsyRegexes = [
      /class="[^"]*wt-text-title-03[^"]*">([^<]+)<\/p>/i,
      /class="[^"]*currency-value[^"]*">([^<]+)<\/span>/i,
      /"price":\s*"([^"]+)"/i,
    ];
    for (const regex of etsyRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  }

  // D. Amazon Specific Selectors
  if (hostname.includes('AMAZON')) {
    const amazonOffscreen = html.match(/<span class="a-offscreen">([^<]+)<\/span>/i);
    if (amazonOffscreen && amazonOffscreen[1]) {
      return amazonOffscreen[1].trim();
    }
  }

  // E. Regex Fallback for Currency formats (€ / DH / $)
  const generalRegex = [/(\d+[\.,]\d{2})\s*(€|EUR|DH|MAD|\$)/i, /(€|EUR|DH|MAD|\$)\s*(\d+[\.,]\d{2})/i];
  for (const regex of generalRegex) {
    const match = html.match(regex);
    if (match) {
      return match[0].trim();
    }
  }

  return null;
}
