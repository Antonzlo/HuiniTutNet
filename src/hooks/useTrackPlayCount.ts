"use client";

import { useEffect, useState } from "react";
import type { Track } from "@/lib/types";

export function trackPlayCount(track: Track): number {
  return track.playCount ?? 0;
}

export function useTrackPlayCount(track: Track): number {
  const base = trackPlayCount(track);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    const onCounted = (e: Event) => {
      const id = (e as CustomEvent<{ trackId: string }>).detail?.trackId;
      if (id === track.id) setBump((n) => n + 1);
    };
    window.addEventListener("hiuni:play-counted", onCounted);
    return () => window.removeEventListener("hiuni:play-counted", onCounted);
  }, [track.id]);

  return base + bump;
}
