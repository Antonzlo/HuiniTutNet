"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, HeartIcon } from "@/components/icons";
import { usePlayer } from "@/context/PlayerContext";
import { mediaUrl } from "@/lib/api";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { fetchTrackLyrics, lyricsSourceLabel, type TrackLyrics } from "@/lib/lyrics";
import {
  activeIntroPauseIndex,
  activeLrcIndex,
  lastLyricIndex,
  nextLyricIndex,
  parseLrc,
  parsePlainLyrics,
  type LrcLine,
} from "@/lib/lrc";
import { TrackArtistLinks } from "@/components/TrackArtistLinks";
import { TrackTitleLink } from "@/components/TrackTitleLink";
import { LyricPause } from "./LyricPause";
import { PlayerControls } from "./PlayerControls";
import styles from "./NowPlaying.module.scss";

type Props = {
  open: boolean;
  onClose: () => void;
  fav: boolean;
  onToggleFav: () => void;
};

export function NowPlaying({ open, onClose, fav, onToggleFav }: Props) {
  const { currentTrack, isAd, currentTime, duration, seek, queue } = usePlayer();
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [meta, setMeta] = useState<TrackLyrics | null>(null);
  const [lyricsState, setLyricsState] = useState<"idle" | "loading" | "ready" | "missing">("idle");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [attrVisible, setAttrVisible] = useState(false);
  const [followLyrics, setFollowLyrics] = useState(true);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollingRef = useRef(false);

  const coverSrc = currentTrack?.coverUrl ? mediaUrl(currentTrack.coverUrl) : null;
  const { heroStyle } = useCoverGradient(coverSrc);
  const synced = meta?.synced ?? true;
  const activeIdx = useMemo(
    () => activeLrcIndex(lyrics, currentTime, synced),
    [lyrics, currentTime, synced]
  );
  const lastLineIdx = useMemo(() => lastLyricIndex(lyrics), [lyrics]);
  const introPauseIdx = useMemo(
    () => (synced ? activeIntroPauseIndex(lyrics, currentTime) : -1),
    [lyrics, currentTime, synced]
  );
  const introPause = introPauseIdx >= 0;
  const introUpcomingIdx = useMemo(
    () => (introPause ? nextLyricIndex(lyrics, introPauseIdx) : -1),
    [lyrics, introPause, introPauseIdx]
  );
  const scrollTargetIdx = introPause ? introPauseIdx : activeIdx;
  const lastScrollIdxRef = useRef(-1);

  const scrollToLine = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const container = lyricsScrollRef.current;
    const el = itemRefs.current[index];
    if (!container || !el) return;
    autoScrollingRef.current = true;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    const top =
      container.scrollTop + (eRect.top - cRect.top) - container.clientHeight / 2 + eRect.height / 2;
    container.scrollTo({ top: Math.max(0, top), behavior });
    window.setTimeout(() => {
      autoScrollingRef.current = false;
    }, behavior === "smooth" ? 500 : 50);
  }, []);

  const updateAttribution = useCallback(() => {
    const el = lyricsScrollRef.current;
    if (!el || !meta) {
      setAttrVisible(false);
      return;
    }
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = gap < 72;
    const nearEnd = lastLineIdx >= 0 && activeIdx >= lastLineIdx - 1;
    const trackEnding = duration > 0 && currentTime >= duration - 6;
    setAttrVisible(atBottom || nearEnd || trackEnding);
  }, [meta, lastLineIdx, activeIdx, duration, currentTime]);

  const detachFollow = useCallback(() => {
    if (!autoScrollingRef.current) setFollowLyrics(false);
  }, []);

  const resumeFollow = useCallback(() => {
    setFollowLyrics(true);
    lastScrollIdxRef.current = -1;
    if (scrollTargetIdx >= 0) scrollToLine(scrollTargetIdx);
  }, [scrollTargetIdx, scrollToLine]);

  const handleLineClick = useCallback(
    (line: LrcLine, index: number) => {
      if (!synced || line.pause) return;
      seek(line.time);
      setFollowLyrics(true);
      lastScrollIdxRef.current = -1;
      scrollToLine(index);
    },
    [synced, seek, scrollToLine]
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    setFollowLyrics(true);
    lastScrollIdxRef.current = -1;
  }, [currentTrack?.id, open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    setLyrics([]);
    setMeta(null);
    setLyricsState("idle");
    if (!currentTrack || isAd) return;

    let cancelled = false;
    setLyricsState("loading");

    fetchTrackLyrics(currentTrack.id)
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        const lines = data.synced ? parseLrc(data.lrc) : parsePlainLyrics(data.lrc);
        setLyrics(lines);
        setLyricsState(lines.length > 0 ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setLyricsState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, isAd]);

  useEffect(() => {
    if (!synced || scrollTargetIdx < 0 || !followLyrics) return;
    if (lastScrollIdxRef.current === scrollTargetIdx) return;
    lastScrollIdxRef.current = scrollTargetIdx;
    scrollToLine(scrollTargetIdx);
  }, [scrollTargetIdx, synced, followLyrics, scrollToLine]);

  useEffect(() => {
    updateAttribution();
  }, [updateAttribution, lyrics, open]);

  if (!mounted || !open || !currentTrack) return null;

  const sourceLabel = meta ? lyricsSourceLabel(meta.source) : "";
  const heroOnly = lyrics.length === 0;

  return createPortal(
    <div className={`${styles.overlay} ${visible ? styles.open : ""}`} role="dialog" aria-modal>
      <div className={styles.bgBlur} style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined} />
      <div className={styles.bgGradient} style={heroStyle} />
      <div className={styles.bgVignette} />

      <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Свернуть">
        <ChevronDownIcon tone="primary" size={28} />
      </button>

      <div className={`${styles.content} ${heroOnly ? styles.contentNoLyrics : ""}`}>
        <div className={`${styles.top} ${heroOnly ? styles.topHero : ""}`}>
          <div key={currentTrack.id} className={styles.coverWrap}>
            {coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt="" className={styles.cover} />
            ) : (
              <div className={styles.coverPlaceholder} />
            )}
          </div>
          <div className={styles.meta}>
            {isAd && <span className={styles.adBadge}>Реклама</span>}
            {isAd ? (
              <h2 className={styles.title}>{currentTrack.title}</h2>
            ) : (
              <TrackTitleLink
                track={currentTrack}
                catalog={queue}
                className={styles.title}
                onNavigate={onClose}
              />
            )}
            <div className={styles.subRow}>
              {!isAd ? (
                <TrackArtistLinks track={currentTrack} onNavigate={onClose} className={styles.artistLinks} />
              ) : (
                <span className={styles.adArtist}>Реклама</span>
              )}
              <button
                type="button"
                className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
                onClick={onToggleFav}
                disabled={isAd}
                aria-label="Избранное"
              >
                <HeartIcon filled={fav} size={18} />
              </button>
            </div>
          </div>
        </div>

        {!heroOnly && (
        <div className={styles.lyricsPane}>
            <>
              {synced && !followLyrics && (
                <button type="button" className={styles.followBtn} onClick={resumeFollow}>
                  К текущей строке
                </button>
              )}
              <div
                ref={lyricsScrollRef}
                className={`${styles.lyrics} ${!followLyrics ? styles.lyricsDetached : ""}`}
                onScroll={() => {
                  updateAttribution();
                  detachFollow();
                }}
                onWheel={detachFollow}
                onTouchStart={detachFollow}
              >
                <div className={styles.lyricsInner}>
                  {lyrics.map((line, i) => {
                    if (line.pause) {
                      return (
                        <div
                          key={`pause-${line.time}-${i}`}
                          ref={(el) => {
                            itemRefs.current[i] = el;
                          }}
                          className={`${styles.lyricPauseRow} ${
                            i === introPauseIdx ? styles.lyricPauseActive : ""
                          }`}
                        >
                          <LyricPause
                            line={line}
                            active={i === introPauseIdx}
                            currentTime={currentTime}
                            onSeek={(t) => {
                              seek(t);
                              setFollowLyrics(true);
                              lastScrollIdxRef.current = -1;
                              scrollToLine(i);
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`${line.time}-${i}`}
                        type="button"
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        className={`${styles.lyricLine} ${!synced ? styles.lyricPlain : ""} ${
                          synced && !introPause && i === activeIdx ? styles.lyricActive : ""
                        } ${synced && introPause && i === introUpcomingIdx ? styles.lyricUpcoming : ""} ${
                          synced && activeIdx >= 0 && i < activeIdx ? styles.lyricPast : ""
                        }`}
                        onClick={() => handleLineClick(line, i)}
                        disabled={!synced}
                      >
                        {line.text}
                      </button>
                    );
                  })}
                  {meta && (
                    <footer
                      className={`${styles.attribution} ${attrVisible ? styles.attributionVisible : ""}`}
                      aria-hidden={!attrVisible}
                    >
                      <p className={styles.attributionAuthors}>Авторы: {meta.authors}</p>
                      <p className={styles.attributionSource}>
                        Источник:{" "}
                        {meta.source === "lrclib" ? (
                          <a
                            href="https://lrclib.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.attributionLink}
                          >
                            {sourceLabel}
                          </a>
                        ) : (
                          <span>{sourceLabel}</span>
                        )}
                      </p>
                    </footer>
                  )}
                </div>
              </div>
            </>
        </div>
        )}

        <div className={styles.bottom}>
          <PlayerControls size="lg" />
        </div>
      </div>
    </div>,
    document.body
  );
}
