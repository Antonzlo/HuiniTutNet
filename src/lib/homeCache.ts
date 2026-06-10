import type { HomeFeed } from "@/lib/home";

const KEY = "hiuni:home-feed";

type Stored = {
  userId: string;
  feed: HomeFeed;
};

export function readHomeCache(userId: string | undefined): HomeFeed | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    return stored.userId === userId ? stored.feed : null;
  } catch {
    return null;
  }
}

export function writeHomeCache(userId: string, feed: HomeFeed) {
  if (typeof window === "undefined") return;
  const stored: Stored = { userId, feed };
  localStorage.setItem(KEY, JSON.stringify(stored));
}

export function clearHomeCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
