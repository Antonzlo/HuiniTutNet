"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTrackLyrics, type TrackLyrics } from "@/lib/lyrics";
import {
  activeIntroPauseIndex,
  activeLrcIndex,
  lastLyricIndex,
  nextLyricIndex,
  parseLrc,
  parsePlainLyrics,
  type LrcLine,
} from "@/lib/lrc";

export function useTrackLyrics(trackId: string | undefined, isAd: boolean, currentTime: number) {
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [meta, setMeta] = useState<TrackLyrics | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "missing">("idle");

  useEffect(() => {
    setLyrics([]);
    setMeta(null);
    setState("idle");
    if (!trackId || isAd) return;

    let cancelled = false;
    setState("loading");

    fetchTrackLyrics(trackId)
      .then((data) => {
        if (cancelled) return;
        setMeta(data);
        const lines = data.synced ? parseLrc(data.lrc) : parsePlainLyrics(data.lrc);
        setLyrics(lines);
        setState(lines.length > 0 ? "ready" : "missing");
      })
      .catch(() => {
        if (!cancelled) setState("missing");
      });

    return () => {
      cancelled = true;
    };
  }, [trackId, isAd]);

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

  return {
    lyrics,
    meta,
    state,
    synced,
    activeIdx,
    lastLineIdx,
    introPauseIdx,
    introPause,
    introUpcomingIdx,
    scrollTargetIdx,
  };
}
