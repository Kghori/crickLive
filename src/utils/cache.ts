interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cricket_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(`cricket_cache_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function getCacheStale<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cricket_cache_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl: ttlMs };
  try {
    localStorage.setItem(`cricket_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Storage full, clear old entries
    clearOldCache();
  }
}

function clearOldCache() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cricket_cache_'));
  keys.forEach(k => localStorage.removeItem(k));
}
