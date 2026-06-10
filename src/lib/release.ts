import type { Track } from "./types";
import { transliterate } from "./transliterate";

export type ReleaseType = "SINGLE" | "EP" | "ALBUM" | "COMPILATION";

export type DbRelease = {
  id: string;
  title: string;
  slug: string;
  type: ReleaseType;
  year?: number | null;
  albumArtist?: string | null;
  coverUrl?: string | null;
  typeLabel?: string;
  href?: string;
  artists?: Array<{ id: string; name: string; slug: string; avatarUrl?: string | null; imageUrl?: string | null }>;
  tracks?: Track[];
};

export type Release = {
  key: string;
  title: string;
  year?: number | null;
  coverUrl?: string | null;
  tracks: Track[];
  isSingle: boolean;
  type?: ReleaseType;
  slug?: string;
};

export function normalizeSlug(slug: string) {
  return slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function decodeSlugParam(param: string): string {
  let s = param;
  for (let i = 0; i < 3; i++) {
    if (!s.includes("%")) break;
    try {
      const decoded = decodeURIComponent(s);
      if (decoded === s) break;
      s = decoded;
    } catch {
      break;
    }
  }
  return s;
}

export function releaseApiPath(slugOrParam: string): string {
  return `/api/releases/${encodeURIComponent(decodeSlugParam(slugOrParam))}`;
}

export function slugifyRelease(s: string): string {
  return normalizeSlug(
    transliterate(s)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

export function canonicalReleaseUrl(slug: string) {
  return `/releases/${encodeURIComponent(decodeSlugParam(slug))}`;
}

export function releaseTypeLabel(type: ReleaseType) {
  const map: Record<ReleaseType, string> = {
    SINGLE: "Сингл",
    EP: "EP",
    ALBUM: "Альбом",
    COMPILATION: "Сборник",
  };
  return map[type];
}

function releaseGroupKey(t: Track): string {
  if (t.release?.slug) return `release:${t.release.slug}`;
  if (t.releaseId) return `release:${t.releaseId}`;
  const album = t.album?.trim();
  if (album) return `album:${album}`;
  return `single:${t.id}`;
}

function releaseGroupMeta(t: Track): Pick<Release, "title" | "slug" | "type" | "isSingle"> {
  const album = t.album?.trim();
  const type = (t.release?.type as ReleaseType | undefined) ?? (!album ? "SINGLE" : undefined);
  const isSingle = type === "SINGLE" || type === "EP" || (!type && !album);
  return {
    title: t.release?.title ?? album ?? t.title,
    slug: t.release?.slug ?? (album ? slugifyRelease(album) : `single-${t.id}`),
    type,
    isSingle,
  };
}

export function isShelfSingleRelease(r: Pick<Release, "type" | "isSingle">): boolean {
  return r.type === "SINGLE" || r.type === "EP" || (!r.type && r.isSingle);
}

export function shelfReleaseTypeLabel(r: Pick<Release, "type" | "isSingle">): string {
  if (r.type) return releaseTypeLabel(r.type);
  return r.isSingle ? "Сингл" : "Альбом";
}

function upsertRelease(
  map: Map<string, Release>,
  key: string,
  t: Track,
  meta: Pick<Release, "title" | "slug" | "type" | "isSingle">
) {
  const existing = map.get(key);
  if (existing) {
    if (!existing.tracks.some((x) => x.id === t.id)) existing.tracks.push(t);
    if (!existing.coverUrl && t.coverUrl) existing.coverUrl = t.coverUrl;
    if (!existing.year && t.year) existing.year = t.year;
  } else {
    map.set(key, {
      key,
      title: meta.title,
      year: t.year,
      coverUrl: t.coverUrl,
      tracks: [t],
      isSingle: meta.isSingle,
      type: meta.type,
      slug: meta.slug,
    });
  }
}

export function releasePlayCount(r: Release): number {
  return r.tracks.reduce((sum, t) => sum + (t.playCount ?? 0), 0);
}

export function groupReleases(tracks: Track[]): Release[] {
  const map = new Map<string, Release>();
  for (const t of tracks) {
    upsertRelease(map, releaseGroupKey(t), t, releaseGroupMeta(t));
  }
  return [...map.values()].sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    return yb - ya;
  });
}

export function isShelfAlbumRelease(r: Pick<Release, "type" | "isSingle">): boolean {
  return r.type === "ALBUM" || r.type === "COMPILATION" || (!r.isSingle && r.type !== "SINGLE" && r.type !== "EP");
}

export function releaseShelfCover(r: Release): string | null {
  if (r.type === "SINGLE" || r.type === "EP" || r.isSingle) {
    const t = r.tracks.find((x) => x.coverUrl);
    return t?.coverUrl ?? r.coverUrl ?? null;
  }
  const own = r.tracks.filter((t) => !t.singleReleaseId);
  const pool = own.length ? own : r.tracks;
  const sorted = [...pool].sort((a, b) => (a.trackNumber ?? 999) - (b.trackNumber ?? 999));
  return sorted.find((t) => t.coverUrl)?.coverUrl ?? r.coverUrl ?? null;
}

export function releaseLatestAt(r: Release): number {
  return Math.max(
    0,
    ...r.tracks.map((t) => (t.createdAt ? new Date(t.createdAt).getTime() : 0))
  );
}

export function filterArtistReleases(
  releases: Release[],
  tab: "popular" | "albums" | "singles"
): Release[] {
  if (tab === "albums") {
    return releases.filter(isShelfAlbumRelease);
  }
  if (tab === "singles") {
    return releases.filter((r) => !isShelfAlbumRelease(r));
  }
  return releases;
}

export function buildArtistReleases(tracks: Track[]): Release[] {
  const map = new Map<string, Release>();
  for (const t of tracks) {
    upsertRelease(map, releaseGroupKey(t), t, releaseGroupMeta(t));
  }
  for (const t of tracks) {
    const sr = t.singleRelease;
    if (!sr?.slug) continue;
    const key = `release:${sr.slug}`;
    if (map.has(key)) continue;
    upsertRelease(map, key, t, {
      title: sr.title,
      slug: sr.slug,
      type: "SINGLE",
      isSingle: true,
    });
  }
  return [...map.values()].sort((a, b) => {
    const byPlays = releasePlayCount(b) - releasePlayCount(a);
    if (byPlays !== 0) return byPlays;
    return (b.year ?? 0) - (a.year ?? 0);
  });
}

export function artistSlugOf(track: Track): string {
  return track.artists?.[0]?.artist.slug ?? track.artist.slug;
}

export function findTrackRelease(track: Track, catalog: Track[]): Release | undefined {
  const slug = artistSlugOf(track);
  const pool = catalog.filter((t) => artistSlugOf(t) === slug);
  const releases = groupReleases(pool.length > 0 ? pool : catalog);
  return releases.find((r) => r.tracks.some((t) => t.id === track.id));
}

export function trackReleaseUrl(
  track: Track,
  catalog?: Track[],
  contextReleaseSlug?: string
): string {
  if (contextReleaseSlug) return canonicalReleaseUrl(contextReleaseSlug);
  if (track.release?.slug) return canonicalReleaseUrl(track.release.slug);
  if (track.singleRelease?.slug) return canonicalReleaseUrl(track.singleRelease.slug);
  if (catalog?.length) {
    const release = findTrackRelease(track, catalog);
    if (release?.slug) return canonicalReleaseUrl(release.slug);
  }
  const album = track.album?.trim();
  if (album) return canonicalReleaseUrl(slugifyRelease(album));
  return canonicalReleaseUrl(`single-${track.id}`);
}

export function releaseUrl(artistSlug: string, release: Release): string {
  const segment = release.slug ?? (release.isSingle
    ? `single-${release.tracks[0]!.id}`
    : slugifyRelease(release.title));
  return canonicalReleaseUrl(segment);
}

export function findRelease(releases: Release[], keyParam: string): Release | undefined {
  const key = decodeURIComponent(keyParam);
  return releases.find((r) => {
    const slugMatch = slugifyRelease(r.title) === key || r.key === key || r.slug === key;
    if (r.isSingle) return `single-${r.tracks[0]!.id}` === key || slugMatch;
    return slugMatch;
  });
}

export function formatQuality(track: Pick<Track, "format" | "bitrate" | "bitsPerSample" | "sampleRate">) {
  const fmt = track.format?.toUpperCase() ?? "AUDIO";
  if (fmt === "FLAC" || fmt === "WAV") {
    const bits = track.bitsPerSample ? `${track.bitsPerSample}-bit` : null;
    const rate = track.sampleRate ? `${Math.round(track.sampleRate / 1000)}kHz` : null;
    const extra = [bits, rate].filter(Boolean).join("/");
    return extra ? `${fmt} · ${extra}` : fmt;
  }
  if (track.bitrate) return `${fmt} · ${track.bitrate} kbps`;
  return fmt;
}
