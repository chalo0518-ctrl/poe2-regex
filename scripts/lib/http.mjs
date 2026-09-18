/**
 * Resilient HTTP helpers for the data-update pipeline.
 * Public pages only; no cookies or login.
 */

export const DEFAULT_UA = "Mozilla/5.0 (compatible; poe2-regex/0.1; +https://github.com/chalo0518-ctrl/poe2-regex)";

export class FetchError extends Error {
  /**
   * @param {string} message
   * @param {{ url?: string, status?: number, code?: string, cause?: unknown }} [info]
   */
  constructor(message, info = {}) {
    super(message, info.cause ? { cause: info.cause } : undefined);
    this.name = "FetchError";
    this.url = info.url;
    this.status = info.status;
    this.code = info.code || "http";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(err) {
  if (err?.name === "AbortError") return true;
  if (err?.code === "timeout" || err?.code === "network") return true;
  if (typeof err?.status === "number") {
    return err.status === 429 || err.status >= 500;
  }
  return false;
}

/**
 * GET text with timeout + retries. Does not retry 404/4xx (except 429).
 * @param {string} url
 * @param {{
 *   timeoutMs?: number,
 *   retries?: number,
 *   retryDelayMs?: number,
 *   headers?: Record<string, string>,
 *   accept?: string,
 *   ua?: string,
 *   fetchImpl?: typeof fetch,
 * }} [options]
 */
export async function fetchText(url, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? process.env.POE2DB_TIMEOUT_MS) || 20_000;
  const retries = Number(options.retries ?? process.env.POE2DB_RETRIES) || 3;
  const retryDelayMs = Number(options.retryDelayMs ?? process.env.POE2DB_RETRY_DELAY_MS) || 800;
  const ua = options.ua || process.env.POE2DB_UA || DEFAULT_UA;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const headers = {
    "user-agent": ua,
    accept: options.accept || "text/html,application/json;q=0.9,*/*;q=0.8",
    ...options.headers,
  };

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { headers, signal: controller.signal });
      if (!res.ok) {
        const err = new FetchError(`${url} -> ${res.status}`, {
          url,
          status: res.status,
          code: "http",
        });
        if (attempt < retries && shouldRetry(err)) {
          lastErr = err;
          await sleep(retryDelayMs * attempt);
          continue;
        }
        throw err;
      }
      return await res.text();
    } catch (err) {
      if (err instanceof FetchError) {
        lastErr = err;
        if (attempt < retries && shouldRetry(err)) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
        throw err;
      }
      const code = err?.name === "AbortError" ? "timeout" : "network";
      lastErr = new FetchError(
        code === "timeout" ? `${url} timed out after ${timeoutMs}ms` : `${url} network error: ${err?.message || err}`,
        { url, code, cause: err },
      );
      if (attempt < retries && shouldRetry(lastErr)) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      throw lastErr;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

/**
 * Bounded-concurrency map that preserves order.
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const n = Math.max(1, Math.min(limit, items.length || 1));
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
  return out;
}
