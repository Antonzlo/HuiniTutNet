"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePlayer } from "@/context/PlayerContext";
import { mediaUrl } from "@/lib/api";
import { fmtDuration } from "@/lib/track";
import type { Track } from "@/lib/types";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import styles from "./PlayerQueue.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
};

function QueueRow({
  track,
  index,
  active,
  playing,
  catalog,
  onPlay,
  onClose,
}: {
  track: Track;
  index: number | null;
  active: boolean;
  playing: boolean;
  catalog: Track[];
  onPlay: () => void;
  onClose: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={`${styles.row} ${active ? styles.rowActive : ""}`}
        onClick={onPlay}
      >
        <span className={styles.index}>
          {active && playing ? (
            <span className={styles.eq} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          ) : index !== null ? (
            index
          ) : (
            ""
          )}
        </span>
        <div className={styles.cover}>
          {track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(track.coverUrl)} alt="" />
          ) : null}
        </div>
        <div className={styles.meta}>
          <TrackTitleLink
            track={track}
            catalog={catalog}
            className={styles.trackTitle}
            onNavigate={onClose}
          />
          <TrackArtistLinks track={track} className={styles.artists} onNavigate={onClose} />
        </div>
        <span className={styles.dur}>{fmtDuration(track.durationSec)}</span>
      </button>
    </li>
  );
}

export function PlayerQueue({ open, onClose }: Props) {
  const { queue, currentTrack, playFromQueue, isPlaying, radioFromIndex } = usePlayer();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const musicQueue = useMemo(() => queue.filter((t) => !t.isAd), [queue]);

  const { nowPlaying, nextUser, nextRadio } = useMemo(() => {
    const curIdx = currentTrack
      ? musicQueue.findIndex((t) => t.id === currentTrack.id)
      : -1;
    const radioStart = radioFromIndex ?? musicQueue.length;
    const upcoming =
      curIdx >= 0 ? musicQueue.slice(curIdx + 1) : musicQueue;

    const userUpcoming: Track[] = [];
    const radioUpcoming: Track[] = [];
    for (let i = 0; i < upcoming.length; i++) {
      const globalIdx = curIdx >= 0 ? curIdx + 1 + i : i;
      if (globalIdx >= radioStart) radioUpcoming.push(upcoming[i]!);
      else userUpcoming.push(upcoming[i]!);
    }

    return {
      nowPlaying: curIdx >= 0 ? musicQueue[curIdx]! : null,
      nextUser: userUpcoming,
      nextRadio: radioUpcoming,
    };
  }, [musicQueue, currentTrack, radioFromIndex]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className={`${styles.overlay} ${visible ? styles.open : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <aside
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Очередь воспроизведения"
      >
        <header className={styles.head}>
          <h2 className={styles.title}>Очередь</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Закрыть
          </button>
        </header>

        {musicQueue.length === 0 ? (
          <p className={styles.empty}>Очередь пуста</p>
        ) : (
          <div className={styles.body}>
            {nowPlaying && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Сейчас играет</h3>
                <ul className={styles.list}>
                  <QueueRow
                    track={nowPlaying}
                    index={null}
                    active
                    playing={isPlaying}
                    catalog={musicQueue}
                    onPlay={() => playFromQueue(nowPlaying.id)}
                    onClose={onClose}
                  />
                </ul>
              </section>
            )}

            {nextUser.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Далее</h3>
                <ul className={styles.list}>
                  {nextUser.map((track, i) => (
                    <QueueRow
                      key={track.id}
                      track={track}
                      index={i + 1}
                      active={currentTrack?.id === track.id}
                      playing={currentTrack?.id === track.id && isPlaying}
                      catalog={musicQueue}
                      onPlay={() => playFromQueue(track.id)}
                      onClose={onClose}
                    />
                  ))}
                </ul>
              </section>
            )}

            {(nextRadio.length > 0 ||
              radioFromIndex !== null ||
              (nowPlaying && nextUser.length === 0)) && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Рекомендации</h3>
                {nextRadio.length === 0 ? (
                  <p className={styles.hint}>Подбираем похожие треки…</p>
                ) : (
                  <ul className={styles.list}>
                    {nextRadio.map((track, i) => (
                      <QueueRow
                        key={track.id}
                        track={track}
                        index={nextUser.length + i + 1}
                        active={currentTrack?.id === track.id}
                        playing={currentTrack?.id === track.id && isPlaying}
                        catalog={musicQueue}
                        onPlay={() => playFromQueue(track.id)}
                        onClose={onClose}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
