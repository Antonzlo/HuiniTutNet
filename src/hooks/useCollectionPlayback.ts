"use client";

import { useCallback, useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import type { Track } from "@/lib/types";

export function collectionHasCurrent(
  trackIds: string[],
  currentTrackId: string | undefined
) {
  return Boolean(currentTrackId && trackIds.includes(currentTrackId));
}

export function useCollectionPlayback(tracks: Track[], contextId?: string | null) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);
  const isActive = collectionHasCurrent(trackIds, currentTrack?.id);
  const showPause = isActive && isPlaying;

  const playCollection = useCallback(
    (queue = tracks, startIndex = 0) => {
      if (isActive) {
        togglePlay();
        return;
      }
      const track = queue[startIndex];
      if (!track) return;
      playTrack(track, { queue, contextId: contextId ?? null });
    },
    [isActive, tracks, contextId, playTrack, togglePlay]
  );

  return { isActive, showPause, playCollection };
}

export function useIdsPlayback(trackIds: string[] | undefined) {
  const { currentTrack, isPlaying } = usePlayer();
  const isActive = collectionHasCurrent(trackIds ?? [], currentTrack?.id);
  return { isActive, showPause: isActive && isPlaying };
}
