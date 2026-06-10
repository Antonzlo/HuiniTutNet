"use client";

import { useCallback } from "react";
import { api } from "@/lib/api";
import { usePlayer } from "@/context/PlayerContext";
import type { Track } from "@/lib/types";

export function useArtistPlay(slug: string) {
  const { playTrack } = usePlayer();
  const contextId = `artist:${slug}`;

  const play = useCallback(async () => {
    try {
      const artist = await api<{ tracks: Track[] }>(`/api/artists/${slug}`);
      const tracks = [...artist.tracks].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
      if (tracks.length) playTrack(tracks[0]!, { queue: tracks, contextId });
    } catch {
      /* ignore */
    }
  }, [slug, playTrack, contextId]);

  return { play, contextId };
}
