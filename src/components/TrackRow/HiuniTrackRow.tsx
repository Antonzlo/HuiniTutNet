"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { PlayIcon, PauseIcon, HeartIcon, MoreIcon } from "@/components/icons";
import { StarRating } from "@/components/StarRating";
import { api, mediaUrl } from "@/lib/api";
import type { Track } from "@/lib/types";
import { fmtCount, fmtDuration, fmtRelativeDate } from "@/lib/track";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useTrackPlayCount } from "@/hooks/useTrackPlayCount";
import { TrackContextMenu } from "./TrackContextMenu";
import styles from "./TrackRow.module.scss";

type Props = {
  track: Track;
  index?: number;
  active?: boolean;
  playing?: boolean;
  queue?: Track[];
  variant?: "default" | "playlist" | "artist";
  hideArtist?: boolean;
  onPlay: () => void;
  onDeleted?: (id: string) => void;
};

export function HiuniTrackRow({
  track,
  index,
  active,
  playing,
  queue,
  variant = "default",
  hideArtist = false,
  onPlay,
  onDeleted,
}: Props) {
  const { togglePlay, addToQueue } = usePlayer();
  const { isFavorite, toggle } = useFavorites();
  const [stars, setStars] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const isPlaylist = variant === "playlist";
  const isArtist = variant === "artist";
  const fav = isFavorite(track.id);
  const plays = useTrackPlayCount(track);

  const openMenu = useCallback((x: number, y: number) => {
    setMenuPos({ x, y });
    setMenuOpen(true);
  }, []);

  const openMenuFromEvent = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openMenu(rect.right - 248, rect.bottom + 4);
  }, [openMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(e.clientX, e.clientY);
  }, [openMenu]);

  async function rate(n: number) {
    setStars(n);
    await api(`/api/tracks/${track.id}/rating`, {
      method: "PUT",
      body: JSON.stringify({ stars: n }),
    });
  }

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation();
    await toggle(track.id);
  }

  async function remove() {
    if (!window.confirm(`Удалить «${track.title}»?`)) return;
    try {
      await api(`/api/tracks/${track.id}`, { method: "DELETE" });
      onDeleted?.(track.id);
    } catch {
      window.alert("Не удалось удалить трек");
    }
  }

  function handlePlayPause(e: React.MouseEvent) {
    e.stopPropagation();
    if (active) void togglePlay();
    else onPlay();
  }

  const rowClass = [
    isArtist ? styles.artistRow : isPlaylist ? styles.playlistRow : styles.tableRow,
    menuOpen ? styles.menuOpen : "",
    active ? styles.active : "",
    playing ? styles.playing : "",
    fav ? styles.rowFavorited : "",
  ]
    .filter(Boolean)
    .join(" ");

  const artistSlug = track.artists?.[0]?.artist.slug ?? track.artist.slug;
  const createdAt = track.createdAt;

  const endActions = (
    <div className={styles.endCol} onClick={(e) => e.stopPropagation()}>
      <div className={styles.endInner}>
        <button
          type="button"
          className={`${styles.rowLike} ${fav ? styles.rowLikeActive : ""}`}
          onClick={toggleFav}
          aria-label={fav ? "Убрать из избранного" : "Добавить в избранное"}
          aria-pressed={fav}
        >
          <HeartIcon filled={fav} size={16} />
        </button>
        <span className={styles.duration}>{fmtDuration(track.durationSec)}</span>
        <div className={styles.menuAnchor}>
          <button
            type="button"
            className={styles.moreBtn}
            aria-label="Ещё"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={openMenuFromEvent}
          >
            <MoreIcon tone="muted" size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={rowClass}
        data-track-row
        onClick={onPlay}
        onContextMenu={handleContextMenu}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay();
          }
        }}
      >
        <div className={styles.indexCell}>
          <span className={styles.indexNum}>{index}</span>
          <button
            type="button"
            className={styles.indexPlay}
            onClick={handlePlayPause}
            aria-label={playing ? "Пауза" : "Играть"}
          >
            {playing ? <PauseIcon tone="primary" size={16} /> : <PlayIcon tone="primary" size={16} />}
          </button>
        </div>

        <div className={styles.titleCell}>
          <div className={styles.artThumb}>
            {track.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(track.coverUrl)} alt="" className={styles.artImg} />
            )}
          </div>
          <div className={styles.titleMeta}>
            <TrackTitleLink track={track} catalog={queue} className={styles.titleLink} />
            {!hideArtist && (
              <TrackArtistLinks track={track} className={styles.artistSub} />
            )}
          </div>
        </div>

        {isArtist ? (
          <>
            <span className={styles.playsCol}>{fmtCount(plays)}</span>
            {endActions}
          </>
        ) : isPlaylist ? (
          <>
            <span className={styles.albumCol}>{track.album ?? "—"}</span>
            <span className={styles.dateCol}>{fmtRelativeDate(createdAt)}</span>
            {endActions}
          </>
        ) : (
          <>
            <span className={styles.artistCell}>
              <TrackArtistLinks track={track} />
            </span>
            <span className={styles.albumCell}>{track.album ?? "—"}</span>
            <span className={styles.formatCell}>{track.format.toUpperCase()}</span>
            <div className={styles.ratingCell} onClick={(e) => e.stopPropagation()}>
              <StarRating value={stars} onChange={rate} size={14} />
            </div>
            <div className={styles.actionsCell}>
              <Link href={`/tracks/${track.id}/edit`} className={styles.editLink} onClick={(e) => e.stopPropagation()} aria-label="Редактировать">
                ✎
              </Link>
              <button type="button" className={styles.deleteLink} onClick={(e) => { e.stopPropagation(); void remove(); }} aria-label="Удалить">
                ×
              </button>
              <button
                type="button"
                className={`${styles.likeCell} ${fav ? styles.rowLikeActive : ""}`}
                onClick={toggleFav}
                aria-label={fav ? "Убрать из избранного" : "Добавить в избранное"}
                aria-pressed={fav}
              >
                <HeartIcon filled={fav} size={16} />
              </button>
              <button
                type="button"
                className={styles.moreBtnInline}
                aria-label="Ещё"
                onClick={openMenuFromEvent}
              >
                <MoreIcon tone="muted" size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <TrackContextMenu
        open={menuOpen}
        x={menuPos.x}
        y={menuPos.y}
        onClose={() => setMenuOpen(false)}
        track={track}
        fav={fav}
        playing={Boolean(playing)}
        onPlay={onPlay}
        onTogglePlay={() => void togglePlay()}
        onFavorite={() => void toggle(track.id)}
        onAddToQueue={() => addToQueue(track)}
        onDelete={() => void remove()}
        artistSlug={artistSlug}
      />
    </>
  );
}
