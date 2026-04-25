const MAX_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface Record { count: number; windowStart: number }
const store = new Map<string, Record>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const rec = store.get(ip);

  if (!rec || now - rec.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (rec.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - rec.windowStart);
    return { allowed: false, retryAfterMs };
  }

  rec.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
