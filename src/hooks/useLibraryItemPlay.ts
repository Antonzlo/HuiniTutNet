"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import type { MixPageData } from "@/lib/home";
import type { LibraryItem } from "@/lib/library";
import { releaseApiPath } from "@/lib/release";
import { usePlayer } from "@/context/PlayerContext";
import type { Track } from "@/lib/types";

export function libraryItemContextId(item: LibraryItem) {
  return `library:${item.id}`;
}

export function useLibraryItemPlay(item: LibraryItem) {
  const { playTrack } = usePlayer();
  const contextId = libraryItemContextId(item);

  const play = useCallback(async () => {
    try {
      let tracks: Track[] = [];

      if (item.id === "favorites") {
        tracks = await api<Track[]>("/api/favorites");
      } else if (item.href.startsWith("/releases/")) {
        const slug = item.href.slice("/releases/".length).split("?")[0]!;
        const release = await api<{ tracks?: Track[] }>(releaseApiPath(slug));
        tracks = release.tracks ?? [];
      } else if (item.type === "artist") {
        const slug = item.href.replace("/artists/", "").split("/")[0]!;
        const artist = await api<{ tracks: Track[] }>(`/api/artists/${slug}`);
        tracks = [...artist.tracks].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
      } else if (item.href.startsWith("/mix/")) {
        const id = decodeURIComponent(item.href.slice("/mix/".length));
        const data = await api<MixPageData>(`/api/mix/${encodeURIComponent(id)}`);
        tracks = data.tracks;
      } else if (item.href.startsWith("/radio/")) {
        const slug = decodeURIComponent(item.href.slice("/radio/".length));
        const data = await api<MixPageData>(`/api/radio/${slug}`);
        tracks = data.tracks;
      }

      tracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
      if (tracks.length) playTrack(tracks[0]!, { queue: tracks, contextId });
    } catch {
      /* ignore */
    }
  }, [item, playTrack, contextId]);

  return { play, contextId };
}
