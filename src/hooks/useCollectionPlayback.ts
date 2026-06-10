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

function hasPlaybackContext(contextId?: string | null) {
  return contextId != null && contextId !== "";
}

export function useCollectionPlayback(tracks: Track[], contextId?: string | null) {
  const { currentTrack, isPlaying, playTrack, togglePlay, queueContextId } = usePlayer();
  const trackIds = useMemo(() => tracks.map((t) => t.id), [tracks]);
  const contextActive = hasPlaybackContext(contextId) && queueContextId === contextId;
  const trackInCollection = collectionHasCurrent(trackIds, currentTrack?.id);
  const isActive = hasPlaybackContext(contextId) ? contextActive : trackInCollection;
  const showPause = isActive && isPlaying;

  const playCollection = useCallback(
    (queue = tracks, startIndex = 0) => {
      if (contextActive) {
        togglePlay();
        return;
      }
      const track = queue[startIndex];
      if (!track) return;
      playTrack(track, { queue, contextId: contextId ?? null });
    },
    [contextActive, tracks, contextId, playTrack, togglePlay]
  );

  return { isActive, showPause, playCollection };
}

export function useIdsPlayback(trackIds: string[] | undefined, contextId?: string | null) {
  const { currentTrack, isPlaying, queueContextId } = usePlayer();
  const contextActive = hasPlaybackContext(contextId) && queueContextId === contextId;
  const trackInList = collectionHasCurrent(trackIds ?? [], currentTrack?.id);
  const isActive = hasPlaybackContext(contextId) ? contextActive : trackInList;
  return { isActive, showPause: isActive && isPlaying };
}
