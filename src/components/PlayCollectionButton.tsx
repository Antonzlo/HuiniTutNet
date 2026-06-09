"use client";

import { PlayIcon, PauseIcon } from "@/components/icons";
import { useCollectionPlayback } from "@/hooks/useCollectionPlayback";
import type { Track } from "@/lib/types";

type Props = {
  tracks: Track[];
  contextId?: string | null;
  className?: string;
  iconSize?: number;
  iconTone?: "primary" | "dark";
  disabled?: boolean;
  "aria-label"?: string;
};

export function PlayCollectionButton({
  tracks,
  contextId,
  className,
  iconSize = 24,
  iconTone,
  disabled,
  "aria-label": ariaLabel = "Играть",
}: Props) {
  const { showPause, playCollection } = useCollectionPlayback(tracks, contextId);

  return (
    <button
      type="button"
      className={className}
      onClick={() => playCollection()}
      disabled={disabled ?? tracks.length === 0}
      aria-label={showPause ? "Пауза" : ariaLabel}
    >
      {showPause ? (
        <PauseIcon size={iconSize} tone={iconTone} />
      ) : (
        <PlayIcon size={iconSize} tone={iconTone} />
      )}
    </button>
  );
}
