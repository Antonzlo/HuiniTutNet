"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useTrackLyrics } from "@/hooks/useTrackLyrics";
import { lyricsSourceLabel } from "@/lib/lyrics";
import { LyricPause } from "@/components/PlayerBar/LyricPause";
import { LyricsPlaceholder } from "@/components/PlayerBar/LyricsPlaceholder";
import styles from "./PanelLyricsPane.module.scss";

const RESUME_FOLLOW_MS = 2500;

type Props = {
  visible?: boolean;
};

export function PanelLyricsPane({ visible = true }: Props) {
  const { currentTrack, isAd, currentTime, duration, seek } = usePlayer();
  const [attrVisible, setAttrVisible] = useState(false);
  const [followLyrics, setFollowLyrics] = useState(true);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const autoScrollingRef = useRef(false);
  const lastScrollIdxRef = useRef(-1);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    lyrics,
    meta,
    state: lyricsState,
    synced,
    activeIdx,
    lastLineIdx,
    introPauseIdx,
    introPause,
    introUpcomingIdx,
    scrollTargetIdx,
  } = useTrackLyrics(currentTrack?.id, Boolean(isAd), currentTime);

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

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const resumeFollow = useCallback(() => {
    setFollowLyrics(true);
    lastScrollIdxRef.current = -1;
    if (scrollTargetIdx >= 0) scrollToLine(scrollTargetIdx);
  }, [scrollTargetIdx, scrollToLine]);

  const scheduleResumeFollow = useCallback(() => {
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      resumeFollow();
    }, RESUME_FOLLOW_MS);
  }, [clearResumeTimer, resumeFollow]);

  const detachFollow = useCallback(() => {
    if (autoScrollingRef.current) return;
    setFollowLyrics(false);
    scheduleResumeFollow();
  }, [scheduleResumeFollow]);

  const handleLineClick = useCallback(
    (line: { pause?: boolean; time: number }, index: number) => {
      if (!synced || line.pause) return;
      clearResumeTimer();
      seek(line.time);
      setFollowLyrics(true);
      lastScrollIdxRef.current = -1;
      scrollToLine(index);
    },
    [synced, seek, scrollToLine, clearResumeTimer]
  );

  useEffect(() => {
    setFollowLyrics(true);
    lastScrollIdxRef.current = -1;
    clearResumeTimer();
  }, [currentTrack?.id, clearResumeTimer]);

  useEffect(() => {
    if (!visible || !synced || scrollTargetIdx < 0 || !followLyrics) return;
    if (lastScrollIdxRef.current === scrollTargetIdx) return;
    lastScrollIdxRef.current = scrollTargetIdx;
    scrollToLine(scrollTargetIdx);
  }, [scrollTargetIdx, synced, followLyrics, scrollToLine, visible]);

  useEffect(() => {
    updateAttribution();
  }, [updateAttribution, lyrics, visible]);

  useEffect(() => clearResumeTimer, [clearResumeTimer]);

  if (!currentTrack || isAd) return null;

  const sourceLabel = meta ? lyricsSourceLabel(meta.source) : "";

  if (lyricsState === "loading" || lyricsState === "missing") {
    return (
      <div className={styles.wrap}>
        <LyricsPlaceholder variant={lyricsState === "loading" ? "loading" : "missing"} />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={lyricsScrollRef}
        className={styles.scroll}
        onScroll={() => {
          updateAttribution();
          detachFollow();
        }}
        onWheel={detachFollow}
        onTouchStart={detachFollow}
        onMouseLeave={() => {
          if (!followLyrics) scheduleResumeFollow();
        }}
      >
        <div className={styles.inner}>
          {lyrics.map((line, i) => {
            if (line.pause) {
              return (
                <div
                  key={`pause-${line.time}-${i}`}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className={`${styles.pauseRow} ${i === introPauseIdx ? styles.pauseActive : ""}`}
                >
                  <LyricPause
                    line={line}
                    active={i === introPauseIdx}
                    currentTime={currentTime}
                    onSeek={(t) => {
                      clearResumeTimer();
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
                className={`${styles.line} ${!synced ? styles.linePlain : ""} ${
                  synced && !introPause && i === activeIdx ? styles.lineActive : ""
                } ${synced && introPause && i === introUpcomingIdx ? styles.lineUpcoming : ""} ${
                  synced && activeIdx >= 0 && i < activeIdx ? styles.linePast : ""
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
    </div>
  );
}
