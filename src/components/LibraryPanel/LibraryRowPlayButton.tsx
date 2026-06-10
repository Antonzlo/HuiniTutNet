"use client";

import { PlayIcon, PauseIcon } from "@/components/icons";
import { useLibraryItemPlay } from "@/hooks/useLibraryItemPlay";
import { usePlayer } from "@/context/PlayerContext";
import type { LibraryItem } from "@/lib/library";
import s from "./LibraryPanel.module.scss";

type Props = {
  item: LibraryItem;
};

export function LibraryRowPlayButton({ item }: Props) {
  const { play, contextId } = useLibraryItemPlay(item);
  const { queueContextId, isPlaying, togglePlay } = usePlayer();
  const active = queueContextId === contextId;
  const showPause = active && isPlaying;

  return (
    <button
      type="button"
      className={s.rowPlayBtn}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (active) togglePlay();
        else void play();
      }}
      aria-label={showPause ? "Пауза" : `Играть ${item.title}`}
    >
      {showPause ? <PauseIcon size={16} tone="primary" /> : <PlayIcon size={16} tone="primary" />}
    </button>
  );
}
