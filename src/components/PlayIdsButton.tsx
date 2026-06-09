"use client";

import { PlayIcon, PauseIcon } from "@/components/icons";
import { usePlayer } from "@/context/PlayerContext";
import { useIdsPlayback } from "@/hooks/useCollectionPlayback";

type Props = {
  trackIds: string[];
  onPlay: () => void;
  className?: string;
  iconSize?: number;
  iconTone?: "primary" | "dark";
  "aria-label"?: string;
};

export function PlayIdsButton({
  trackIds,
  onPlay,
  className,
  iconSize = 22,
  iconTone = "primary",
  "aria-label": ariaLabel = "Играть",
}: Props) {
  const { togglePlay } = usePlayer();
  const { isActive, showPause } = useIdsPlayback(trackIds);

  return (
    <button
      type="button"
      className={className}
      onClick={() => (isActive ? togglePlay() : onPlay())}
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
