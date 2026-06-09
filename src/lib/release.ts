import type { Track } from "./types";

export type Release = {
  key: string;
  title: string;
  year?: number | null;
  coverUrl?: string | null;
  tracks: Track[];
  isSingle: boolean;
};

export function slugifyRelease(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0400-\u04FF-]/g, "");
}

export function groupReleases(tracks: Track[]): Release[] {
  const map = new Map<string, Release>();
  for (const t of tracks) {
    const album = t.album?.trim();
    const key = album || `single:${t.id}`;
    const existing = map.get(key);
    if (existing) {
      existing.tracks.push(t);
      if (!existing.coverUrl && t.coverUrl) existing.coverUrl = t.coverUrl;
    } else {
      map.set(key, {
        key,
        title: album || t.title,
        year: t.year,
        coverUrl: t.coverUrl,
        tracks: [t],
        isSingle: !album,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    const ya = a.year ?? 0;
    const yb = b.year ?? 0;
    return yb - ya;
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

export function trackReleaseUrl(track: Track, catalog?: Track[]): string {
  const slug = artistSlugOf(track);
  if (!slug) return "/";
  const album = track.album?.trim();
  if (catalog?.length) {
    const release = findTrackRelease(track, catalog);
    if (release) return releaseUrl(slug, release);
  }
  if (album) {
    return `/artists/${slug}/release/${encodeURIComponent(slugifyRelease(album))}`;
  }
  return `/artists/${slug}/release/${encodeURIComponent(`single-${track.id}`)}`;
}

export function releaseUrl(artistSlug: string, release: Release): string {
  const segment = release.isSingle
    ? `single-${release.tracks[0]!.id}`
    : slugifyRelease(release.title);
  return `/artists/${artistSlug}/release/${encodeURIComponent(segment)}`;
}

export function findRelease(releases: Release[], keyParam: string): Release | undefined {
  const key = decodeURIComponent(keyParam);
  return releases.find((r) => {
    const slugMatch = slugifyRelease(r.title) === key || r.key === key;
    if (r.isSingle) return `single-${r.tracks[0]!.id}` === key || slugMatch;
    return slugMatch;
  });
}
