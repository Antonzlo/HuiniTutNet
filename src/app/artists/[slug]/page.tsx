"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { fetchCached, getCached } from "@/lib/queryCache";
import type { Artist, Track } from "@/lib/types";
import { fmtTotalDuration, totalDurationSec } from "@/lib/track";
import {
  buildArtistReleases,
  filterArtistReleases,
  releaseLatestAt,
  releaseShelfCover,
  releaseUrl,
  shelfReleaseTypeLabel,
} from "@/lib/release";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { ShuffleIcon } from "@/components/icons";
import overlay from "@/components/ShelfPlayOverlay/ShelfPlayOverlay.module.scss";
import { ShelfPlayOverlay } from "@/components/ShelfPlayOverlay/ShelfPlayOverlay";
import { RelatedArtistCard } from "@/components/ArtistShelfCard/RelatedArtistCard";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
import { CollectionPageSkeleton } from "@/components/Skeleton";
import s from "./artist.module.scss";

type ArtistDetail = Artist & {
  tracks: Track[];
  following?: boolean;
  owner?: { username: string; displayName: string };
};

export default function ArtistPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [related, setRelated] = useState<Artist[]>([]);
  const [err, setErr] = useState("");
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [following, setFollowing] = useState(false);
  const [releaseTab, setReleaseTab] = useState<"popular" | "albums" | "singles">("popular");
  const [showAllReleases, setShowAllReleases] = useState(false);

  async function toggleFollow() {
    if (!slug) return;
    try {
      if (following) {
        await api(`/api/artists/${slug}/follow`, { method: "DELETE" });
        setFollowing(false);
      } else {
        await api(`/api/artists/${slug}/follow`, { method: "POST" });
        setFollowing(true);
        window.dispatchEvent(new CustomEvent("hiuni:home-invalidate"));
      }
    } catch {
      /* ignore */
    }
  }

  useLayoutEffect(() => {
    if (!slug) return;
    const cachedArtist = getCached<ArtistDetail>(`artist:${slug}`, 30 * 60_000);
    const cachedRelated = getCached<Artist[]>(`artist-related:${slug}`, 30 * 60_000);
    if (cachedArtist) {
      setArtist(cachedArtist);
      setFollowing(Boolean(cachedArtist.following));
    }
    if (cachedRelated) setRelated(cachedRelated);
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setErr("");

    fetchCached(
      `artist:${slug}`,
      30 * 60_000,
      () => api<ArtistDetail>(`/api/artists/${slug}`),
      { revalidate: Boolean(getCached(`artist:${slug}`, 30 * 60_000)) }
    )
      .then((a) => {
        setArtist(a);
        setFollowing(Boolean(a.following));
      })
      .catch((e) => {
        if (!getCached(`artist:${slug}`, 30 * 60_000)) setErr(e.message);
      });

    fetchCached(
      `artist-related:${slug}`,
      30 * 60_000,
      () => api<Artist[]>(`/api/artists/${slug}/related`, { auth: false }),
      { revalidate: Boolean(getCached(`artist-related:${slug}`, 30 * 60_000)) }
    )
      .then(setRelated)
      .catch(() => {});
  }, [slug]);

  const tracks = useMemo(() => {
    if (!artist) return [];
    return artist.tracks.map((t) => ({
      ...t,
      artist: t.artist?.id ? t.artist : { name: artist.name, slug: slug! },
    }));
  }, [artist, slug]);

  const popular = useMemo(
    () =>
      [...tracks].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0)),
    [tracks]
  );

  const allReleases = useMemo(() => buildArtistReleases(tracks), [tracks]);
  const filteredReleases = useMemo(
    () => filterArtistReleases(allReleases, releaseTab),
    [allReleases, releaseTab]
  );
  const latestReleaseKey = useMemo(() => {
    let key: string | null = null;
    let best = 0;
    for (const r of allReleases) {
      const at = releaseLatestAt(r);
      if (at > best) {
        best = at;
        key = r.key;
      }
    }
    return key;
  }, [allReleases]);

  const heroCoverUrl = useMemo(() => {
    const fromPopular = popular.find((t) => t.coverUrl)?.coverUrl;
    const fromAny = tracks.find((t) => t.coverUrl)?.coverUrl;
    const fromRelease = allReleases.map(releaseShelfCover).find(Boolean);
    return fromPopular ?? fromRelease ?? fromAny ?? artist?.imageUrl ?? artist?.avatarUrl ?? null;
  }, [popular, tracks, allReleases, artist?.imageUrl, artist?.avatarUrl]);

  const coverSrc = heroCoverUrl ? mediaUrl(heroCoverUrl, { w: 512 }) : null;
  const { heroStyle } = useCoverGradient(coverSrc);
  const totalSec = totalDurationSec(tracks);
  const initial = artist?.name?.[0]?.toUpperCase() ?? "?";
  const visibleLimit = showAllTracks ? undefined : 5;

  function handleDeleted(id: string) {
    setArtist((prev) => {
      if (!prev) return prev;
      const nextTracks = prev.tracks.filter((t) => t.id !== id);
      if (nextTracks.length === 0) router.push("/artists");
      return { ...prev, tracks: nextTracks };
    });
  }

  if (err) return <div className={s.error}>{err}</div>;
  if (!artist) return <CollectionPageSkeleton variant="artist" />;

  return (
    <div className={s.page}>
      <div className={s.hero} style={heroStyle}>
        {coverSrc && (
          <div
            className={s.heroBg}
            style={{ backgroundImage: `url(${coverSrc})` }}
            aria-hidden
          />
        )}
        <div className={s.heroInner}>
          <div className={s.avatar}>
            {heroCoverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl(heroCoverUrl)} alt="" className={s.avatarImg} />
            ) : (
              initial
            )}
          </div>
          <div className={s.meta}>
            <span className={s.badge}>Исполнитель</span>
            <h1 className={s.name}>{artist.name}</h1>
            <div className={s.stats}>
              {tracks.length} {tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков"}
              {totalSec > 0 && ` · ${fmtTotalDuration(totalSec)}`}
            </div>
          </div>
        </div>
      </div>

      <div className={s.toolbar}>
        <PlayCollectionButton
          tracks={popular}
          contextId={slug ? `artist:${slug}:popular` : null}
          className={s.playBtn}
          disabled={tracks.length === 0}
        />
        <button type="button" className={s.iconBtn} disabled aria-label="Shuffle">
          <ShuffleIcon tone="muted" size={22} />
        </button>
        <button
          type="button"
          className={`${s.followBtn} ${following ? s.followBtnActive : ""}`}
          onClick={toggleFollow}
        >
          {following ? "Подписка оформлена" : "Подписаться"}
        </button>
      </div>

      <div className={s.main}>
        <section className={s.popular}>
          <h2 className={s.sectionTitle}>Популярные треки</h2>
          <HiuniTrackList
            tracks={popular}
            catalog={tracks}
            variant="playlist"
            hideArtist
            limit={visibleLimit}
            emptyMessage="Треков пока нет"
            onTrackDeleted={handleDeleted}
          />
          {popular.length > 5 && !showAllTracks && (
            <button type="button" className={s.moreLink} onClick={() => setShowAllTracks(true)}>
              Ещё
            </button>
          )}
        </section>

        <aside className={s.sidebar}>
          {artist.bio && (
            <div className={s.card}>
              <div className={s.cardTitle}>Об исполнителе</div>
              <p className={s.cardText}>{artist.bio}</p>
            </div>
          )}
          <div className={s.card}>
            <div className={s.cardTitle}>В библиотеке</div>
            <div className={s.cardStat}>{tracks.length}</div>
            <div className={s.cardSub}>
              {tracks.length === 1 ? "трек" : tracks.length < 5 ? "трека" : "треков"}
              {artist.owner && ` · загрузил ${artist.owner.displayName}`}
            </div>
          </div>
        </aside>
      </div>

      {allReleases.length > 0 && (
        <section className={s.music}>
          <div className={s.musicHead}>
            <h2 className={s.sectionTitle}>Музыка</h2>
            {!showAllReleases && filteredReleases.length > 6 && (
              <button type="button" className={s.showAllBtn} onClick={() => setShowAllReleases(true)}>
                Показать все
              </button>
            )}
            {showAllReleases && (
              <button type="button" className={s.showAllBtn} onClick={() => setShowAllReleases(false)}>
                Свернуть
              </button>
            )}
          </div>
          <div className={s.tabs}>
            <button
              type="button"
              className={`${s.tab} ${releaseTab === "popular" ? s.active : ""}`}
              onClick={() => setReleaseTab("popular")}
            >
              Популярные релизы
            </button>
            <button
              type="button"
              className={`${s.tab} ${releaseTab === "albums" ? s.active : ""}`}
              onClick={() => setReleaseTab("albums")}
            >
              Альбомы
            </button>
            <button
              type="button"
              className={`${s.tab} ${releaseTab === "singles" ? s.active : ""}`}
              onClick={() => setReleaseTab("singles")}
            >
              Синглы и EP
            </button>
          </div>
          <div className={showAllReleases ? s.releaseGrid : s.releaseRow}>
            {filteredReleases.map((r) => {
              const cover = releaseShelfCover(r);
              const isLatest = releaseTab === "popular" && r.key === latestReleaseKey;
              return (
                <Link
                  key={r.key}
                  href={releaseUrl(slug!, r)}
                  className={`${s.releaseCard} ${overlay.shelfCard}`}
                >
                  <div className={`${s.releaseCover} ${overlay.coverWrap}`}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediaUrl(cover)} alt="" className={s.releaseImg} />
                    ) : null}
                    <ShelfPlayOverlay
                      tracks={r.tracks}
                      contextId={`release:${r.key}`}
                      aria-label={`Играть ${r.title}`}
                    />
                  </div>
                  <div className={s.releaseTitle}>{r.title}</div>
                  {isLatest ? (
                    <>
                      <div className={s.releaseMeta}>Последний релиз</div>
                      <div className={s.releaseMetaSub}>{shelfReleaseTypeLabel(r)}</div>
                    </>
                  ) : (
                    <div className={s.releaseMeta}>
                      {r.year ? `${r.year} · ` : ""}
                      {shelfReleaseTypeLabel(r)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className={s.related}>
          <h2 className={s.sectionTitle}>Похожие исполнители</h2>
          <div className={s.relatedGrid}>
            {related.map((a) => (
              <RelatedArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
