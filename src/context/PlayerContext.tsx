"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, mediaUrl } from "@/lib/api";
import { fetchAutoplayTracks } from "@/lib/autoplay";
import {
  ADS_ENABLED,
  AD_INTERVAL_SEC,
  adToTrack,
  pickRandomAd,
  type WeeklyAd,
} from "@/lib/ads";
import type { Track } from "@/lib/types";

type ResumeSlot = { queue: Track[]; index: number };

type PlayOpts = { queue?: Track[]; contextId?: string | null };

type PlayerState = {
  currentTrack: Track | null;
  queue: Track[];
  radioFromIndex: number | null;
  queueContextId: string | null;
  isPlaying: boolean;
  isAd: boolean;
  secondsUntilAd: number;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playTrack: (track: Track, opts?: PlayOpts) => void;
  playFromQueue: (trackId: string) => void;
  addToQueue: (track: Track) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
};

const Ctx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const currentRef = useRef<Track | null>(null);
  const adsRef = useRef<WeeklyAd[]>([]);
  const listenSecRef = useRef(0);
  const adDueRef = useRef(false);
  const lastTickRef = useRef<number | null>(null);
  const playListenSecRef = useRef(0);
  const playListenLastRef = useRef<number | null>(null);
  const playCountedRef = useRef<Set<string>>(new Set());
  const resumeRef = useRef<ResumeSlot | null>(null);
  const isPlayingRef = useRef(false);
  const radioFromIndexRef = useRef<number | null>(null);
  const autoplayFetchingRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [radioFromIndex, setRadioFromIndex] = useState<number | null>(null);
  const [queueContextId, setQueueContextId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const [secondsUntilAd, setSecondsUntilAd] = useState(AD_INTERVAL_SEC);

  const syncListenUi = useCallback(() => {
    setSecondsUntilAd(Math.max(0, Math.ceil(AD_INTERVAL_SEC - listenSecRef.current)));
  }, []);

  const resetPlayListen = useCallback(() => {
    playListenSecRef.current = 0;
    playListenLastRef.current = null;
  }, []);

  const loadSrc = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = mediaUrl(track.filePath);
    lastTickRef.current = null;
    resetPlayListen();
  }, [resetPlayListen]);

  const playInternal = useCallback((track: Track, q?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    currentRef.current = track;
    setCurrentTrack(track);
    if (q) {
      queueRef.current = q;
      setQueue(q);
    }
    loadSrc(track);
    void audio.play().then(() => {
      setIsPlaying(true);
      isPlayingRef.current = true;
    }).catch(() => {
      setIsPlaying(false);
      isPlayingRef.current = false;
    });
  }, [loadSrc]);

  const appendAutoplayTracks = useCallback((tracks: Track[]) => {
    if (!tracks.length) return false;
    const q = queueRef.current;
    const existing = new Set(q.map((t) => t.id));
    const fresh = tracks.filter((t) => !existing.has(t.id));
    if (!fresh.length) return false;
    if (radioFromIndexRef.current === null) {
      radioFromIndexRef.current = q.length;
      setRadioFromIndex(q.length);
    }
    const next = [...q, ...fresh];
    queueRef.current = next;
    setQueue(next);
    return true;
  }, []);

  const ensureAutoplayAhead = useCallback(async () => {
    const cur = currentRef.current;
    if (!cur || cur.isAd || autoplayFetchingRef.current) return;
    const q = queueRef.current;
    const i = q.findIndex((t) => t.id === cur.id);
    if (i < 0) return;
    if (q.length - i - 1 > 2) return;

    autoplayFetchingRef.current = true;
    try {
      const tracks = await fetchAutoplayTracks(
        cur.id,
        q.map((t) => t.id)
      );
      appendAutoplayTracks(tracks);
    } finally {
      autoplayFetchingRef.current = false;
    }
  }, [appendAutoplayTracks]);

  const continueWithAutoplay = useCallback(async () => {
    const cur = currentRef.current;
    if (!cur || cur.isAd || autoplayFetchingRef.current) return false;

    autoplayFetchingRef.current = true;
    try {
      const tracks = await fetchAutoplayTracks(
        cur.id,
        queueRef.current.map((t) => t.id)
      );
      if (!appendAutoplayTracks(tracks)) return false;
      const q = queueRef.current;
      const i = q.findIndex((t) => t.id === cur.id);
      const next = q[i + 1];
      if (next && !next.isAd) {
        playInternal(next, q);
        void ensureAutoplayAhead();
        return true;
      }
    } finally {
      autoplayFetchingRef.current = false;
    }
    return false;
  }, [appendAutoplayTracks, playInternal, ensureAutoplayAhead]);

  const playNextMusic = useCallback(() => {
    const cur = currentRef.current;
    const q = queueRef.current;
    if (!cur || cur.isAd || q.length === 0) return;
    const i = q.findIndex((t) => t.id === cur.id);
    const next = q[i + 1];
    if (next && !next.isAd) {
      playInternal(next, q);
      void ensureAutoplayAhead();
      return;
    }
    void continueWithAutoplay();
  }, [playInternal, ensureAutoplayAhead, continueWithAutoplay]);

  const playAd = useCallback((ad: WeeklyAd) => {
    playInternal(adToTrack(ad));
  }, [playInternal]);

  const handleEnded = useCallback(() => {
    const cur = currentRef.current;
    setIsPlaying(false);
    isPlayingRef.current = false;

    if (cur?.isAd) {
      const slot = resumeRef.current;
      resumeRef.current = null;
      if (slot && slot.queue[slot.index] && !slot.queue[slot.index].isAd) {
        playInternal(slot.queue[slot.index], slot.queue);
      }
      return;
    }

    if (ADS_ENABLED && adDueRef.current) {
      const ad = pickRandomAd(adsRef.current);
      adDueRef.current = false;
      listenSecRef.current = 0;
      syncListenUi();

      if (ad && cur) {
        const q = queueRef.current;
        const i = q.findIndex((t) => t.id === cur.id);
        resumeRef.current = { queue: q, index: i + 1 };
        playAd(ad);
        return;
      }
    }

    playNextMusic();
  }, [playInternal, playAd, playNextMusic, syncListenUi]);

  const tickPlayCount = useCallback((audio: HTMLAudioElement) => {
    const cur = currentRef.current;
    if (!isPlayingRef.current || !cur || cur.isAd || playCountedRef.current.has(cur.id)) {
      playListenLastRef.current = null;
      return;
    }
    const t = audio.currentTime;
    if (playListenLastRef.current !== null) {
      const delta = t - playListenLastRef.current;
      if (delta > 0 && delta < 1.5) playListenSecRef.current += delta;
    }
    playListenLastRef.current = t;
    const dur = audio.duration;
    if (!dur || dur < 1) return;
    if (playListenSecRef.current >= dur * 0.6) {
      playCountedRef.current.add(cur.id);
      void api(`/api/tracks/${cur.id}/listen`, { method: "POST" })
        .then(() => {
          window.dispatchEvent(new CustomEvent("hiuni:play-counted", { detail: { trackId: cur.id } }));
        })
        .catch(() => {
          playCountedRef.current.delete(cur.id);
        });
    }
  }, []);

  const tickListen = useCallback((audio: HTMLAudioElement) => {
    const cur = currentRef.current;
    if (!ADS_ENABLED || !isPlayingRef.current || !cur || cur.isAd) {
      lastTickRef.current = null;
      return;
    }

    const t = audio.currentTime;
    if (lastTickRef.current !== null) {
      const delta = t - lastTickRef.current;
      if (delta > 0 && delta < 1.5) {
        listenSecRef.current += delta;
        if (listenSecRef.current >= AD_INTERVAL_SEC) {
          adDueRef.current = true;
        }
        syncListenUi();
      }
    }
    lastTickRef.current = t;
  }, [syncListenUi]);

  useEffect(() => {
    if (!ADS_ENABLED) return;
    api<WeeklyAd[]>("/api/ads/current", { auth: false })
      .then((a) => {
        adsRef.current = a;
      })
      .catch(() => {});

    const iv = setInterval(() => {
      api<WeeklyAd[]>("/api/ads/current", { auth: false })
        .then((a) => {
          adsRef.current = a;
        })
        .catch(() => {});
    }, 120_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      tickListen(audio);
      tickPlayCount(audio);
    };
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => handleEnded();

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audioRef.current = null;
    };
  }, [handleEnded, tickListen, tickPlayCount]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    if (currentTrack && !currentTrack.isAd) {
      void ensureAutoplayAhead();
    }
  }, [currentTrack?.id, ensureAutoplayAhead]);

  const playTrack = useCallback((track: Track, opts?: PlayOpts) => {
    if (opts?.contextId !== undefined) setQueueContextId(opts.contextId);
    radioFromIndexRef.current = null;
    setRadioFromIndex(null);
    const q = opts?.queue ?? [track];
    playInternal(track, q);
    void ensureAutoplayAhead();
  }, [playInternal, ensureAutoplayAhead]);

  const playFromQueue = useCallback((trackId: string) => {
    const q = queueRef.current;
    const t = q.find((x) => x.id === trackId);
    if (t && !t.isAd) playInternal(t, q);
  }, [playInternal]);

  const addToQueue = useCallback((track: Track) => {
    if (track.isAd) return;
    const q = queueRef.current;
    if (q.some((t) => t.id === track.id)) return;
    const next = [...q, track];
    queueRef.current = next;
    setQueue(next);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      lastTickRef.current = null;
      playListenLastRef.current = null;
    } else {
      void audio.play().then(() => {
        setIsPlaying(true);
        isPlayingRef.current = true;
      });
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
    lastTickRef.current = time;
    playListenLastRef.current = time;
  }, []);

  const playNext = useCallback(() => {
    const cur = currentRef.current;
    if (!cur || cur.isAd) return;
    playNextMusic();
  }, [playNextMusic]);

  const playPrev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || currentRef.current?.isAd) return;
    if (audio.currentTime > 3) {
      seek(0);
      return;
    }
    const cur = currentRef.current;
    const q = queueRef.current;
    if (!cur || q.length === 0) return;
    const i = q.findIndex((t) => t.id === cur.id);
    const prev = q[i - 1];
    if (prev && !prev.isAd) playInternal(prev, q);
  }, [playInternal, seek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isAd = Boolean(currentTrack?.isAd);

  return (
    <Ctx.Provider
      value={{
        currentTrack,
        queue,
        radioFromIndex,
        queueContextId,
        isPlaying,
        isAd,
        secondsUntilAd,
        progress,
        currentTime,
        duration,
        volume,
        muted,
        playTrack,
        playFromQueue,
        addToQueue,
        togglePlay,
        playNext,
        playPrev,
        seek,
        setVolume: (v) => setVolumeState(Math.min(1, Math.max(0, v))),
        toggleMute: () => setMuted((m) => !m),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer outside PlayerProvider");
  return ctx;
}
