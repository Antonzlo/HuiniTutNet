"use client";

import type { Track } from "@/lib/types";
import { usePlayer } from "@/context/PlayerContext";
import { HiuniMascot } from "@/components/Brand/HiuniMascot";
import { HiuniTrackRow } from "@/components/TrackRow/HiuniTrackRow";
import styles from "./TrackList.module.scss";

type Props = {
  tracks: Track[];
  loading?: boolean;
  emptyMessage?: string;
  variant?: "default" | "playlist" | "artist";
  limit?: number;
  hideArtist?: boolean;
  catalog?: Track[];
  playContextId?: string;
  onTrackDeleted?: (id: string) => void;
};

export function HiuniTrackList({
  tracks,
  loading,
  emptyMessage = "Пока пусто",
  variant = "default",
  limit,
  hideArtist,
  catalog,
  playContextId,
  onTrackDeleted,
}: Props) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isPlaylist = variant === "playlist";
  const isArtist = variant === "artist";
  const compact = isPlaylist || isArtist;
  const visible = limit ? tracks.slice(0, limit) : tracks;
  const releaseCatalog = catalog ?? tracks;

  if (loading) {
    return (
      <div className={styles.empty}>
        <HiuniMascot size={48} />
        <p>Загрузка…</p>
      </div>
    );
  }
  if (tracks.length === 0) {
    return (
      <div className={styles.empty}>
        <HiuniMascot size={56} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.list} ${compact ? styles.listPlaylist : ""}`}>
      <div
        className={`${styles.tableHead} ${
          isArtist ? styles.tableHeadArtist : isPlaylist ? styles.tableHeadPlaylist : styles.tableHeadDefault
        }`}
      >
        <span className={styles.th}>#</span>
        <span className={styles.th}>Название</span>
        {isArtist ? (
          <>
            <span className={`${styles.th} ${styles.thRight}`}>Прослушивания</span>
            <span className={`${styles.th} ${styles.thRight}`}>
              <span className={styles.clockIcon} aria-label="Длительность">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm7.25-3.5v4.19l2.72 1.62-.75 1.24L7 9.19V4.5h.25Z" />
                </svg>
              </span>
            </span>
          </>
        ) : isPlaylist ? (
          <>
            <span className={styles.th}>Альбом</span>
            <span className={styles.th}>Добавлен</span>
            <span className={`${styles.th} ${styles.thRight}`}>
              <span className={styles.clockIcon} aria-label="Длительность">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm7.25-3.5v4.19l2.72 1.62-.75 1.24L7 9.19V4.5h.25Z" />
                </svg>
              </span>
            </span>
          </>
        ) : (
          <>
            <span className={styles.th}>Исполнитель</span>
            <span className={styles.th}>Альбом</span>
            <span className={styles.th}>Формат</span>
            <span className={styles.th}>Рейтинг</span>
            <span className={styles.th} aria-hidden />
          </>
        )}
      </div>
      {visible.map((track, i) => {
        const active = currentTrack?.id === track.id;
        return (
          <HiuniTrackRow
            key={track.id}
            index={i + 1}
            track={track}
            variant={variant}
            hideArtist={hideArtist ?? isArtist}
            active={active}
            playing={active && isPlaying}
            queue={releaseCatalog}
            onPlay={() =>
              playTrack(track, {
                queue: tracks,
                contextId: playContextId ?? null,
              })
            }
            onDeleted={onTrackDeleted}
          />
        );
      })}
    </div>
  );
}
