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
import styles from "./PlayerControls.module.scss";

type Props = {
  size?: "sm" | "lg";
  showProgress?: boolean;
};

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerControls({ size = "sm", showProgress = true }: Props) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    seek,
  } = usePlayer();

  const hasTrack = Boolean(currentTrack);
  const lg = size === "lg";

  return (
    <div className={`${styles.wrap} ${lg ? styles.lg : ""}`}>
      <div className={styles.controls}>
        <button type="button" className={styles.iconBtn} aria-label="Shuffle" disabled>
          <ShuffleIcon tone="muted" size={lg ? 20 : 16} />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={playPrev}
          disabled={!hasTrack}
          aria-label="Назад"
        >
          <PrevIcon size={lg ? 22 : 20} tone="primary" />
        </button>
        <button
          type="button"
          className={`${styles.playBtn} ${isPlaying ? styles.playing : ""}`}
          onClick={togglePlay}
          disabled={!hasTrack}
          aria-label={isPlaying ? "Пауза" : "Играть"}
        >
          {isPlaying ? (
            <PauseIcon size={lg ? 24 : 20} tone="dark" />
          ) : (
            <PlayIcon size={lg ? 24 : 20} tone="dark" />
          )}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={playNext}
          disabled={!hasTrack}
          aria-label="Вперёд"
        >
          <NextIcon size={lg ? 22 : 20} tone="primary" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Repeat" disabled>
          <RepeatIcon tone="muted" size={lg ? 20 : 16} />
        </button>
      </div>
      {showProgress && (
        <div className={styles.timeline}>
          <span className={styles.time}>{fmt(currentTime)}</span>
          <div className={styles.progressWrap}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            <span className={styles.progressThumb} style={{ left: `${progress}%` }} />
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              disabled={!hasTrack}
              onChange={(e) => {
                const p = Number(e.target.value);
                const total = duration || 1;
                seek((p / 100) * total);
              }}
              className={styles.progressInput}
              aria-label="Прогресс"
            />
          </div>
          <span className={styles.time}>{fmt(duration)}</span>
        </div>
      )}
    </div>
  );
}
