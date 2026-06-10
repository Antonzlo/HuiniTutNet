"use client";

import { PlayIcon, PauseIcon } from "@/components/icons";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import { usePlayer } from "@/context/PlayerContext";
import type { Track } from "@/lib/types";
import s from "./ShelfPlayOverlay.module.scss";

const ICON_SIZE = 18;

type Props = {
  tracks?: Track[];
  trackIds?: string[];
  onPlay?: () => void | Promise<void>;
  contextId?: string | null;
  round?: boolean;
  forceVisible?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
};

export function ShelfPlayOverlay({
  tracks,
  trackIds,
  onPlay,
  contextId,
  round,
  forceVisible,
  disabled,
  "aria-label": ariaLabel = "Играть",
}: Props) {
  const { queueContextId, isPlaying, togglePlay } = usePlayer();
  const collection = useCollectionPlayback(tracks ?? [], contextId);
  const contextActive = Boolean(contextId && queueContextId === contextId);

  const canPlay =
    !disabled &&
    ((tracks && tracks.length > 0) || (trackIds && trackIds.length > 0) || Boolean(onPlay));
  if (!canPlay) return null;

  const showPause = contextId
    ? contextActive && isPlaying
    : tracks?.length
      ? collection.showPause
      : false;

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (tracks?.length) {
      collection.playCollection();
      return;
    }
    if (contextActive) {
      togglePlay();
      return;
    }
    void onPlay?.();
  }

  return (
    <button
      type="button"
      className={`${s.playOverlay} ${round ? s.round : ""} ${forceVisible || showPause ? s.visible : ""}`}
      onClick={handleClick}
      aria-label={showPause ? "Пауза" : ariaLabel}
    >
      {showPause ? (
        <PauseIcon size={ICON_SIZE} tone="dark" />
      ) : (
        <PlayIcon size={ICON_SIZE} tone="dark" />
      )}
    </button>
  );
}
