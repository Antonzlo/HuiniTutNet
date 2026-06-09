"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";
import { fmtTotalDuration, totalDurationSec } from "@/lib/track";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
import { useAuth } from "@/context/AuthContext";
import home from "../home.module.scss";

const FAVORITES_CONTEXT = "playlist:favorites";

export default function FavoritesPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    api<Track[]>("/api/favorites")
      .then(setTracks)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalSec = totalDurationSec(tracks);
  const initial = user?.displayName?.[0]?.toUpperCase() ?? "♥";

  return (
    <div className={home.page}>
      <div className={home.hero}>
        <div className={home.cover} aria-hidden>♥</div>
        <div className={home.heroMeta}>
          <span className={home.badge}>Плейлист</span>
          <h1 className={home.title}>Избранное</h1>
          <div className={home.stats}>
            {user && (
              <>
                <span className={home.avatar}>{initial}</span>
                <span>{user.displayName}</span>
                <span>·</span>
              </>
            )}
            <span>
              {tracks.length} {tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков"}
            </span>
            {totalSec > 0 && (
              <>
                <span>,</span>
                <span>{fmtTotalDuration(totalSec)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={home.toolbar}>
        <PlayCollectionButton
          tracks={tracks}
          contextId={FAVORITES_CONTEXT}
          className={home.playBtn}
        />
      </div>
      {err && <div className={home.error}>{err}</div>}
      <HiuniTrackList
        tracks={tracks}
        loading={loading}
        variant="playlist"
        playContextId={FAVORITES_CONTEXT}
        emptyMessage="Избранное пусто"
        onTrackDeleted={(id) => setTracks((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
