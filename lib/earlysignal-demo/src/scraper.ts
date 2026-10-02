/// <reference lib="dom" />
export type ScrapeResult = {
  status: "ok" | "blocked_cached" | "error";
  html?: string;
  protected?: boolean;
};

const CACHE = new Map<string, { html: string; time: number }>();
const SIX_HOURS = 6 * 60 * 60 * 1000;

export async function scrapeWithCache(url: string): Promise<ScrapeResult> {
  const cached = CACHE.get(url);
  if (cached && Date.now() - cached.time < SIX_HOURS) {
    return { status: "ok", html: cached.html };
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.ok) {
      if (cached) return { status: "blocked_cached", html: cached.html, protected: true };
      return { status: "error" };
    }

    const html = await res.text();
    CACHE.set(url, { html, time: Date.now() });
    return { status: "ok", html };
  } catch {
    if (cached) return { status: "blocked_cached", html: cached.html, protected: true };
    return { status: "error" };
  }
}
