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
    // 1. Cleaning & Sanitizing target URL (Crucial for Etsy & Amazon bypass)
    const targetUrl = cleanTargetUrl(url);
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname.replace('www.', '');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    };

    const response = await fetch(targetUrl, { method: 'GET', headers, redirect: 'follow' });

    if (response.status === 403 || response.status === 503) {
      // Etsy API / oEmbed Fallback if Cloudflare blocks HTML page
      if (hostname.includes('etsy')) {
        const etsyData = await fetchEtsyOembed(targetUrl);
        if (etsyData) {
          return res.status(200).json({ success: true, data: etsyData });
        }
      }

      return res.status(200).json({
        success: false,
        data: { price: 'BLOCKED', hostname, source: `${hostname} Live`, error: 'Website anti-bot protection active' },
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        data: { price: 'HTTP ERROR', hostname, source: `${hostname} Live` },
      });
    }

    const html = await response.text();
    const result = extractPriceDetails(html, hostname);

    if (result && result.price) {
      return res.status(200).json({
        success: true,
        data: {
          price: result.price,
          originalPrice: result.originalPrice || null,
          discount: result.discount || null,
          hostname,
          source: `${hostname} Live`,
          checkedAt: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: false,
      data: { price: 'NOT FOUND', hostname, source: `${hostname} Live` },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Scraper error' });
  }
}

// Strip useless tracking parameters that trigger anti-bot blocks
function cleanTargetUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.includes('etsy')) {
      const listingMatch = u.pathname.match(/\/listing\/(\d+)/);
      if (listingMatch) {
        return `https://www.etsy.com/listing/${listingMatch[1]}`;
      }
    }
    if (u.hostname.includes('amazon')) {
      const dpMatch = u.pathname.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (dpMatch) {
        return `https://www.amazon.com/dp/${dpMatch[2]}`;
      }
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return rawUrl;
  }
}

// Fallback for Etsy using public oEmbed / JSON endpoint
async function fetchEtsyOembed(cleanUrl) {
  try {
    const oembedUrl = `https://www.etsy.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title) {
      // Extract price from title or meta if available
      const priceMatch = data.title.match(/(\$\d+[\.,]?\d*|\d+[\.,]?\d*\s*€|\d+[\.,]?\d*\s*DH)/i);
      if (priceMatch) {
        return {
          price: priceMatch[0],
          hostname: 'etsy.com',
          source: 'etsy.com Live',
          checkedAt: new Date().toISOString(),
        };
      }
    }
  } catch {}
  return null;
}

function extractPriceDetails(html, hostname) {
  // 1. JSON-LD Extraction
  const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
        const data = JSON.parse(jsonContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const offer = item?.offers || (item['@type'] === 'Product' ? item.offers : null);
          if (offer) {
            const single = Array.isArray(offer) ? offer[0] : offer;
            if (single?.price) {
              const currency = single.priceCurrency || (hostname.includes('.fr') ? '€' : '$');
              return { price: `${single.price} ${currency}`.trim() };
            }
          }
        }
      } catch {}
    }
  }

  // 2. OpenGraph Meta Tags
  const ogPrice = html.match(/property=["'](og:price:amount|product:price:amount)["']\s+content=["']([^"']+)["']/i);
  if (ogPrice && ogPrice[2]) {
    const currency = hostname.includes('.fr') ? '€' : '$';
    return { price: `${ogPrice[2]} ${currency}` };
  }

  // 3. Etsy Fallback Regex
  if (hostname.includes('etsy')) {
    const etsyPrice = html.match(/<span class="[^"]*currency-value[^"]*">([^<]+)<\/span>/i) ||
                       html.match(/class="[^"]*wt-text-title-03[^"]*">([^<]+)<\/p>/i);
    if (etsyPrice && etsyPrice[1]) {
      return { price: etsyPrice[1].trim() };
    }
  }

  // 4. Regex General Fallback
  const match = html.match(/(\$\d+[\.,]\d{2}|\d+[\.,]\d{2}\s*€|\d+[\.,]\d{2}\s*DH)/i);
  if (match) {
    return { price: match[0].trim() };
  }

  return null;
}
