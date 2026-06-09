import type { Track } from "./types";

export type TrackArtistRef = { name: string; slug: string };

export function trackArtistList(track: Track): TrackArtistRef[] {
  const credits = track.artists
    ?.map((a) => a.artist)
    .filter((a) => Boolean(a?.name && a?.slug))
    .map((a) => ({ name: a.name, slug: a.slug }));
  if (credits && credits.length > 0) return credits;
  return [{ name: track.artist.name, slug: track.artist.slug }];
}

export function trackArtistNames(track: Track): string {
  return trackArtistList(track)
    .map((a) => a.name)
    .join(", ");
}

export function fmtDuration(sec?: number | null): string {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function totalDurationSec(tracks: Track[]): number {
  return tracks.reduce((sum, t) => sum + (t.durationSec ?? 0), 0);
}

export function fmtTotalDuration(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} ч. ${m} мин.`;
  return `${m} мин.`;
}

export function fmtTotalDurationDetailed(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h} ч. ${m} мин.`;
  if (s > 0) return `${m} мин. ${s} сек.`;
  return `${m} мин.`;
}

export function fmtCount(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function fmtFeedDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 28) return fmtRelativeDate(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export type FeedTimeSection = "today" | "yesterday" | "dayBefore" | "thisWeek" | "earlier";

export const FEED_SECTION_ORDER: FeedTimeSection[] = [
  "today",
  "yesterday",
  "dayBefore",
  "thisWeek",
  "earlier",
];

export const FEED_SECTION_LABELS: Record<FeedTimeSection, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  dayBefore: "Позавчера",
  thisWeek: "На этой неделе",
  earlier: "Ранее",
};

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfLocalWeek(d: Date): Date {
  const x = startOfLocalDay(d);
  const day = x.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - mondayOffset);
  return x;
}

export function feedTimeSection(iso: string): FeedTimeSection {
  const date = startOfLocalDay(new Date(iso));
  const today = startOfLocalDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBefore = new Date(today);
  dayBefore.setDate(dayBefore.getDate() - 2);
  const weekStart = startOfLocalWeek(new Date());

  if (date.getTime() === today.getTime()) return "today";
  if (date.getTime() === yesterday.getTime()) return "yesterday";
  if (date.getTime() === dayBefore.getTime()) return "dayBefore";
  if (date.getTime() >= weekStart.getTime()) return "thisWeek";
  return "earlier";
}

export function groupByFeedSection<T extends { publishedAt: string }>(items: T[]) {
  const buckets = Object.fromEntries(
    FEED_SECTION_ORDER.map((key) => [key, [] as T[]])
  ) as Record<FeedTimeSection, T[]>;

  for (const item of items) {
    buckets[feedTimeSection(item.publishedAt)].push(item);
  }

  return FEED_SECTION_ORDER.map((key) => ({ key, items: buckets[key] })).filter(
    (s) => s.items.length > 0
  );
}

export function fmtRelativeDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "только что" : `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  if (days < 30) return `${Math.floor(days / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU");
}
