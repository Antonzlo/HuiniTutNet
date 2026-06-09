"use client";

import { useEffect, useState } from "react";
import { VolumeIcon, HeartIcon, PlaylistIcon } from "@/components/icons";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { usePlayer } from "@/context/PlayerContext";
import { useFavorites } from "@/context/FavoritesContext";
import { mediaUrl } from "@/lib/api";
import { PlayerControls } from "./PlayerControls";
import { NowPlaying } from "./NowPlaying";
import { PlayerQueue } from "./PlayerQueue";
import styles from "./PlayerBar.module.scss";

export function PlayerBar() {
  const { currentTrack, isAd, volume, muted, setVolume, toggleMute, queue } = usePlayer();
  const { isFavorite, toggle } = useFavorites();
  const [expanded, setExpanded] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const hasTrack = Boolean(currentTrack);
  const fav = currentTrack ? isFavorite(currentTrack.id) : false;
  const effectiveVolume = muted ? 0 : volume;

  useEffect(() => {
    if (!currentTrack) setExpanded(false);
  }, [currentTrack]);

  async function toggleFav() {
    if (!currentTrack || isAd) return;
    await toggle(currentTrack.id);
  }

  function openNowPlaying() {
    if (hasTrack) setExpanded(true);
  }

  return (
    <>
      <div className={styles.player}>
        <div className={styles.left}>
          <button
            type="button"
            className={styles.artworkBtn}
            onClick={openNowPlaying}
            disabled={!hasTrack}
            aria-label="Открыть плеер"
          >
            <div className={styles.artwork} key={currentTrack?.id}>
              {currentTrack?.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrl(currentTrack.coverUrl)} alt="" />
              )}
            </div>
          </button>
          <div className={styles.meta}>
            {currentTrack && !isAd ? (
              <TrackTitleLink track={currentTrack} catalog={queue} className={styles.titleLink} />
            ) : (
              <button
                type="button"
                className={styles.titleBtn}
                onClick={openNowPlaying}
                disabled={!hasTrack}
              >
                <div className={styles.title}>
                  {isAd && <span className={styles.adBadge}>Реклама</span>}
                  {currentTrack?.title ?? "Выбери трек"}
                </div>
              </button>
            )}
            <div className={styles.artistRow}>
              {currentTrack && !isAd ? (
                <TrackArtistLinks track={currentTrack} className={styles.artistLinks} />
              ) : (
                <span className={styles.artistFallback}>
                  {currentTrack ? currentTrack.artist.name : "HuiniTut"}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className={`${styles.likeBtn} ${fav ? styles.liked : ""}`}
            onClick={() => void toggleFav()}
            disabled={!hasTrack || isAd}
            aria-label={fav ? "Убрать из избранного" : "Добавить в избранное"}
            aria-pressed={fav}
          >
            <HeartIcon filled={fav} size={18} />
          </button>
        </div>

        <div className={styles.center}>
          <PlayerControls />
        </div>

        <div className={styles.right}>
          {hasTrack && !isAd && queue.length > 0 && (
            <button
              type="button"
              className={`${styles.iconBtn} ${queueOpen ? styles.iconBtnActive : ""}`}
              onClick={() => setQueueOpen((v) => !v)}
              aria-label="Очередь"
              aria-pressed={queueOpen}
            >
              <PlaylistIcon tone={queueOpen ? "primary" : "muted"} size={18} />
            </button>
          )}
          {hasTrack && !isAd && (
            <button
              type="button"
              className={styles.lyricsBtn}
              onClick={openNowPlaying}
              aria-label="Текст песни"
            >
              Текст
            </button>
          )}
          <div className={styles.volumeWrap}>
            <button type="button" className={styles.iconBtn} onClick={toggleMute} aria-label="Громкость">
              <VolumeIcon tone={muted || effectiveVolume === 0 ? "muted" : "primary"} size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(effectiveVolume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className={styles.volumeSlider}
              aria-label="Громкость"
            />
          </div>
        </div>
      </div>

      <NowPlaying
        open={expanded}
        onClose={() => setExpanded(false)}
        fav={fav}
        onToggleFav={() => void toggleFav()}
      />

      <PlayerQueue open={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
