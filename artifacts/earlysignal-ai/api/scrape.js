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
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url, monitorType = 'Product Price' } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace('www.', '');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
    });

    if (response.status === 403 || response.status === 503) {
      return res.status(200).json({
        success: false,
        data: { price: 'BLOCKED', hostname, source: `${hostname} Live`, error: 'Target website blocked request' },
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        data: { price: 'HTTP ERROR', hostname, source: `${hostname} Live`, error: `HTTP ${response.status}` },
      });
    }

    const html = await response.text();
    const extractedData = parsePageByMonitorType(html, hostname, url, monitorType);

    return res.status(200).json({
      success: true,
      data: {
        ...extractedData,
        hostname,
        source: `${hostname} Live`,
        checkedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Internal Scraper Error' });
  }
}

function parsePageByMonitorType(html, hostname, url, monitorType) {
  // --- 1. PRODUCT CATALOG MODE (رصد إضافة منتجات جديدة للقسم/المتجر) ---
  if (monitorType.includes('Catalog')) {
    const items = extractCatalogItems(html, hostname, url);
    return {
      price: `${items.length} Products Found`,
      catalogItems: items,
      rawSummary: `Detected ${items.length} products in store catalog.`,
    };
  }

  // --- 2. PRODUCT AVAILABILITY MODE (رصد التوفر المخزني) ---
  if (monitorType.includes('Availability')) {
    const isOut = /out of stock|sold out|rupture de stock|non disponible|currently unavailable/i.test(html);
    const status = isOut ? 'Out of Stock' : 'In Stock';
    return {
      price: status,
      availability: status,
      rawSummary: `Product availability status: ${status}`,
    };
  }

  // --- 3. PRODUCT PRICE MODE (رصد السعر الحالي والقديم والتخفيض) ---
  let currentPrice = null;
  let originalPrice = null;
  let discount = null;

  // A. AMAZON EXTRACTOR (دعم التخفيضات والسعر الحالي + القديم)
  if (hostname.includes('amazon')) {
    // Current price extraction
    const apexPrice = html.match(/class="[^"]*apexPriceToPay[^"]*"[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i) ||
                       html.match(/id="corePrice_feature_div"[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i) ||
                       html.match(/class="a-price aok-align-center[^"]*"[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i);
    if (apexPrice && apexPrice[1]) {
      currentPrice = apexPrice[1].trim();
    }

    // Original / List Price extraction
    const listPriceMatch = html.match(/class="a-text-price"[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i) ||
                           html.match(/data-a-strike="true"[\s\S]*?<span class="a-offscreen">([^<]+)<\/span>/i) ||
                           html.match(/List Price:\s*<span[^>]*>([^<]+)<\/span>/i);
    if (listPriceMatch && listPriceMatch[1]) {
      originalPrice = listPriceMatch[1].trim();
    }

    // Discount percentage
    const discountMatch = html.match(/(-?\d{1,2}%)/);
    if (discountMatch) {
      discount = discountMatch[1];
    }
  }

  // B. IRIS.MA EXTRACTOR (PrestaShop)
  if (hostname.includes('iris.ma')) {
    const irisCurrent = html.match(/id="our_price_display">([^<]+)</i) ||
                        html.match(/itemprop="price"\s+content="([^"]+)"/i) ||
                        html.match(/class="current-price"[\s\S]*?<span[^>]*>([^<]+)<\/span>/i);
    if (irisCurrent && irisCurrent[1]) {
      currentPrice = irisCurrent[1].includes('DH') ? irisCurrent[1].trim() : `${irisCurrent[1].trim()} DH`;
    }

    const irisOld = html.match(/class="regular-price">([^<]+)</i) ||
                    html.match(/id="old_price_display">([^<]+)</i);
    if (irisOld && irisOld[1]) {
      originalPrice = irisOld[1].trim();
    }
  }

  // C. ETSY EXTRACTOR
  if (hostname.includes('etsy')) {
    const etsyCurrent = html.match(/class="[^"]*wt-text-title-01[^"]*">([^<]+)<\/p>/i) ||
                        html.match(/class="[^"]*currency-value[^"]*">([^<]+)<\/span>/i);
    if (etsyCurrent && etsyCurrent[1]) {
      currentPrice = etsyCurrent[1].trim();
    }
    const etsyOld = html.match(/class="[^"]*wt-text-strikethrough[^"]*">([^<]+)<\/span>/i);
    if (etsyOld && etsyOld[1]) {
      originalPrice = etsyOld[1].trim();
    }
  }

  // D. JSON-LD FALLBACK (عام لجميع المتاجر الدولية)
  if (!currentPrice) {
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
                currentPrice = `${offerObj.price} ${currency}`.trim();
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  // E. GENERAL REGEX FALLBACK
  if (!currentPrice) {
    const fallback = html.match(/(\d+[\.,]\d{2})\s*(€|EUR|DH|MAD|\$)/i) || html.match(/(€|EUR|DH|MAD|\$)\s*(\d+[\.,]\d{2})/i);
    if (fallback) {
      currentPrice = fallback[0].trim();
    }
  }

  // حساب نسبة الخصم تلقائياً إذا لم تكن مستخرجة
  if (currentPrice && originalPrice && !discount) {
    const currNum = parseFloat(currentPrice.replace(/[^\d.]/g, ''));
    const origNum = parseFloat(originalPrice.replace(/[^\d.]/g, ''));
    if (origNum > currNum) {
      const calcDiscount = Math.round(((origNum - currNum) / origNum) * 100);
      discount = `-${calcDiscount}%`;
    }
  }

  return {
    price: currentPrice || 'N/A',
    currentPrice: currentPrice || 'N/A',
    originalPrice: originalPrice || null,
    discount: discount || null,
    rawSummary: originalPrice ? `Price dropped from ${originalPrice} to ${currentPrice} (${discount})` : `Price: ${currentPrice}`,
  };
}

function extractCatalogItems(html, hostname, baseUrl) {
  const items = [];
  const linkMatches = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi) || [];

  for (const match of linkMatches) {
    const hrefMatch = match.match(/href=["']([^"']+)["']/i);
    const titleMatch = match.replace(/<[^>]+>/g, ' ').trim();

    if (hrefMatch && hrefMatch[1] && titleMatch.length > 5) {
      const href = hrefMatch[1];
      if (href.includes('/dp/') || href.includes('/product/') || href.includes('.html') || href.includes('/listing/')) {
        let fullUrl = href;
        try {
          fullUrl = new URL(href, baseUrl).href;
        } catch (e) {}

        if (!items.some((i) => i.url === fullUrl)) {
          items.push({
            title: titleMatch.substring(0, 60),
            url: fullUrl,
            price: 'Detected in Catalog',
          });
        }
      }
    }
  }
  return items.slice(0, 15);
}
