// EarlySignal-AI - Phase 3: LIVE Scraper
import * as cheerio from 'cheerio';

export type LiveCheckResult = {
  url: string;
  status: 'up' | 'down';
  price?: number;
  contentHash?: string;
  timestamp: Date;
  error?: string;
};

export async function liveScrape(url: string, monitorType: string): Promise<LiveCheckResult> {
  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'EarlySignal-Bot/1.0' },
      next: { revalidate: 0 } as any
    });
    
    if (!res.ok) {
      return { url, status: 'down', timestamp: new Date(), error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Simple price extraction logic
    let price: number | undefined;
    if (monitorType.includes('Price')) {
      const priceText = $('[class*="price"], [id*="price"]').first().text();
      price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || undefined;
    }

    return {
      url,
      status: 'up',
      price,
      contentHash: html.length.toString(), // simplified
      timestamp: new Date()
    };
  } catch (e: any) {
    return { url, status: 'down', timestamp: new Date(), error: e.message };
  }
}
