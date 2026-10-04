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

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    if (response.status === 403 || response.status === 503) {
      return res.status(200).json({
        success: false,
        data: {
          price: 'BLOCKED',
          hostname,
          source: `${hostname} Live`,
          error: 'Website blocked request (Anti-bot protection)',
        },
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        data: {
          price: 'HTTP ERROR',
          hostname,
          source: `${hostname} Live`,
          error: `HTTP Error ${response.status}`,
        },
      });
    }

    const html = await response.text();
    const price = extractPriceFromHTML(html, hostname);

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
        error: 'Could not detect price on page',
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal Scraper Error',
    });
  }
}

function extractPriceFromHTML(html, hostname) {
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
              const currency = offerObj.priceCurrency || (hostname.includes('.fr') ? '€' : 'DH');
              return `${offerObj.price} ${currency}`.trim();
            }
          }
        }
      } catch (e) {}
    }
  }

  const ogPriceMatch = html.match(/property=["'](og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i) ||
                       html.match(/content=["']([^"']+)["']\s+property=["'](og:price:amount|product:price:amount)["']/i);
  if (ogPriceMatch && ogPriceMatch[1]) {
    const currencyMatch = html.match(/property=["'](og:price:currency|product:price:currency)["']\s+content=["']([^"']+)["']/i);
    const currency = currencyMatch ? currencyMatch[2] : (hostname.includes('.fr') ? '€' : 'DH');
    return `${ogPriceMatch[1]} ${currency}`.trim();
  }

  if (hostname.includes('amazon')) {
    const amazonOffscreen = html.match(/<span class="a-offscreen">([^<]+)<\/span>/i);
    if (amazonOffscreen && amazonOffscreen[1]) return amazonOffscreen[1].trim();
    const wholeMatch = html.match(/<span class="a-price-whole">([^<]+)<\/span>/i);
    const fractionMatch = html.match(/<span class="a-price-fraction">([^<]+)<\/span>/i);
    if (wholeMatch && wholeMatch[1]) {
      const whole = wholeMatch[1].replace(/[^\d.,]/g, '');
      const fraction = fractionMatch ? fractionMatch[1] : '00';
      const currency = html.match(/<span class="a-price-symbol">([^<]+)<\/span>/i)?.[1] || '€';
      return `${whole},${fraction} ${currency}`.trim();
    }
  }

  if (hostname.includes('etsy')) {
    const etsyPriceMatch = html.match(/<p class="[^"]*wt-text-title-01[^"]*">([^<]+)<\/p>/i) ||
                           html.match(/class="[^"]*currency-value[^"]*">([^<]+)<\/span>/i);
    if (etsyPriceMatch && etsyPriceMatch[1]) return etsyPriceMatch[1].trim();
  }

  const regexPatterns = [
    /(\d+[\.,]\d{2})\s*(€|EUR|DH|MAD|\$)/i,
    /(€|EUR|DH|MAD|\$)\s*(\d+[\.,]\d{2})/i,
    /(\d+[\.,]\d{2})\s*&nbsp;\s*(€|EUR)/i
  ];
  for (const regex of regexPatterns) {
    const match = html.match(regex);
    if (match) return match[0].replace('&nbsp;', ' ').trim();
  }

  return null;
}
