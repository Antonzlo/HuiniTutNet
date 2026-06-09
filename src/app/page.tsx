"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";
import type { HomeFeed, HomeCard } from "@/lib/home";
import { useSearch } from "@/context/SearchContext";
import { usePlayer } from "@/context/PlayerContext";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { HomeQuickGrid } from "@/components/Home/HomeQuickGrid";
import { HomeShelf } from "@/components/Home/HomeShelf";
import s from "@/components/Home/home.module.scss";

export default function HomePage() {
  const { query } = useSearch();
  const { playTrack } = usePlayer();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const q = query.trim().toLowerCase();
  const isSearch = q.length > 0;

  useEffect(() => {
    if (isSearch) {
      setLoading(true);
      api<Track[]>("/api/tracks", { auth: false })
        .then((tracks) => {
          setSearchTracks(
            tracks.filter(
              (t) =>
                t.title.toLowerCase().includes(q) ||
                t.artist.name.toLowerCase().includes(q) ||
                (t.album?.toLowerCase().includes(q) ?? false)
            )
          );
        })
        .catch((e) => setErr(e.message))
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    api<HomeFeed>("/api/home")
      .then(setFeed)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [isSearch, q]);

  const playCard = useCallback(
    async (card: HomeCard) => {
      if (!card.trackIds?.length) return;
      try {
        const tracks = await Promise.all(
          card.trackIds.map((id) => api<Track>(`/api/tracks/${id}`))
        );
        tracks.sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
        if (tracks.length) {
          playTrack(tracks[0]!, { queue: tracks, contextId: card.id });
        }
      } catch {
        /* ignore */
      }
    },
    [playTrack]
  );

  const searchTitle = useMemo(() => `Результаты поиска`, []);

  if (loading) {
    return <p className={s.empty}>Загрузка…</p>;
  }

  if (err) {
    return <p className={s.error}>{err}</p>;
  }

  if (isSearch) {
    return (
      <div className={s.dashboard}>
        <div className={s.searchBlock}>
          <h1 className={s.searchTitle}>{searchTitle}</h1>
          {searchTracks.length === 0 ? (
            <p className={s.empty}>Ничего не найдено</p>
          ) : (
            <HiuniTrackList tracks={searchTracks} variant="playlist" />
          )}
        </div>
      </div>
    );
  }

  if (!feed) {
    return <p className={s.empty}>Нет данных</p>;
  }

  return (
    <div className={s.dashboard}>
      <h1 className={s.greeting}>{feed.greeting}</h1>
      {feed.sections.map((section) =>
        section.layout === "quick" ? (
          <HomeQuickGrid key={section.id} items={section.items} />
        ) : (
          <HomeShelf key={section.id} section={section} onPlay={playCard} />
        )
      )}
    </div>
  );
}
