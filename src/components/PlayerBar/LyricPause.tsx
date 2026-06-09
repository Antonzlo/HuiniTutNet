"use client";

import type { LrcLine } from "@/lib/lrc";
import { pauseSecondsLeft } from "@/lib/lrc";
import styles from "./LyricPause.module.scss";

type Props = {
  line: LrcLine;
  active: boolean;
  currentTime: number;
  onSeek: (time: number) => void;
};

export function LyricPause({ line, active, currentTime, onSeek }: Props) {
  const remaining = pauseSecondsLeft(line, currentTime);
  const showCountdown = active && remaining > 0 && remaining <= 3;

  if (!active) {
    return <div className={styles.spacer} aria-hidden />;
  }

  return (
    <button
      type="button"
      className={styles.pause}
      onClick={() => line.pauseEnd != null && onSeek(line.pauseEnd)}
      aria-label={`Пауза, ${remaining} сек.`}
    >
      {showCountdown ? (
        <span key={remaining} className={styles.count}>
          {remaining}
        </span>
      ) : (
        <span className={styles.dots} aria-hidden>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </span>
      )}
    </button>
  );
}
