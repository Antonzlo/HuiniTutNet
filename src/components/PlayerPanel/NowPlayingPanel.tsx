"use client";

import { LyricsIcon, MusicIcon, MoreIcon } from "@/components/icons";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { usePlayer } from "@/context/PlayerContext";
import { usePlayerPanel } from "@/context/PlayerPanelContext";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { mediaUrl } from "@/lib/api";
import { queueContextLabel } from "@/lib/queueContext";
import { TrackCreditsCard } from "./TrackCreditsCard";
import { QueuePreviewCard } from "./QueuePreviewCard";
import { PanelFullscreenButton } from "./PanelFullscreenButton";
import { PanelLyricsPane } from "./PanelLyricsPane";
import panelStyles from "./panel.module.scss";
import styles from "./NowPlayingPanel.module.scss";

export function NowPlayingPanel() {
  const { currentTrack, isAd, queue, queueContextId } = usePlayer();
  const {
    panelFullscreen,
    immersive,
    closeSidePanel,
    openPanelFullscreen,
    closePanelFullscreen,
    openImmersive,
    closeImmersive,
  } = usePlayerPanel();

  if (!currentTrack) return null;

  const contextLabel = queueContextLabel(queueContextId, currentTrack);
  const coverSrc = currentTrack.coverUrl ? mediaUrl(currentTrack.coverUrl) : null;
  const { heroStyle } = useCoverGradient(coverSrc);
  const lyricsOpen = panelFullscreen && immersive === "lyrics" && !isAd;

  function toggleLyrics() {
    if (lyricsOpen) {
      closeImmersive();
      return;
    }
    if (!panelFullscreen) openPanelFullscreen();
    openImmersive("lyrics");
  }

  return (
    <div className={`${styles.root} ${lyricsOpen ? styles.rootLyrics : ""}`}>
      <div
        className={`${styles.bgBlur} ${panelFullscreen ? styles.bgVisible : ""}`}
        style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined}
        aria-hidden
      />
      <div
        className={`${styles.bgGradient} ${panelFullscreen ? styles.bgVisible : ""}`}
        style={heroStyle}
        aria-hidden
      />
      <div
        className={`${styles.bgVignette} ${panelFullscreen ? styles.bgVisible : ""}`}
        aria-hidden
      />

      <header className={`${panelStyles.head} ${styles.head}`}>
        <div className={panelStyles.headLeft}>
          <MusicIcon size={18} className={panelStyles.headIcon} />
          <span className={panelStyles.headTitle}>{contextLabel}</span>
        </div>
        <div className={panelStyles.headActions}>
          <button type="button" className={panelStyles.iconBtn} aria-label="Ещё">
            <MoreIcon tone="muted" size={18} />
          </button>
          {!isAd && (
            <button
              type="button"
              className={`${panelStyles.iconBtn} ${lyricsOpen ? panelStyles.active : ""}`}
              onClick={toggleLyrics}
              aria-label="Текст песни"
              aria-pressed={lyricsOpen}
              title="Текст песни"
            >
              <LyricsIcon tone={lyricsOpen ? "accent" : "muted"} size={18} />
            </button>
          )}
          <PanelFullscreenButton
            expanded={panelFullscreen}
            onClick={panelFullscreen ? closePanelFullscreen : openPanelFullscreen}
          />
          <button
            type="button"
            className={panelStyles.iconBtn}
            onClick={closeSidePanel}
            aria-label="Закрыть"
          >
            <span className={styles.closeX} aria-hidden>
              ×
            </span>
          </button>
        </div>
      </header>

      <div className={styles.stack}>
        <div
          className={`${styles.layer} ${styles.compact} ${panelFullscreen ? styles.layerOut : styles.layerIn}`}
          aria-hidden={panelFullscreen}
        >
          <div className={panelStyles.body}>
            <div className={styles.compactHero}>
              <div className={styles.compactCoverWrap}>
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverSrc} alt="" className={styles.compactCover} />
                ) : (
                  <div className={styles.compactCoverPlaceholder} />
                )}
              </div>
              <div className={styles.compactMeta}>
                {isAd ? (
                  <h2 className={styles.compactTitle}>{currentTrack.title}</h2>
                ) : (
                  <TrackTitleLink
                    track={currentTrack}
                    catalog={queue}
                    className={styles.compactTitle}
                  />
                )}
                {!isAd && (
                  <TrackArtistLinks track={currentTrack} className={styles.compactArtists} />
                )}
              </div>
            </div>
            {!isAd && (
              <>
                <TrackCreditsCard track={currentTrack} />
                <QueuePreviewCard />
              </>
            )}
          </div>
        </div>

        <div
          className={`${styles.layer} ${styles.expanded} ${panelFullscreen ? styles.layerIn : styles.layerOut}`}
          aria-hidden={!panelFullscreen}
        >
          <div className={styles.expandedMain}>
            <div className={styles.expandedCanvas}>
              <div
                className={`${styles.heroCluster} ${lyricsOpen ? styles.heroClusterLeft : ""}`}
              >
                {coverSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverSrc} alt="" className={styles.expandedCover} />
                ) : (
                  <div className={styles.expandedCoverPlaceholder} />
                )}
                <div className={styles.expandedMeta}>
                  {isAd ? (
                    <h2 className={styles.expandedTitle}>{currentTrack.title}</h2>
                  ) : (
                    <TrackTitleLink
                      track={currentTrack}
                      catalog={queue}
                      className={styles.expandedTitle}
                    />
                  )}
                  {!isAd && (
                    <TrackArtistLinks track={currentTrack} className={styles.expandedArtists} />
                  )}
                </div>
              </div>

              <div
                className={`${styles.lyricsRail} ${styles.lyricsRailDocked} ${lyricsOpen ? styles.lyricsRailOpen : ""}`}
                aria-hidden={!lyricsOpen}
              >
                <div className={styles.lyricsRailInner}>
                  <PanelLyricsPane visible={lyricsOpen} />
                </div>
              </div>
            </div>

            {!isAd && (
              <div className={styles.expandedDock}>
                <div className={styles.expandedCards}>
                  <TrackCreditsCard track={currentTrack} />
                  <QueuePreviewCard />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
