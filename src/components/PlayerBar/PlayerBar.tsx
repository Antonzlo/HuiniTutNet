"use client";

import {
  VolumeIcon,
  HeartIcon,
  PlaylistIcon,
  LyricsIcon,
  FullscreenIcon,
} from "@/components/icons";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { usePlayer } from "@/context/PlayerContext";
import { usePlayerPanel } from "@/context/PlayerPanelContext";
import { useFavorites } from "@/context/FavoritesContext";
import { mediaUrl } from "@/lib/api";
import { formatQuality } from "@/lib/release";
import { PlayerControls } from "./PlayerControls";
import styles from "./PlayerBar.module.scss";

export function PlayerBar() {
  const { currentTrack, isAd, volume, muted, setVolume, toggleMute, queue } = usePlayer();
  const {
    sidePanel,
    immersive,
    panelFullscreen,
    openSidePanel,
    toggleSidePanel,
    togglePanelFullscreen,
    openPanelFullscreen,
    openImmersive,
    closeImmersive,
  } = usePlayerPanel();
  const { isFavorite, toggle } = useFavorites();

  const hasTrack = Boolean(currentTrack);
  const fav = currentTrack ? isFavorite(currentTrack.id) : false;
  const effectiveVolume = muted ? 0 : volume;
  const qualityLabel = currentTrack && !isAd ? formatQuality(currentTrack).split(" · ")[0] : null;
  const volPct = Math.round(effectiveVolume * 100);
  const queueActive = sidePanel === "queue";
  const lyricsActive = immersive === "lyrics";

  async function toggleFav() {
    if (!currentTrack || isAd) return;
    await toggle(currentTrack.id);
  }

  function openNowPlayingPanel() {
    if (hasTrack) openSidePanel("now-playing");
  }

  function toggleLyrics() {
    if (lyricsActive) {
      closeImmersive();
      return;
    }
    if (!panelFullscreen) openPanelFullscreen();
    openImmersive("lyrics");
  }

  return (
    <section
      className={`${styles.root} ${panelFullscreen ? styles.rootFullscreen : ""}`}
      aria-labelledby="player-region"
    >
      <h3
        id="player-region"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
      >
        Плеер
      </h3>

      <div className={styles.left}>
        <button
          type="button"
          className={styles.coverBtn}
          onClick={openNowPlayingPanel}
          disabled={!hasTrack}
          aria-label="Сейчас играет"
        >
          <div className={styles.cover} key={currentTrack?.id}>
            {currentTrack?.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(currentTrack.coverUrl, { w: 128 })} alt="" decoding="async" />
            )}
          </div>
        </button>

        <div className={styles.meta}>
          {currentTrack && !isAd ? (
            <button type="button" className={styles.titleBtn} onClick={openNowPlayingPanel}>
              <span className={styles.title}>{currentTrack.title}</span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.titleBtn}
              onClick={openNowPlayingPanel}
              disabled={!hasTrack}
            >
              <span className={styles.title}>
                {isAd && <span className={styles.adBadge}>Реклама</span>}
                {currentTrack?.title ?? "Выбери трек"}
              </span>
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
          <HeartIcon filled={fav} size={18} tone={fav ? "accent" : "muted"} />
        </button>
      </div>

      <div className={styles.center}>
        <PlayerControls />
      </div>

      <div className={styles.right}>
        {hasTrack && !isAd && (
          <button
            type="button"
            className={`${styles.iconBtn} ${lyricsActive ? styles.iconBtnActive : ""}`}
            onClick={toggleLyrics}
            aria-label="Текст песни"
            aria-pressed={lyricsActive}
          >
            <LyricsIcon tone={lyricsActive ? "accent" : "muted"} size={18} />
          </button>
        )}
        {hasTrack && !isAd && queue.length > 0 && (
          <button
            type="button"
            className={`${styles.iconBtn} ${queueActive ? styles.iconBtnActive : ""}`}
            onClick={() => toggleSidePanel("queue")}
            aria-label="Очередь"
            aria-pressed={queueActive}
          >
            <PlaylistIcon tone={queueActive ? "primary" : "muted"} size={18} />
          </button>
        )}
        {qualityLabel && <span className={styles.quality}>{qualityLabel}</span>}
        <button
          type="button"
          className={styles.iconBtn}
          onClick={toggleMute}
          aria-label={muted ? "Включить звук" : "Громкость"}
        >
          <VolumeIcon tone={muted || effectiveVolume === 0 ? "muted" : "primary"} size={18} />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volPct}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className={styles.volumeSlider}
          style={{ "--vol": `${volPct}%` } as React.CSSProperties}
          aria-label="Громкость"
        />
        <button
          type="button"
          className={`${styles.iconBtn} ${panelFullscreen ? styles.iconBtnActive : ""}`}
          onClick={() => togglePanelFullscreen()}
          disabled={!hasTrack}
          aria-label="Плеер на весь экран"
          aria-pressed={panelFullscreen}
        >
          <FullscreenIcon tone={panelFullscreen ? "accent" : "muted"} size={18} />
        </button>
      </div>
    </section>
  );
}
