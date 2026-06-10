"use client";

import {
  PrevIcon,
  NextIcon,
  PlayIcon,
  PauseIcon,
  ShuffleIcon,
  RepeatIcon,
} from "@/components/icons";
import { usePlayer } from "@/context/PlayerContext";
import styles from "./SonataControls.module.scss";

export function SonataControls() {
  const { currentTrack, isPlaying, togglePlay, playNext, playPrev } = usePlayer();
  const hasTrack = Boolean(currentTrack);

  return (
    <div className={styles.root}>
      <div className={styles.side}>
        <button type="button" className={styles.btn} aria-label="В случайном порядке" disabled>
          <ShuffleIcon tone="muted" size={20} />
        </button>
      </div>
      <div className={styles.main}>
        <button
          type="button"
          className={styles.btn}
          onClick={playPrev}
          disabled={!hasTrack}
          aria-label="Предыдущая песня"
        >
          <PrevIcon size={22} tone="primary" />
        </button>
        <button
          type="button"
          className={styles.playBtn}
          onClick={togglePlay}
          disabled={!hasTrack}
          aria-label={isPlaying ? "Пауза" : "Воспроизведение"}
        >
          {isPlaying ? <PauseIcon size={24} tone="dark" /> : <PlayIcon size={24} tone="dark" />}
        </button>
        <button
          type="button"
          className={styles.btn}
          onClick={playNext}
          disabled={!hasTrack}
          aria-label="Следующая песня"
        >
          <NextIcon size={22} tone="primary" />
        </button>
      </div>
      <div className={styles.side}>
        <button type="button" className={styles.btn} aria-label="Повтор" disabled>
          <RepeatIcon tone="muted" size={20} />
        </button>
      </div>
    </div>
  );
}
