import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_SNIPPET_LENGTH = 500;

export type ScrapeWebsiteResult = {
  success: boolean;
  value: string | null;
  rawHtmlSnippet: string;
  error?: string;
};

function isBlockedIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && c === 0) || (b === 0 && c === 2))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

function isBlockedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version !== 6) return true;

  const normalized = address.toLowerCase().split("%", 1)[0];
  if (normalized.startsWith("::ffff:")) {
    const mapped = normalized.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isBlockedIpv4(mapped);
    return true;
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("2001:10:")
  );
}

async function assertPublicHttpUrl(url: URL): Promise<void> {
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Only public HTTP(S) website URLs are supported.");
  }
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Only standard HTTP and HTTPS ports are supported.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test") ||
    hostname.endsWith(".example") ||
    hostname.endsWith(".invalid") ||
    hostname.endsWith(".onion")
  ) {
    throw new Error("The URL must point to a public website.");
  }

  const addresses =
    isIP(hostname) !== 0
      ? [{ address: hostname }]
      : await lookup(hostname, { all: true, verbatim: true });

  if (addresses.length === 0 || addresses.some(({ address }) => isBlockedAddress(address))) {
    throw new Error("The URL must resolve to a public IP address.");
  }
}

async function readHtml(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
    await response.body?.cancel();
    throw new Error("The website response was too large to inspect.");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let html = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new Error("The website response was too large to inspect.");
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
    return html;
  } finally {
    reader.releaseLock();
  }
}

function normalizePrice(value: string | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 200) : null;
}

function extractProductPrice(html: string): string | null {
  const $ = cheerio.load(html);
  const candidates = [
    normalizePrice($("span.price").first().text()),
    normalizePrice($(".product-price").first().text()),
    normalizePrice($('meta[property="product:price:amount"]').first().attr("content")),
  ];
  return candidates.find((candidate) => candidate !== null) ?? null;
}

function isVerificationPage(html: string): boolean {
  return /bm-verify|cf-chl-|cf-browser-verification|challenge-platform/i.test(html);
}

function isProductPriceType(type: string): boolean {
  return type.toUpperCase().replace(/[\s-]+/g, "_") === "PRODUCT_PRICE";
}

export async function scrapeWebsite(url: string, type: string): Promise<ScrapeWebsiteResult> {
  try {
    let currentUrl = new URL(url);
    let response: Response | undefined;

    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
      await assertPublicHttpUrl(currentUrl);
      response = await fetch(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
          "user-agent": "EarlySignalAI/1.0 (+manual website checks)",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) throw new Error("The website returned an invalid redirect.");
        if (redirects === MAX_REDIRECTS) throw new Error("The website redirected too many times.");
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      break;
    }

    if (!response) throw new Error("The website did not return a response.");
    const html = await readHtml(response);
    const rawHtmlSnippet = html.slice(0, MAX_SNIPPET_LENGTH);

    if (!response.ok) {
      return {
        success: false,
        value: null,
        rawHtmlSnippet,
        error: `The website returned HTTP ${response.status}.`,
      };
    }

    if (isVerificationPage(html)) {
      return {
        success: false,
        value: null,
        rawHtmlSnippet,
        error: "The website returned an anti-bot verification page instead of product content.",
      };
    }

    return {
      success: true,
      value: isProductPriceType(type) ? extractProductPrice(html) : null,
      rawHtmlSnippet,
    };
  } catch (error) {
    return {
      success: false,
      value: null,
      rawHtmlSnippet: "",
      error: error instanceof Error ? error.message : "The website could not be checked.",
    };
  }
}