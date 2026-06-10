import { readPageCache, writePageCache } from "./pageCache";

type Entry = { at: number; data: unknown };

const store = new Map<string, Entry>();
const PERSIST_PREFIXES = ["artist:", "artist-related:", "release:"];

function shouldPersist(key: string) {
  return PERSIST_PREFIXES.some((p) => key.startsWith(p));
}

export function getCached<T>(key: string, ttlMs: number): T | null {
  const row = store.get(key);
  if (row && Date.now() - row.at <= ttlMs) return row.data as T;
  if (shouldPersist(key)) return readPageCache<T>(key);
  return null;
}

export function setCached<T>(key: string, data: T) {
  store.set(key, { at: Date.now(), data });
  if (shouldPersist(key)) writePageCache(key, data);
}

export function invalidateCached(key: string) {
  store.delete(key);
}

export async function fetchCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  opts?: { revalidate?: boolean }
): Promise<T> {
  const hit = getCached<T>(key, ttlMs);
  if (hit != null) {
    if (opts?.revalidate) {
      void fetcher()
        .then((data) => setCached(key, data))
        .catch(() => {});
    }
    return hit;
  }
  const data = await fetcher();
  setCached(key, data);
  return data;
}