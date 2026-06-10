"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";
import type { HomeCard } from "@/lib/home";
import { useSearch } from "@/context/SearchContext";
import { usePlayer } from "@/context/PlayerContext";
import { useHomeFeed } from "@/context/HomeFeedContext";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { HomeQuickGrid } from "@/components/Home/HomeQuickGrid";
import { HomeShelf } from "@/components/Home/HomeShelf";
import { HomePageSkeleton, SearchResultsSkeleton } from "@/components/Skeleton";
import s from "@/components/Home/home.module.scss";

export default function HomePage() {
  const { query } = useSearch();
  const { playTrack } = usePlayer();
  const { feed, loading, err } = useHomeFeed();
  const [searchTracks, setSearchTracks] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState("");

  const q = query.trim().toLowerCase();
  const isSearch = q.length > 0;

  useEffect(() => {
    if (!isSearch) return;
    setSearchLoading(true);
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
      .catch((e) => setSearchErr(e.message))
      .finally(() => setSearchLoading(false));
  }, [isSearch, q]);

  const playCard = useCallback(
    async (card: HomeCard) => {
      try {
        if (card.kind === "artist" && !card.trackIds?.length) {
          const slug = card.href.replace("/artists/", "").split("/")[0]!;
          const artist = await api<{ tracks: Track[] }>(`/api/artists/${slug}`);
          const tracks = [...artist.tracks].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
          if (tracks.length) playTrack(tracks[0]!, { queue: tracks, contextId: card.id });
          return;
        }
        if (!card.trackIds?.length) return;
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

  if (isSearch) {
    if (searchLoading) {
      return (
        <div className={s.dashboard}>
          <div className={s.searchBlock}>
            <SearchResultsSkeleton />
          </div>
        </div>
      );
    }
    if (searchErr) return <p className={s.error}>{searchErr}</p>;
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

  if (loading && !feed) return <HomePageSkeleton />;

  if (err && !feed) {
    return <p className={s.error}>{err}</p>;
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
