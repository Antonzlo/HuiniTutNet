"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import type { Artist, Track } from "@/lib/types";
import { fmtTotalDuration, totalDurationSec } from "@/lib/track";
import { groupReleases, releaseUrl } from "@/lib/release";
import { useCoverGradient } from "@/hooks/useCoverGradient";
import { HiuniTrackList } from "@/components/TrackList/HiuniTrackList";
import { ArtistAvatar } from "@/components/ArtistAvatar/ArtistAvatar";
import { ShuffleIcon } from "@/components/icons";
import { PlayCollectionButton } from "@/components/PlayCollectionButton";
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
  const [releaseTab, setReleaseTab] = useState<"popular" | "singles">("popular");
  const [following, setFollowing] = useState(false);

  async function toggleFollow() {
    if (!slug) return;
    try {
      if (following) {
        await api(`/api/artists/${slug}/follow`, { method: "DELETE" });
        setFollowing(false);
      } else {
        await api(`/api/artists/${slug}/follow`, { method: "POST" });
        setFollowing(true);
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      api<ArtistDetail>(`/api/artists/${slug}`),
      api<Artist[]>(`/api/artists`, { auth: false }),
    ])
      .then(([a, all]) => {
        setArtist(a);
        setFollowing(Boolean(a.following));
        setRelated(
          all
            .filter((x) => x.slug !== slug)
            .sort((x, y) => (y._count?.tracks ?? 0) - (x._count?.tracks ?? 0))
            .slice(0, 11)
        );
      })
      .catch((e) => setErr(e.message));
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

  const releases = useMemo(() => groupReleases(tracks), [tracks]);
  const filteredReleases = useMemo(() => {
    if (releaseTab === "singles") return releases.filter((r) => r.isSingle);
    return releases.filter((r) => !r.isSingle);
  }, [releases, releaseTab]);

  const heroCoverUrl = useMemo(() => {
    const fromPopular = popular.find((t) => t.coverUrl)?.coverUrl;
    const fromAny = tracks.find((t) => t.coverUrl)?.coverUrl;
    const fromRelease = releases.find((r) => r.coverUrl)?.coverUrl;
    return fromPopular ?? fromRelease ?? fromAny ?? artist?.imageUrl ?? artist?.avatarUrl ?? null;
  }, [popular, tracks, releases, artist?.imageUrl, artist?.avatarUrl]);

  const coverSrc = heroCoverUrl ? mediaUrl(heroCoverUrl) : null;
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
  if (!artist) return <div className={s.loading}>Загрузка…</div>;

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

      {releases.length > 0 && (
        <section className={s.music}>
          <div className={s.musicHead}>
            <h2 className={s.sectionTitle}>Музыка</h2>
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
              className={`${s.tab} ${releaseTab === "singles" ? s.active : ""}`}
              onClick={() => setReleaseTab("singles")}
            >
              Синглы и EP
            </button>
          </div>
          <div className={s.releaseGrid}>
            {filteredReleases.map((r) => (
              <Link key={r.key} href={releaseUrl(slug!, r)} className={s.releaseCard}>
                <div className={s.releaseCover}>
                  {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(r.coverUrl)} alt="" className={s.releaseImg} />
                  ) : null}
                </div>
                <div className={s.releaseTitle}>{r.title}</div>
                <div className={s.releaseMeta}>
                  {r.year ? `${r.year} · ` : ""}
                  {r.isSingle ? "Сингл" : "Альбом"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className={s.related}>
          <h2 className={s.sectionTitle}>Похожие исполнители</h2>
          <div className={s.relatedGrid}>
            {related.map((a) => (
              <Link key={a.id} href={`/artists/${a.slug}`} className={s.relatedCard}>
                <ArtistAvatar
                  name={a.name}
                  avatarUrl={a.avatarUrl}
                  imageUrl={a.imageUrl}
                  className={s.relatedAvatar}
                  imgClassName={s.relatedImg}
                />
                <div className={s.relatedName}>{a.name}</div>
                <div className={s.relatedType}>Исполнитель</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
