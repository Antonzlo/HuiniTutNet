"use client";

import { useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { mediaUrl } from "@/lib/api";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { usePlayerPanel } from "@/context/PlayerPanelContext";
import styles from "./panel.module.scss";

export function QueuePreviewCard() {
  const { queue, currentTrack, playFromQueue } = usePlayer();
  const { openSidePanel } = usePlayerPanel();

  const nextTrack = useMemo(() => {
    const music = queue.filter((t) => !t.isAd);
    if (!music.length) return null;
    const idx = currentTrack ? music.findIndex((t) => t.id === currentTrack.id) : -1;
    if (idx >= 0 && idx < music.length - 1) return music[idx + 1]!;
    if (idx < 0) return music[0]!;
    return null;
  }, [queue, currentTrack]);

  if (!nextTrack) return null;

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardTitle}>Далее в очереди</h3>
        <button
          type="button"
          className={styles.cardLink}
          onClick={() => openSidePanel("queue")}
        >
          Показать очередь
        </button>
      </div>
      <button
        type="button"
        className={styles.previewRow}
        onClick={() => playFromQueue(nextTrack.id)}
      >
        <div className={styles.previewCover}>
          {nextTrack.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(nextTrack.coverUrl)} alt="" />
          )}
        </div>
        <div className={styles.previewMeta}>
          <TrackTitleLink track={nextTrack} catalog={queue} className={styles.previewTitle} />
          <TrackArtistLinks track={nextTrack} className={styles.previewArtists} />
        </div>
      </button>
    </section>
  );
}
