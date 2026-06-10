"use client";

import styles from "./PlayerTimecode.module.scss";

type Props = {
  progress: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  hasTrack: boolean;
  onSeek: (time: number) => void;
};

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PlayerTimecode({ progress, currentTime, duration, isPlaying, hasTrack, onSeek }: Props) {
  const active = hasTrack && (isPlaying || progress > 0);

  return (
    <div
      className={`${styles.wrap} ${hasTrack ? styles.hasTrack : ""} ${active ? styles.isPlaying : ""}`}
      data-test-id="TIMECODE_WRAPPER"
    >
      <span className={`${styles.time} ${styles.timeEnd}`} aria-hidden>
        {fmt(duration)}
      </span>
      <span
        className={`${styles.time} ${styles.timeStart}`}
        style={{ left: `${progress}%` }}
        aria-hidden
      >
        {fmt(currentTime)}
      </span>
      <div className={styles.progressBg} />
      <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      <div className={styles.thumb} style={{ left: `${progress}%` }} />
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={progress}
        disabled={!hasTrack}
        onChange={(e) => {
          const p = Number(e.target.value);
          onSeek((p / 100) * (duration || 1));
        }}
        className={styles.slider}
        aria-label="Управление таймкодом"
        aria-valuetext={fmt(currentTime)}
      />
    </div>
  );
}
